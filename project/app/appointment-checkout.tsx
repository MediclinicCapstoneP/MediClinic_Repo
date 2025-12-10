import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { X, AlertCircle } from 'lucide-react-native';
import PaymentWebView from '../components/payment/PaymentWebView';
import { retrieveCheckoutSession } from '../services/paymongo.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appointmentService } from '../services/appointmentService';
import { AppointmentType, PaymentMethod } from '../lib/supabase';

const PENDING_BOOKING_KEY = 'pending_booking_data';
const CHECKOUT_SESSION_KEY = 'checkout_session_id';

interface StoredBookingPayload {
  patient_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: AppointmentType;
  patient_notes?: string;
  consultation_fee: number;
  booking_fee: number;
  total_amount: number;
  duration?: number;
}

type CheckoutParams = {
  checkoutUrl?: string;
  sessionId?: string;
  amount?: string;
};

export default function AppointmentCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<CheckoutParams>();

  const [loading, setLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyingMessage, setVerifyingMessage] = useState<string | null>(null);
  const [selectedPaymentMethod] = useState<PaymentMethod>('gcash');
  const [bookingData, setBookingData] = useState<StoredBookingPayload | null>(null);

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get checkout URL from params or AsyncStorage
        const url = params.checkoutUrl || null;
        const sessionId = params.sessionId || null;

        if (!url && !sessionId) {
          // Try to get from AsyncStorage
          const storedSession = await AsyncStorage.getItem(CHECKOUT_SESSION_KEY);
          const storedBooking = await AsyncStorage.getItem(PENDING_BOOKING_KEY);

          if (storedSession && storedBooking) {
            setCheckoutSessionId(storedSession);
            setBookingData(JSON.parse(storedBooking));
            // We need to retrieve the checkout URL from the session
            try {
              const session = await retrieveCheckoutSession(storedSession);
              const sessionUrl = session?.attributes?.checkout_url;
              if (sessionUrl) {
                setCheckoutUrl(sessionUrl);
              } else {
                throw new Error('Checkout URL not found in session');
              }
            } catch (err) {
              throw new Error('Unable to retrieve checkout session. Please start a new booking.');
            }
          } else {
            throw new Error('No checkout session found. Please start a new booking.');
          }
        } else {
          if (url) setCheckoutUrl(url);
          if (sessionId) setCheckoutSessionId(sessionId);

          // Load booking data
          const storedBooking = await AsyncStorage.getItem(PENDING_BOOKING_KEY);
          if (storedBooking) {
            setBookingData(JSON.parse(storedBooking));
          }
        }
      } catch (err: any) {
        console.error('Checkout initialization error:', err);
        setError(err?.message || 'Failed to initialize checkout. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [params.checkoutUrl, params.sessionId]);

  const verifyCheckoutSessionWithRetry = useCallback(async (sessionId: string, maxRetries: number) => {
    // Wait a bit before first check to give PayMongo time to update
    await new Promise(resolve => setTimeout(resolve, 2000));

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Verifying checkout session (attempt ${attempt + 1}/${maxRetries})...`);
        const session = await retrieveCheckoutSession(sessionId);
        const status = session?.attributes?.status;
        
        console.log(`Checkout session status: ${status}`);

        // Check for paid status
        if (status === 'paid') {
          console.log('Payment confirmed as paid!');
          return { success: true, status };
        }

        // If status is unpaid, don't retry immediately - wait longer
        if (status === 'unpaid') {
          console.log('Payment status is still unpaid, will retry...');
          // Don't return false immediately, continue retrying
        }

        // Check for payment_intent_id which indicates a payment was initiated
        const paymentIntentId = (session?.attributes as any)?.payment_intent_id;
        if (paymentIntentId && status !== 'unpaid') {
          console.log('Found payment_intent_id, payment likely processed:', paymentIntentId);
          // If we have a payment_intent_id and status is not unpaid, it's likely paid
          // But we'll still wait for explicit 'paid' status
        }

        // Check for other possible success indicators in the session
        // PayMongo might include payment data in different formats
        const sessionData = session as any;
        if (sessionData?.attributes?.payments) {
          const payments = sessionData.attributes.payments;
          const hasSuccessfulPayment = payments.some((payment: any) => 
            payment?.attributes?.status === 'paid' || 
            payment?.attributes?.status === 'succeeded' ||
            payment?.status === 'paid'
          );

          if (hasSuccessfulPayment) {
            console.log('Found successful payment in session!');
            return { success: true, status: 'paid' };
          }
        }

        // Log the full session for debugging
        if (attempt === maxRetries - 1) {
          console.log('Final attempt - session data:', JSON.stringify(session, null, 2));
        }
      } catch (verificationError) {
        console.error(`Error retrieving checkout session (attempt ${attempt + 1}):`, verificationError);
      }

      // Progressive delay: 3s, 5s, 7s, 10s, 15s
      if (attempt < maxRetries - 1) {
        const delay = Math.min(3000 + (attempt * 2000), 15000);
        console.log(`Waiting ${delay}ms before next verification attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log('Verification timeout - all retry attempts exhausted');
    return { success: false, status: 'timeout' } as const;
  }, []);

  const finalizeAppointment = useCallback(async (
    payload: StoredBookingPayload,
    sessionId: string,
  ) => {
    const appointmentResponse = await appointmentService.createAppointment({
      patient_id: payload.patient_id,
      clinic_id: payload.clinic_id,
      appointment_date: payload.appointment_date,
      appointment_time: payload.appointment_time,
      appointment_type: payload.appointment_type,
      patient_notes: payload.patient_notes,
      duration_minutes: payload.duration || 30,
      consultation_fee: payload.consultation_fee,
      booking_fee: payload.booking_fee,
    });

    if (!appointmentResponse.success || !appointmentResponse.appointment) {
      throw new Error(appointmentResponse.error || 'Failed to create appointment after payment');
    }

    const appointmentId = appointmentResponse.appointment.id;

    const paymentResponse = await appointmentService.processPayment({
      appointment_id: appointmentId,
      payment_method: selectedPaymentMethod,
      amount: payload.total_amount,
    });

    if (!paymentResponse.success) {
      throw new Error(paymentResponse.error || 'Failed to record payment');
    }

    return appointmentId;
  }, [selectedPaymentMethod]);

  const handleCheckoutSuccess = useCallback(async () => {
    if (!checkoutSessionId) {
      setError('No checkout session to verify.');
      return;
    }

    if (!bookingData) {
      setError('Booking data not found.');
      return;
    }

    setVerifying(true);
    setVerifyingMessage('Verifying payment with PayMongo…');

    try {
      // Increase retries to 6 attempts with progressive delays
      const verification = await verifyCheckoutSessionWithRetry(checkoutSessionId, 6);
      
      if (!verification.success) {
        // If verification failed, check one more time after a longer delay
        console.log('Initial verification failed, doing final check after 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
          const finalCheck = await retrieveCheckoutSession(checkoutSessionId);
          const finalStatus = finalCheck?.attributes?.status;
          const payments = finalCheck?.attributes?.payments || [];
          const hasSuccessfulPayment = payments.some((payment: any) => 
            payment?.attributes?.status === 'paid' || payment?.attributes?.status === 'succeeded'
          );

          if (finalStatus === 'paid' || hasSuccessfulPayment) {
            console.log('Payment confirmed on final check!');
            // Continue with appointment creation below
          } else {
            throw new Error(
              `Payment verification failed. Status: ${finalStatus}. ` +
              `Please contact support if payment was successful. Session ID: ${checkoutSessionId}`
            );
          }
        } catch (finalCheckError) {
          console.error('Final verification check failed:', finalCheckError);
          throw new Error(
            `Payment verification failed after multiple attempts. ` +
            `If payment was successful, please contact support with session ID: ${checkoutSessionId}`
          );
        }
      }

      // If we reach here, payment is confirmed
      setVerifyingMessage('Payment confirmed. Finalizing appointment…');

      const appointmentId = await finalizeAppointment(bookingData, checkoutSessionId);

      setVerifyingMessage('Appointment confirmed!');

      // Clear stored data
      await AsyncStorage.removeItem(PENDING_BOOKING_KEY);
      await AsyncStorage.removeItem(CHECKOUT_SESSION_KEY);

      // Navigate back with success
      router.replace({
        pathname: '/(tabs)/patient',
        params: { bookingSuccess: 'true', appointmentId },
      });
    } catch (err) {
      console.error('Error verifying checkout session:', err);
      const message = err instanceof Error ? err.message : 'Unable to verify payment.';
      setError(message);
      setVerifying(false);
      setVerifyingMessage(null);
    }
  }, [checkoutSessionId, bookingData, verifyCheckoutSessionWithRetry, finalizeAppointment, router]);

  const handleCheckoutError = (message: string) => {
    console.error('PayMongo checkout error:', message);
    setError(message || 'Payment failed. Please try again.');
  };

  const handleClose = () => {
    router.back();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Payment Checkout',
            headerShown: true,
            headerBackVisible: false,
            headerLeft: () => (
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !verifying) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Payment Error',
            headerShown: true,
            headerBackVisible: false,
            headerLeft: () => (
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Payment Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleClose}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (verifying) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Verifying Payment',
            headerShown: true,
            headerBackVisible: false,
          }}
        />
        <View style={styles.verifyingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.verifyingTitle}>Finishing up…</Text>
          <Text style={styles.verifyingSubtitle}>
            {verifyingMessage || 'We are confirming your payment and booking your appointment.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!checkoutUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Payment Error',
            headerShown: true,
            headerBackVisible: false,
            headerLeft: () => (
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load checkout. Please try again later.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleClose}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Pay with GCash',
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.content}>
        {bookingData && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>Amount Due</Text>
            <Text style={styles.summaryValue}>{formatCurrency(bookingData.total_amount)}</Text>
          </View>
        )}
        <View style={styles.webviewContainer}>
          <PaymentWebView
            url={checkoutUrl}
            onSuccess={handleCheckoutSuccess}
            onError={handleCheckoutError}
            onClose={handleClose}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  verifyingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  verifyingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  webviewContainer: {
    flex: 1,
  },
});

