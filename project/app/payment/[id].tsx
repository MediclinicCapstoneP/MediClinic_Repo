import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import PaymentWebView from '../../components/payment/PaymentWebView';
import { createCheckoutSession } from '../../services/paymongo.service';

type PaymentParams = {
  id: string;
  amount: string;
  description: string;
};

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PaymentParams>();
  
  const [loading, setLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate parameters
        const amount = parseFloat(params.amount || '0');
        if (!amount || amount <= 0) {
          throw new Error('Invalid payment amount');
        }

        console.log('Creating PayMongo checkout session...', { amount, description: params.description });
        
        // Create a checkout session with PayMongo
        const checkoutSession = await createCheckoutSession(
          amount, 
          params.description || 'Payment for appointment',
          {
            paymentMethodTypes: ['gcash'],
            metadata: {
              appointment_reference: params.id || '',
              description: params.description || '',
            },
          }
        );
        
        console.log('Checkout session created:', checkoutSession);
        
        // Validate checkout URL
        const url = checkoutSession?.attributes?.checkout_url;
        if (!url) {
          throw new Error('Checkout URL not provided by PayMongo');
        }
        
        console.log('Checkout URL:', url);
        setCheckoutUrl(url);
        
      } catch (err: any) {
        console.error('Payment initialization error:', err);
        const errorMessage = err?.message || 'Failed to initialize payment. Please try again.';
        setError(errorMessage);
        Alert.alert('Payment Error', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (params.amount) {
      initializePayment();
    } else {
      setError('Payment amount is required');
      setLoading(false);
    }
  }, [params]);

  const handlePaymentSuccess = () => {
    // Handle successful payment
    Alert.alert(
      'Payment Successful',
      'Your payment has been processed successfully!',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/appointments'),
        },
      ]
    );
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Secure Payment' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Initializing payment...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Payment Error' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!checkoutUrl) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Payment Error' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to process payment. Please try again later.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Secure Payment' }} />
      <PaymentWebView
        url={checkoutUrl}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onClose={handleClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
