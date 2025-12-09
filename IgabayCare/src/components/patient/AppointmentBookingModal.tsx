import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { appointmentBookingService } from '../../features/auth/utils/appointmentBookingService';
import { AppointmentNotificationService } from '../../services/appointmentNotificationService';
import { supabase } from '../../supabaseClient';
import type { AppointmentType } from '../../types/appointments';
import { paymongoService } from '../../services/paymongoService';
import { X, ChevronLeft, ChevronRight, Clock, CheckCircle } from 'lucide-react';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: {
    id: string;
    clinic_name: string;
    operating_hours?: any;
  };
  patientId: string;
  onAppointmentBooked?: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  formatted: string;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  clinic,
  patientId,
  onAppointmentBooked
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('consultation');
  const [patientNotes, setPatientNotes] = useState('');
  const [patientData, setPatientData] = useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  // Services selection state
  const [servicesOptions, setServicesOptions] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // -------- Calendar helpers ----------
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isPastDate = date < today;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected =
        selectedDate && date.toDateString() === selectedDate.toDateString();
      const isAvailable = isCurrentMonth && !isPastDate && isClinicOpenOnDate(date);

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isPastDate,
        isToday,
        isSelected,
        isAvailable
      });
    }

    return days;
  };

  const isClinicOpenOnDate = (date: Date): boolean => {
    if (!clinic.operating_hours) return true;
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const dayHours = clinic.operating_hours[dayName];
    return dayHours && dayHours.open && dayHours.close;
  };

  // -------- Time slots ----------
  const loadTimeSlots = async (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date in loadTimeSlots:", date);
      setAvailableTimeSlots([]);
      return;
    }

    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const slots = await appointmentBookingService.getAvailableTimeSlots(clinic.id, dateStr);
      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // -------- Appointment handlers ----------
  const handleDateSelect = (date: Date, isAvailable: boolean) => {
    if (!isAvailable) return;
    const validDate = new Date(date);
    if (isNaN(validDate.getTime())) return;

    setSelectedDate(validDate);
    setSelectedTime('');
    loadTimeSlots(validDate);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const composedNotes = buildComposedNotes(patientNotes, selectedServices);

      const result = await appointmentBookingService.createAppointment({
        patient_id: patientId,
        clinic_id: clinic.id,
        appointment_date: dateStr,
        appointment_time: selectedTime + ':00',
        appointment_type: appointmentType,
        patient_notes: composedNotes,
        status: 'scheduled'
      });

      if (result.success && result.appointment) {
        // Get patient details for notification
        const { data: patient } = await supabase
          .from('patients')
          .select('first_name, last_name')
          .eq('id', patientId)
          .single();

        const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Patient';

        // Send notification to clinic about new appointment
        await AppointmentNotificationService.notifyClinicOfNewAppointment({
          appointmentId: result.appointment.id,
          patientId: patientId,
          clinicId: clinic.id,
          appointmentDate: dateStr,
          appointmentTime: selectedTime,
          patientName: patientName,
          clinicName: clinic.clinic_name
        });

        // Create patient notification (existing functionality)
        const notificationResult = await appointmentBookingService.createAppointmentNotification(
          patientId,
          clinic.clinic_name,
          dateStr,
          selectedTime,
          result.appointment.id // Pass the appointment ID
        );

        if (notificationResult.success) {
          setNotificationSent(true);
          console.log('✅ Appointment notification created successfully');
          console.log('📧 Notification details:', {
            title: 'Appointment Confirmed',
            message: `Your appointment at ${clinic.clinic_name} has been scheduled for ${dateStr} at ${selectedTime}`,
            type: 'appointment_confirmed',
            appointment_id: result.appointment.id
          });
        } else {
          console.warn('⚠️ Appointment notification failed to send');
        }

        setBookingSuccess(true);
        onAppointmentBooked?.();
        
        // Reset form after short delay to show success
        setTimeout(() => {
          onClose();
          setSelectedDate(null);
          setSelectedTime('');
          setPatientNotes('');
          setBookingSuccess(false);
          setNotificationSent(false);
        }, 2000);
      } else {
        alert(`Failed to book appointment: ${result.error}`);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------- Payments ----------
  const calculateAppointmentCost = () => {
    const baseFee = 500, bookingFee = 50;
    return { consultation_fee: baseFee, booking_fee: bookingFee, total_amount: baseFee + bookingFee };
  };

  const handleProceedToGCashPayment = async () => {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      const cost = calculateAppointmentCost();
      const dateStr = selectedDate.toISOString().split('T')[0];
      const composedNotes = buildComposedNotes(patientNotes, selectedServices);
      
      // Create checkout session (payment first, booking later)
      const successUrl = `${window.location.origin}/patient/payment-return`;
      
      const checkoutResult = await paymongoService.processCheckoutSessionPayment({
        amount: cost.total_amount,
        description: `Appointment booking at ${clinic.clinic_name}`,
        patient_name: patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Patient',
        patient_email: patientData?.email || '',
        patient_phone: patientData?.phone || '09XXXXXXXXX',
        success_url: successUrl,
        clinic_id: clinic.id,
        clinic_name: clinic.clinic_name,
        appointment_date: dateStr,
        appointment_time: selectedTime,
        appointment_type: appointmentType,
        patient_notes: composedNotes,
        consultation_fee: cost.consultation_fee,
        booking_fee: cost.booking_fee,
        patient_id: patientId,
        metadata: {
          selected_services: selectedServices.join(',')
        }
      });

      if (checkoutResult.success && checkoutResult.checkout_url) {
        // Store booking data in sessionStorage for after payment
        const bookingData = {
          patient_id: patientId,
          clinic_id: clinic.id,
          appointment_date: dateStr,
          appointment_time: selectedTime + ':00',
          appointment_type: appointmentType,
          patient_notes: composedNotes,
          consultation_fee: cost.consultation_fee,
          booking_fee: cost.booking_fee,
          total_amount: cost.total_amount,
          selected_services: selectedServices
        };
        
        sessionStorage.setItem('pending_booking_data', JSON.stringify(bookingData));
        sessionStorage.setItem('checkout_session_id', checkoutResult.checkout_session_id || '');
        
        // Redirect to checkout URL
        window.location.href = checkoutResult.checkout_url;
      } else {
        alert(checkoutResult.error || 'Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Error initiating GCash payment:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Note: handleGCashPaymentComplete, handleGCashPaymentError, and handleGCashPaymentCancel
  // are no longer needed since we're using checkout sessions which redirect to PaymentReturn page

  // -------- Month nav ----------
  const navigateMonth = (dir: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (dir === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    setSelectedTime('');
  };

  // -------- Effects ----------
  useEffect(() => {
    if (selectedDate) loadTimeSlots(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (isOpen) {
      // Load patient data for payment modal
      supabase.auth.getUser().then(({ data: user }) => {
        if (user?.user) {
          supabase.from('patients').select('*').eq('user_id', user.user.id).single().then(({ data: patient }) => {
            if (patient) setPatientData({ ...patient, email: user.user.email });
          });
        }
      });

      // Load clinic services to offer as selectable options
      if (clinic?.id) {
        (async () => {
          try {
            const { data } = await supabase
              .from('clinics')
              .select('services, custom_services')
              .eq('id', clinic.id)
              .single();
            
            const combined = [
              ...(Array.isArray(data?.services) ? data!.services : []),
              ...(Array.isArray(data?.custom_services) ? data!.custom_services : []),
            ]
              .map((s: any) => (typeof s === 'string' ? s : String(s)))
              .filter(Boolean);
            setServicesOptions(Array.from(new Set(combined)).sort());
          } catch {
            setServicesOptions([]);
          }
        })();
      }

      // Reset selections when opening
      setSelectedServices([]);
    }
  }, [isOpen, clinic?.id]);

  if (!isOpen) return null;

  const calendarDays = generateCalendarDays();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Helpers
  const buildComposedNotes = (notes: string, services: string | string[]) => {
    const serviceList = Array.isArray(services) ? services : (services ? [services] : []);
    if (serviceList.length === 0) return notes || '';
    const header = 'Requested services: ' + serviceList.join(', ');
    return notes ? `${header}\n${notes}` : header;
  };

  const toggleServiceSelection = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col">
          {/* Fixed Header */}
          <div className="flex-shrink-0">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Book Appointment</h2>
                <p className="text-xs sm:text-sm text-gray-600">{clinic?.clinic_name}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            {/* Scroll Indicator */}
            <div className="px-3 sm:px-6 py-2 bg-blue-50 border-b border-blue-200">
              <p className="text-xs text-blue-700 text-center font-medium">
                📅 Select a date → ⏰ Choose time → 📝 Fill details → ✅ Book appointment
              </p>
            </div>
          </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          <div className="space-y-6 pb-6">{/* Added padding bottom for better scrolling */}
              {/* Date Selection Section */}
              <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold">Select Date</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="font-medium text-gray-900 min-w-[120px] text-center">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                    const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));
                    const isAvailable = !isPast && day.isCurrentMonth;

                    return (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(day.date, day.isAvailable)}
                        disabled={!day.isAvailable}
                        className={`
                h-10 w-10 flex items-center justify-center rounded-lg text-sm transition-colors
                ${isToday ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                ${isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                ${isPast || !isAvailable ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
              `}
                      >
                        {day.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection Section */}
              {selectedDate && (
                <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-gray-600" />
                    Available Times for {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h3>

                  {loading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 pr-2">
                        {availableTimeSlots.map(slot => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`
                      px-3 py-2 text-sm border rounded-lg transition-colors flex-shrink-0
                      ${selectedTime === slot.time
                                ? 'bg-blue-600 text-white border-blue-600'
                                : slot.available
                                  ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                  : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                              }
                    `}
                          >
                            {slot.formatted}
                          </button>
                        ))}
                      </div>
                      {availableTimeSlots.length > 12 && (
                        <div className="mt-2 text-xs text-gray-500 text-center">
                          Scroll to see more time slots
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Appointment Details Section */}
              {selectedDate && selectedTime && (
                <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Appointment Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Appointment Type
                      </label>
                      <select
                        value={appointmentType}
                        onChange={e => setAppointmentType(e.target.value as AppointmentType)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="consultation">General Consultation</option>
                        <option value="routine_checkup">Routine Checkup</option>
                        <option value="follow_up">Follow-up Visit</option>
                        <option value="specialist_visit">Specialist Visit</option>
                        <option value="vaccination">Vaccination</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Services Needed <span className="text-gray-500">(select all that apply)</span>
                      </label>
                      {servicesOptions.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {servicesOptions.map((svc) => {
                            const selected = selectedServices.includes(svc);
                            return (
                              <button
                                type="button"
                                key={svc}
                                onClick={() => toggleServiceSelection(svc)}
                                className={`px-4 py-2 rounded-lg border text-sm transition-all duration-200 ${
                                  selected 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                                }`}
                              >
                                {selected && (
                                  <CheckCircle className="inline h-4 w-4 mr-1" />
                                )}
                                {svc}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">No specific services listed by the clinic. You may describe your needs in the notes below.</p>
                        </div>
                      )}
                      
                      {selectedServices.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Selected Services:</strong> {selectedServices.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes <span className="text-gray-500">(Optional)</span>
                      </label>
                      <textarea
                        value={patientNotes}
                        onChange={e => setPatientNotes(e.target.value)}
                        placeholder="Describe your symptoms, concerns, or any additional information..."
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary and Actions Section */}
              {selectedDate && selectedTime && (
                <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6">
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Appointment Summary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Clinic:</span>
                        <span className="font-medium text-gray-900">{clinic?.clinic_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium text-gray-900">
                          {appointmentType === 'consultation' ? 'General Consultation' :
                           appointmentType === 'routine_checkup' ? 'Routine Checkup' :
                           appointmentType === 'follow_up' ? 'Follow-up Visit' :
                           appointmentType === 'specialist_visit' ? 'Specialist Visit' :
                           appointmentType === 'vaccination' ? 'Vaccination' : 'Other'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">{selectedDate.toLocaleDateString('en-US')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium text-gray-900">{selectedTime}</span>
                      </div>
                      {selectedServices.length > 0 && (
                        <div className="sm:col-span-2">
                          <span className="text-gray-600">Services:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedServices.map(service => (
                              <span key={service} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="sm:w-auto">
                      Cancel
                    </Button>
                    {bookingSuccess ? (
                      <div className="flex flex-col items-center justify-center text-green-600 bg-green-50 px-4 py-3 rounded-lg">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Appointment Booked Successfully!</span>
                        {notificationSent && (
                          <span className="text-xs text-green-500 mt-1">✓ Notifications sent</span>
                        )}
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={handleProceedToGCashPayment}
                          disabled={!selectedDate || !selectedTime || loading}
                          className="bg-green-600 hover:bg-green-700 text-white sm:w-auto"
                        >
                          Pay with GCash (₱{calculateAppointmentCost().total_amount})
                        </Button>
                        <Button
                          onClick={handleBookAppointment}
                          disabled={!selectedDate || !selectedTime || loading}
                          loading={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white sm:w-auto"
                        >
                          Book Without Payment
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* No date selected message */}
              {!selectedDate && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Date</h3>
                  <p className="text-gray-600">Choose a date from the calendar above to view available appointment times.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
    </>
  );
};
