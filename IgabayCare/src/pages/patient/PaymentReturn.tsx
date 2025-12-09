import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { paymongoService } from '../../services/paymongoService';
import { appointmentBookingService } from '../../features/auth/utils/appointmentBookingService';
import { supabase } from '../../supabaseClient';

const PaymentReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const hasProcessedRef = useRef(false);
  const bookingCreatedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing (React Strict Mode protection)
    if (hasProcessedRef.current) {
      console.log('⚠️ Payment return already processed, skipping duplicate execution');
      return;
    }
    
    const handlePaymentReturn = async () => {
      hasProcessedRef.current = true; // Mark as processed immediately
      
      try {
        // Get checkout session ID from URL params or sessionStorage
        let checkoutSessionId = searchParams.get('checkout_session_id') || 
                                searchParams.get('session_id') ||
                                sessionStorage.getItem('checkout_session_id');
        
        // If PayMongo didn't replace the placeholder or it's invalid, use sessionStorage
        if (!checkoutSessionId || checkoutSessionId === '{CHECKOUT_SESSION_ID}' || checkoutSessionId.includes('{')) {
          console.warn('⚠️ Invalid checkout session ID from URL, using sessionStorage');
          checkoutSessionId = sessionStorage.getItem('checkout_session_id');
        }
        
        console.log('📋 Checkout session ID sources:', {
          urlParam: searchParams.get('checkout_session_id'),
          sessionStorage: sessionStorage.getItem('checkout_session_id'),
          final: checkoutSessionId
        });
        
        if (!checkoutSessionId || checkoutSessionId === '{CHECKOUT_SESSION_ID}') {
          console.error('❌ No valid checkout session ID found');
          setError('No payment information found. Please check your payment status or contact support.');
          setPaymentStatus('failed');
          setLoading(false);
          return;
        }

        // Validate checkout session ID format (should start with 'cs_')
        if (!checkoutSessionId.startsWith('cs_')) {
          console.error('❌ Invalid checkout session ID format:', checkoutSessionId);
          setError('Invalid payment reference. Please contact support.');
          setPaymentStatus('failed');
          setLoading(false);
          return;
        }

        // Verify checkout session payment status with retry logic
        let result: { success: boolean; checkout_session_id?: string; status?: string; error?: string } | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          result = await paymongoService.verifyCheckoutSessionPayment(checkoutSessionId);
          
          if (result && result.success) {
            break; // Success, exit retry loop
          }
          
          // If verification failed but we have booking data, wait a bit and retry
          // (PayMongo might need a moment to update the status)
          if (retryCount < maxRetries - 1) {
            console.log(`⏳ Payment verification attempt ${retryCount + 1} failed, retrying in 2 seconds... Status: ${result?.status}, Error: ${result?.error}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retryCount++;
          } else {
            retryCount++;
          }
        }
        
        console.log('📊 Final verification result:', result);
        
        if (!result) {
          setPaymentStatus('failed');
          setError('Failed to verify payment status. Please contact support.');
          setLoading(false);
          return;
        }
        
        if (result.success) {
          setPaymentStatus('success');
          setPaymentDetails({
            checkoutSessionId: result.checkout_session_id,
            status: result.status
          });
          
          // Create booking if payment succeeded and booking data exists
          const storedBookingData = sessionStorage.getItem('pending_booking_data');
          const storedCheckoutSessionId = sessionStorage.getItem('checkout_session_id');
          
          if (storedBookingData && storedCheckoutSessionId === checkoutSessionId && !bookingCreatedRef.current) {
            try {
              const bookingData = JSON.parse(storedBookingData);
              
              // Check if appointment already exists for this checkout session
              // First check by payment_intent_id (checkout session ID)
              let { data: existingAppointment } = await supabase
                .from('appointments')
                .select('id')
                .eq('payment_intent_id', checkoutSessionId)
                .maybeSingle();
              
              // If not found, check by unique combination (patient, clinic, date, time)
              if (!existingAppointment) {
                const { data: duplicateAppointment } = await supabase
                  .from('appointments')
                  .select('id')
                  .eq('patient_id', bookingData.patient_id)
                  .eq('clinic_id', bookingData.clinic_id)
                  .eq('appointment_date', bookingData.appointment_date)
                  .eq('appointment_time', bookingData.appointment_time)
                  .in('status', ['confirmed', 'scheduled'])
                  .maybeSingle();
                
                if (duplicateAppointment) {
                  console.log('⚠️ Duplicate appointment found by patient/clinic/date/time:', duplicateAppointment.id);
                  existingAppointment = duplicateAppointment;
                }
              }
              
              if (existingAppointment) {
                console.log('⚠️ Appointment already exists for this checkout session or duplicate booking detected:', existingAppointment.id);
                bookingCreatedRef.current = true;
                // Don't create another booking
              } else {
                // Mark as creating to prevent duplicate creation
                bookingCreatedRef.current = true;
                
                // Get patient name for the appointment
                const { data: patientInfo } = await supabase
                  .from('patients')
                  .select('first_name, last_name')
                  .eq('id', bookingData.patient_id)
                  .single();
                
                const patientName = patientInfo 
                  ? `${patientInfo.first_name} ${patientInfo.last_name}`.trim()
                  : undefined;
                
                // Create the appointment
                const bookingResult = await appointmentBookingService.createAppointment({
                  patient_id: bookingData.patient_id,
                  clinic_id: bookingData.clinic_id,
                  appointment_date: bookingData.appointment_date,
                  appointment_time: bookingData.appointment_time,
                  appointment_type: bookingData.appointment_type,
                  patient_notes: bookingData.patient_notes,
                  status: 'confirmed',
                  payment_method: 'gcash',
                  payment_status: 'paid',
                  payment_intent_id: checkoutSessionId,
                  total_amount: bookingData.total_amount,
                  consultation_fee: bookingData.consultation_fee,
                  booking_fee: bookingData.booking_fee,
                  patient_name: patientName
                });

                if (bookingResult.success && bookingResult.appointment) {
                  // Get clinic name for notifications
                  const { data: clinic } = await supabase
                    .from('clinics')
                    .select('clinic_name')
                    .eq('id', bookingData.clinic_id)
                    .single();

                  // Get patient details for notification
                  const { data: patient } = await supabase
                    .from('patients')
                    .select('first_name, last_name, user_id')
                    .eq('id', bookingData.patient_id)
                    .single();

                  const clinicName = clinic?.clinic_name || 'Clinic';

                  // Create single combined notification for patient (appointment + payment)
                  try {
                    // Check if a notification for this appointment already exists
                    const { data: existingNotification } = await supabase
                      .from('notifications')
                      .select('id')
                      .eq('appointment_id', bookingResult.appointment.id)
                      .eq('user_id', patient?.user_id)
                      .maybeSingle();

                    if (!existingNotification && patient?.user_id) {
                      const formattedDate = new Date(bookingData.appointment_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });

                      const formattedTime = new Date(`2000-01-01T${bookingData.appointment_time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      });

                      await supabase
                        .from('notifications')
                        .insert([{
                          user_id: patient.user_id,
                          appointment_id: bookingResult.appointment.id,
                          title: 'Appointment Confirmed & Payment Successful',
                          message: `Your appointment at ${clinicName} on ${formattedDate} at ${formattedTime} has been confirmed. Payment of ₱${bookingData.total_amount.toFixed(2)} was successful.`,
                          type: 'system',
                          is_read: false
                        }]);
                      console.log('✅ Combined patient notification created successfully');
                    } else {
                      console.log('⚠️ Notification for this appointment already exists, skipping creation.');
                    }
                  } catch (notifError) {
                    console.warn('⚠️ Failed to create combined patient notification (non-critical):', notifError);
                  }

                  bookingCreatedRef.current = true;
                  console.log('✅ Booking created successfully after payment');
                  
                  // Mark in sessionStorage that booking was created to prevent webhook from creating duplicate
                  sessionStorage.setItem('booking_created_for_session', checkoutSessionId);
                  sessionStorage.setItem('last_booking_checkout_session', checkoutSessionId);
                } else {
                  console.error('❌ Failed to create booking:', bookingResult.error);
                  setError(`Payment successful but booking creation failed: ${bookingResult.error}`);
                }
              }
            } catch (bookingError) {
              console.error('❌ Error creating booking:', bookingError);
              setError('Payment successful but booking creation failed. Please contact support.');
            }
          }
          
          // Clear session storage
          sessionStorage.removeItem('pending_booking_data');
          sessionStorage.removeItem('checkout_session_id');
          
          // Show success message briefly, then redirect
          setTimeout(() => {
            navigate('/patient/dashboard?payment=success&booking=' + (bookingCreatedRef.current ? 'created' : 'pending'), { replace: true });
          }, 2000); // Show success message for 2 seconds before redirect
        } else {
          setPaymentStatus('failed');
          const errorMessage = result.error || `Payment verification failed. Status: ${result.status || 'unknown'}`;
          console.error('❌ Payment verification failed:', {
            status: result.status,
            error: result.error,
            checkoutSessionId: result.checkout_session_id
          });
          setError(errorMessage);
        }
      } catch (err: any) {
        console.error('Payment return error:', err);
        setError(err.message || 'Failed to verify payment status. Please check your payment manually or contact support.');
        setPaymentStatus('failed');
        
        // Show helpful message if it's a timeout
        if (err.message?.includes('timeout') || err.message?.includes('timed out')) {
          setError('Payment verification timed out. Your payment may have succeeded. Please check your payment status or contact support.');
        }
      } finally {
        setLoading(false);
      }
    };

    handlePaymentReturn();
  }, [searchParams, navigate]); // Removed dependencies to prevent re-execution

  const handleReturnHome = () => {
    // Clear any remaining session data
    sessionStorage.removeItem('pending_booking_data');
    sessionStorage.removeItem('checkout_session_id');
    sessionStorage.removeItem('paymongo_payment_intent_id');
    sessionStorage.removeItem('paymongo_appointment_id');
    navigate('/patient/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-600 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              Your GCash payment has been processed successfully.
            </p>
            
            {paymentDetails && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-green-800 mb-2">Payment Details:</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><span className="font-medium">Checkout Session ID:</span> {paymentDetails.checkoutSessionId}</p>
                  <p><span className="font-medium">Status:</span> {paymentDetails.status}</p>
                  <p><span className="font-medium">Method:</span> GCash via PayMongo</p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p>✅ Payment confirmation sent to your email</p>
              <p>📱 SMS reminder will be sent before your appointment</p>
              <p>🏥 You can view your appointment in your dashboard</p>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Redirecting to dashboard in a few seconds...
            </p>

            <Button 
              onClick={handleReturnHome}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment failed or error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Payment Failed
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'Your payment could not be processed.'}
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800 mb-2">What happened?</h3>
            <div className="text-sm text-red-700 space-y-1">
              <p>• Payment was cancelled or declined</p>
              <p>• Insufficient GCash balance</p>
              <p>• Network connection issues</p>
              <p>• Payment timeout</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/patient/dashboard?payment=failed', { replace: true })}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/patient/dashboard', { replace: true })}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReturn;
