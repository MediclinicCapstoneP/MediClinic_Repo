import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { doctorDashboardService } from '../../features/auth/utils/doctorDashboardService';
import { DoctorAppointmentService, DoctorAppointment } from '../../services/doctorAppointmentService';
import { AppointmentServicesService } from '../../features/auth/utils/appointmentServicesService';
import { prescriptionService } from '../../services/prescriptionService';
import { AppointmentCompletionService } from '../../services/appointmentCompletionService';
import { EnhancedAppointmentCompletionModal } from '../../components/doctor/EnhancedAppointmentCompletionModal';
import { AppointmentHistoryService } from '../../services/appointmentHistoryService';
import { SkeletonTable, Skeleton, SkeletonAppointmentCard } from '../../components/ui/Skeleton';
import { DoctorAppointmentDebug } from '../../components/debug/DoctorAppointmentDebug';
import { DatabaseConnectionTest } from '../../components/debug/DatabaseConnectionTest';
import { ComprehensiveAppointmentValidator } from '../../components/debug/ComprehensiveAppointmentValidator';
import { DoctorAppointmentDiagnostic } from '../../components/debug/DoctorAppointmentDiagnostic';
import { SimpleAppointmentTest } from '../../components/debug/SimpleAppointmentTest';
import { 
  Calendar, Clock, User, Stethoscope, FileText, Pill, Edit3,
  CheckCircle, AlertCircle, Eye, Plus, X, Save, Phone, Mail, MapPin
} from 'lucide-react';
import { 
  AppointmentWithDetails, 
  AppointmentStatus, 
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_PRIORITIES,
  APPOINTMENT_PRIORITY_COLORS
} from '../../types/appointments';

interface DoctorAppointmentsProps {
  doctorId: string;
}

export const DoctorAppointments: React.FC<DoctorAppointmentsProps> = ({ doctorId }) => {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null);
  const [showStartAppointmentModal, setShowStartAppointmentModal] = useState(false);
  const [showCompleteAppointmentModal, setShowCompleteAppointmentModal] = useState(false);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [appointmentServices, setAppointmentServices] = useState<Record<string, string[]>>({});
  
  // Consultation and prescription state
  const [consultationNotes, setConsultationNotes] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [prescriptionData, setPrescriptionData] = useState({
    medications: [''],
    dosages: [''],
    frequencies: [''],
    durations: [''],
    instructions: [''],
    refills: [0]
  });

  useEffect(() => {
    if (doctorId) {
      loadAppointments();
    } else {
      setLoading(false);
    }
  }, [doctorId]);

  const loadAppointments = async () => {
    if (!doctorId || doctorId === '') {
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🎆 NEW: Using DoctorAppointmentService for doctor:', doctorId);

      // Use the new DoctorAppointmentService
      const result = await DoctorAppointmentService.getDoctorAppointments(doctorId, {
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterDate && { date: filterDate })
      });

      console.log('🎆 NEW SERVICE RESULT:', {
        success: result.success,
        appointmentCount: result.appointments?.length || 0,
        error: result.error
      });

      if (result.success && result.appointments) {
        setAppointments(result.appointments);

        // Load services for each appointment using appointment_id
        const servicesMap: Record<string, string[]> = {};
        await Promise.all(
          result.appointments.map(async (appointment) => {
            try {
              const services = await AppointmentServicesService.getAppointmentServicesDisplay(
                appointment.appointment_id, // Use appointment_id from doctor_appointments table
                appointment.appointment_type,
                appointment.clinic_id
              );
              servicesMap[appointment.id] = services;
            } catch (error) {
              console.warn(`⚠️ Error loading services for appointment ${appointment.id}:`, error);
              servicesMap[appointment.id] = [];
            }
          })
        );
        setAppointmentServices(servicesMap);

        console.log('✅ Successfully loaded doctor appointments:', result.appointments.length);
      } else {
        console.error('❌ Error loading doctor appointments:', result.error);
        setAppointments([]);
      }
    } catch (error) {
      console.error('❌ Unexpected error loading doctor appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAppointment = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setShowStartAppointmentModal(true);
  };

  const startAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const result = await DoctorAppointmentService.updateDoctorAppointmentStatus(selectedAppointment.id, 'in_progress');
      if (result.success) {
        await loadAppointments();
        setShowStartAppointmentModal(false);
        setSelectedAppointment(null);
      } else {
        alert(`Error starting appointment: ${result.error}`);
      }
    } catch (error) {
      console.error('Error starting appointment:', error);
      alert('Failed to start appointment');
    }
  };

  const handleCompleteAppointment = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setConsultationNotes(appointment.doctor_notes || '');
    setShowCompleteAppointmentModal(true);
  };

  const completeAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setCompletionLoading(true);
      
      // Update appointment status to completed with notes
      const result = await DoctorAppointmentService.updateDoctorAppointmentStatus(
        selectedAppointment.id,
        'completed',
        consultationNotes
      );

      if (result.success) {
        // Create appointment history entry
        try {
          const historyData = {
            appointment_id: selectedAppointment.appointment_id || selectedAppointment.id,
            patient_id: selectedAppointment.patient_id,
            doctor_id: doctorId,
            clinic_id: selectedAppointment.clinic_id,
            appointment_date: selectedAppointment.appointment_date,
            appointment_time: selectedAppointment.appointment_time,
            appointment_type: selectedAppointment.appointment_type,
            consultation_notes: consultationNotes,
            prescription_given: selectedAppointment.prescription_given || false,
            doctor_name: `Dr. ${doctorId}`, // Will be updated with actual doctor name from database
            clinic_name: selectedAppointment.clinic?.clinic_name || 'Unknown Clinic',
            payment_amount: selectedAppointment.payment_amount,
            payment_status: selectedAppointment.payment_status
          };

          const historyResult = await AppointmentHistoryService.createAppointmentHistory(historyData);
          
          if (historyResult.success) {
            console.log('✅ Appointment history created successfully');
          } else {
            console.warn('⚠️ Failed to create appointment history:', historyResult.error);
          }
        } catch (historyError) {
          console.error('❌ Error creating appointment history:', historyError);
        }

        await loadAppointments();
        setShowCompleteAppointmentModal(false);
        setSelectedAppointment(null);
        setConsultationNotes('');
        
        alert('Appointment completed successfully and saved to history!');
      } else {
        alert(`Error completing appointment: ${result.error}`);
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert('Failed to complete appointment');
    } finally {
      setCompletionLoading(false);
    }
  };

  const handleReschedule = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setNewDate(appointment.appointment_date);
    setNewTime(appointment.appointment_time);
    setShowRescheduleModal(true);
  };

  const rescheduleAppointment = async () => {
    if (!selectedAppointment || !newDate || !newTime) return;

    try {
      // Update the doctor appointment status to rescheduled
      const result = await DoctorAppointmentService.updateDoctorAppointmentStatus(
        selectedAppointment.id,
        'rescheduled'
      );
      if (result.success) {
        await loadAppointments();
        setShowRescheduleModal(false);
        setSelectedAppointment(null);
        setNewDate('');
        setNewTime('');
        alert('Appointment rescheduled successfully!');
      } else {
        alert(`Error rescheduling appointment: ${result.error}`);
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('Failed to reschedule appointment');
    }
  };

  const handleAddConsultation = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setConsultationNotes(appointment.doctor_notes || '');
    setShowConsultationModal(true);
  };

  const saveConsultationNotes = async () => {
    if (!selectedAppointment) return;

    try {
      // Use DoctorAppointmentService to add consultation notes to doctor_appointments table
      const result = await DoctorAppointmentService.addConsultationNotes(
        selectedAppointment.id,
        consultationNotes
      );
      if (result.success) {
        await loadAppointments();
        setShowConsultationModal(false);
        setSelectedAppointment(null);
        setConsultationNotes('');
        alert('Consultation notes saved successfully!');
      } else {
        alert(`Error saving consultation notes: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving consultation notes:', error);
      alert('Failed to save consultation notes');
    }
  };

  const handleCreatePrescription = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionData({
      medications: [''],
      dosages: [''],
      frequencies: [''],
      durations: [''],
      instructions: [''],
      refills: [0]
    });
    setShowPrescriptionModal(true);
  };

  const addPrescriptionField = () => {
    setPrescriptionData(prev => ({
      medications: [...prev.medications, ''],
      dosages: [...prev.dosages, ''],
      frequencies: [...prev.frequencies, ''],
      durations: [...prev.durations, ''],
      instructions: [...prev.instructions, ''],
      refills: [...prev.refills, 0]
    }));
  };

  const removePrescriptionField = (index: number) => {
    setPrescriptionData(prev => ({
      medications: prev.medications.filter((_, i) => i !== index),
      dosages: prev.dosages.filter((_, i) => i !== index),
      frequencies: prev.frequencies.filter((_, i) => i !== index),
      durations: prev.durations.filter((_, i) => i !== index),
      instructions: prev.instructions.filter((_, i) => i !== index),
      refills: prev.refills.filter((_, i) => i !== index)
    }));
  };

  const updatePrescriptionField = (index: number, field: string, value: string | number) => {
    setPrescriptionData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: any, i: number) => i === index ? value : item)
    }));
  };

  const createPrescription = async () => {
    if (!selectedAppointment) {
      alert('⚠️ No appointment selected. Please select an appointment first.');
      return;
    }

    // Comprehensive validation
    const validationErrors = [];
    
    // Check required appointment data
    if (!selectedAppointment.patient_id) {
      validationErrors.push('Missing patient information');
    }
    if (!selectedAppointment.clinic_id) {
      validationErrors.push('Missing clinic information');
    }
    if (!doctorId) {
      validationErrors.push('Doctor not identified');
    }

    try {
      // Validate that we have at least one medication with name and dosage
      const validMedications = prescriptionData.medications
        .map((med, index) => {
          const medicationName = med.trim();
          const strength = prescriptionData.dosages[index]?.trim() || '';
          const frequency = prescriptionData.frequencies[index]?.trim() || 'As needed';
          const duration = prescriptionData.durations[index]?.trim() || '7 days';
          
          return {
            medication_name: medicationName,
            strength: strength,
            dosage: strength,
            frequency: frequency,
            duration: duration,
            special_instructions: prescriptionData.instructions[index]?.trim() || '',
            quantity_prescribed: 30,
            refills_allowed: prescriptionData.refills[index] || 0,
            timing: '',
            form: 'tablet',
            generic_name: '',
            refills_used: 0,
            status: 'active'
          };
        })
        .filter((med, index) => {
          // Ensure medication_name is not null, undefined, or empty string
          const medicationName = med.medication_name?.trim() || '';
          const strength = med.strength?.trim() || '';
          
          const hasValidName = medicationName !== '';
          const hasValidStrength = strength !== '';
          
          if (!hasValidName || !hasValidStrength) {
            if (hasValidName || hasValidStrength) {
              validationErrors.push(`Medication ${index + 1}: Both name and strength are required`);
            }
            return false;
          }
          return true;
        })
        .map(med => {
          // Ensure all required fields are properly set
          const medicationName = med.medication_name?.trim() || '';
          const strength = med.strength?.trim() || '';
          const dosage = med.dosage?.trim() || strength; // Use strength as dosage if dosage is empty
          
          if (!medicationName) {
            console.error('❌ Medication name is empty after filtering:', med);
            return null;
          }
          
          return {
            ...med,
            medication_name: medicationName, // Ensure it's trimmed and not empty
            strength: strength,
            dosage: dosage,
            frequency: med.frequency?.trim() || 'As needed',
            duration: med.duration?.trim() || '7 days',
            special_instructions: med.special_instructions?.trim() || '',
            quantity_prescribed: med.quantity_prescribed || 30,
            refills_allowed: med.refills_allowed || 0,
            refills_used: med.refills_used || 0,
            timing: med.timing || '',
            form: med.form || 'tablet',
            generic_name: med.generic_name || '',
            status: 'active'
          };
        })
        .filter(med => med !== null); // Remove any null entries

      if (validMedications.length === 0) {
        validationErrors.push('At least one complete medication entry is required');
      }

      // Show validation errors if any
      if (validationErrors.length > 0) {
        const errorMessage = '⚠️ Prescription Validation Errors:\n\n' + 
          validationErrors.map((error, index) => `${index + 1}. ${error}`).join('\n') +
          '\n\nPlease fix these issues before creating the prescription.';
        alert(errorMessage);
        return;
      }

      // Get doctor and patient information
      console.log('🔍 Doctor ID available:', doctorId);
      console.log('🔍 Selected appointment doctor info:', {
        doctor_name: selectedAppointment.doctor_name,
        doctor_id: selectedAppointment.doctor_id
      });
      
      const doctorName = selectedAppointment.doctor_name || `Dr. ${doctorId || 'Unknown'}`;
      
      // Calculate prescription expiry date (30 days from now)
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      // Create the main prescription record using the correct column names
      const enhancedPrescription = {
        appointment_id: selectedAppointment.appointment_id || selectedAppointment.id, // Try both fields
        patient_id: selectedAppointment.patient_id,
        clinic_id: selectedAppointment.clinic_id,
        doctor_id: doctorId,
        prescription_number: `RX-${Date.now().toString().substring(5)}`,
        prescribing_doctor_name: doctorName, // Correct column name per schema
        doctor_specialty: selectedAppointment.doctor_specialty || 'General Practitioner',
        diagnosis: consultationNotes || selectedAppointment.doctor_notes || 'General consultation',
        prescribed_date: new Date().toISOString().split('T')[0],
        valid_until: validUntil.toISOString().split('T')[0],
        status: 'active',
        general_instructions: 'Take medications as prescribed. Complete the full course even if symptoms improve. Contact your doctor if you experience any adverse effects or if symptoms persist or worsen.'
      };

      // Final validation - ensure all medications have medication_name
      const finalMedications = validMedications.filter(med => {
        if (!med || !med.medication_name || med.medication_name.trim() === '') {
          console.error('❌ Filtering out medication with empty name:', med);
          return false;
        }
        return true;
      });
      
      if (finalMedications.length === 0) {
        alert('⚠️ No valid medications to prescribe. Please ensure all medications have a name and dosage.');
        return;
      }
      
      console.log('📊 Creating prescription with data:');
      console.log('Prescription:', JSON.stringify(enhancedPrescription, null, 2));
      console.log('Medications:', JSON.stringify(finalMedications.map(m => ({
        medication_name: m.medication_name,
        strength: m.strength,
        dosage: m.dosage,
        frequency: m.frequency
      })), null, 2));
      console.log('Doctor ID:', doctorId);
      console.log('Appointment details:', {
        appointment_id: selectedAppointment.appointment_id,
        patient_id: selectedAppointment.patient_id,
        clinic_id: selectedAppointment.clinic_id
      });
      
      // Validate required fields before API call
      const requiredFields = {
        patient_id: selectedAppointment.patient_id,
        clinic_id: selectedAppointment.clinic_id,
        doctor_id: doctorId,
        prescription_number: enhancedPrescription.prescription_number,
        prescribing_doctor_name: enhancedPrescription.prescribing_doctor_name
      };
      
      console.log('🔍 Required fields validation:', requiredFields);
      
      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
        
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Create the enhanced prescription with medications
      const result = await prescriptionService.createNewPrescription(enhancedPrescription, finalMedications);
      
      console.log('Prescription service result:', result);
      
      if (result.success) {
        console.log('✅ Prescription created successfully:', result.prescription);
        
        // Add to patient medical history
        try {
          const medicationList = validMedications.map(m => 
            `${m.medication_name} - ${m.dosage}, ${m.frequency}${m.duration ? ` for ${m.duration}` : ''}`
          ).join('; ');

          const { error: historyError } = await supabase
            .from('medical_records')
            .insert([{
              patient_id: selectedAppointment.patient_id,
              doctor_id: doctorId,
              clinic_id: selectedAppointment.clinic_id,
              appointment_id: selectedAppointment.appointment_id || selectedAppointment.id,
              visit_date: new Date().toISOString().split('T')[0],
              chief_complaint: consultationNotes || selectedAppointment.doctor_notes || 'Prescription issued',
              diagnosis: enhancedPrescription.diagnosis || 'Prescription medications prescribed',
              treatment: medicationList,
              notes: `Prescription issued with ${validMedications.length} medication(s). ${enhancedPrescription.general_instructions || ''}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);

          if (historyError) {
            console.warn('⚠️ Failed to add to medical history (non-critical):', historyError);
          } else {
            console.log('✅ Added prescription to patient medical history');
          }
        } catch (historyError) {
          console.warn('⚠️ Error adding to medical history (non-critical):', historyError);
        }

        // Send notification to patient
        try {
          // Get patient's user_id
          const { data: patientData } = await supabase
            .from('patients')
            .select('user_id')
            .eq('id', selectedAppointment.patient_id)
            .single();

          if (patientData?.user_id) {
            const { NotificationService } = await import('../../services/notificationService');
            
            const medicationNames = validMedications.map(m => m.medication_name).join(', ');
            const prescriptionNumber = result.prescription?.prescription_number || 'N/A';
            
            await NotificationService.createNotification({
              user_id: patientData.user_id,
              appointment_id: selectedAppointment.appointment_id || selectedAppointment.id,
              title: 'New Prescription Available',
              message: `Your doctor has prescribed: ${medicationNames}. Prescription #: ${prescriptionNumber}. Please check your prescriptions in the patient portal.`,
              type: 'medical'
            });
            
            console.log('✅ Notification sent to patient');
          }
        } catch (notifError) {
          console.warn('⚠️ Failed to send notification (non-critical):', notifError);
        }
        
        // Show success message with prescription number
        const prescriptionNumber = result.prescription?.prescription_number || 'N/A';
        alert(`Prescription created successfully!\n\nPrescription #: ${prescriptionNumber}\nMedications: ${validMedications.length}\n\nThe patient has been notified and can view this prescription in their patient portal.`);
        
        // Reload appointments and close modal
        await loadAppointments();
        setShowPrescriptionModal(false);
        setSelectedAppointment(null);
        
        // Reset prescription form data
        setPrescriptionData({
          medications: [''],
          dosages: [''],
          frequencies: [''],
          durations: [''],
          instructions: [''],
          refills: [0]
        });
        
      } else {
        console.error('❌ Failed to create prescription:', result.error);
        
        // Provide more helpful error messages
        let userMessage = 'Failed to create prescription.';
        if (result.error) {
          if (result.error.includes('patient_id')) {
            userMessage = 'Patient information is missing. Please try refreshing the page.';
          } else if (result.error.includes('doctor_id')) {
            userMessage = 'Doctor information is missing. Please try signing in again.';
          } else if (result.error.includes('clinic_id')) {
            userMessage = 'Clinic information is missing. Please contact support.';
          } else {
            userMessage = `Error: ${result.error}`;
          }
        }
        
        alert(`${userMessage}\n\nDebug Info:\nDoctor ID: ${doctorId}\nPatient ID: ${selectedAppointment.patient_id}\nClinic ID: ${selectedAppointment.clinic_id}`);
      }
      
    } catch (error) {
      console.error('❌ Unexpected error creating prescription:', error);
      alert(`Failed to create prescription: ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease check the console for more details and try again.`);
    }
  };

  const handleViewPatient = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setShowPatientDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusClass = APPOINTMENT_STATUS_COLORS[status];
    const statusText = APPOINTMENT_STATUSES[status];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
        {statusText}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityClass = APPOINTMENT_PRIORITY_COLORS[priority as keyof typeof APPOINTMENT_PRIORITY_COLORS];
    const priorityText = APPOINTMENT_PRIORITIES[priority as keyof typeof APPOINTMENT_PRIORITIES];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityClass}`}>
        {priorityText}
      </span>
    );
  };

  const getActionButtons = (appointment: DoctorAppointment) => {
    const getPrimaryAction = () => {
      if (appointment.status === 'confirmed') {
        return (
          <Button
            onClick={() => handleStartAppointment(appointment)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Start
          </Button>
        );
      }
      
      if (appointment.status === 'in_progress') {
        return (
          <Button
            onClick={() => handleCompleteAppointment(appointment)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Button>
        );
      }
      
      return null;
    };

    const getSecondaryActions = () => {
      const actions = [];
      
      // View Patient Details - Always available
      actions.push(
        <Button
          key="view"
          onClick={() => handleViewPatient(appointment)}
          size="sm"
          variant="outline"
          className="text-blue-600 border-blue-200 hover:bg-blue-50 transition-all"
        >
          <Eye className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">View</span>
        </Button>
      );
      
      // Notes - Always available
      actions.push(
        <Button
          key="notes"
          onClick={() => handleAddConsultation(appointment)}
          size="sm"
          variant="outline"
          className="text-purple-600 border-purple-200 hover:bg-purple-50 transition-all"
        >
          <FileText className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Notes</span>
        </Button>
      );
      
      // Prescription - Always available
      actions.push(
        <Button
          key="prescription"
          onClick={() => handleCreatePrescription(appointment)}
          size="sm"
          variant="outline"
          className="text-green-600 border-green-200 hover:bg-green-50 transition-all"
        >
          <Pill className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Rx</span>
        </Button>
      );
      
      // Reschedule - Only for non-completed/cancelled appointments
      if (appointment.status !== 'completed' && appointment.status !== 'cancelled') {
        actions.push(
          <Button
            key="reschedule"
            onClick={() => handleReschedule(appointment)}
            size="sm"
            variant="outline"
            className="text-orange-600 border-orange-200 hover:bg-orange-50 transition-all"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline lg:hidden xl:inline">Reschedule</span>
          </Button>
        );
      }
      
      return actions;
    };

    return (
      <div className="flex flex-wrap gap-1.5">
        {/* Primary Action First */}
        {getPrimaryAction()}
        
        {/* Secondary Actions */}
        {getSecondaryActions()}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Status Display Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton width={180} height={16} className="mb-2" />
              <Skeleton width={250} height={12} />
            </div>
            <div className="text-right space-y-1">
              <Skeleton width={120} height={12} />
              <Skeleton width={140} height={12} />
            </div>
          </div>
        </div>
        
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton width={200} height={32} />
          <div className="flex gap-4">
            <Skeleton width={120} height={40} />
            <Skeleton width={100} height={40} />
            <Skeleton width={80} height={40} />
          </div>
        </div>
        
        {/* Desktop Table Skeleton */}
        <div className="hidden lg:block">
          <SkeletonTable rows={6} columns={6} />
        </div>
        
        {/* Mobile Cards Skeleton */}
        <div className="lg:hidden space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonAppointmentCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Show error message if doctorId is not available
  if (!doctorId || doctorId === '') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
        </div>
        
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Doctor Profile</h3>
          <p className="text-gray-600">
            Please wait while we load your doctor profile. If this persists, try refreshing the page or signing in again.
          </p>
        </Card>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Debug Components - DISABLED FOR EMERGENCY FIX */}
        {/*
          <SimpleAppointmentTest doctorId={doctorId} />
          <DoctorAppointmentDiagnostic doctorId={doctorId} />
          <ComprehensiveAppointmentValidator doctorId={doctorId} />
          <DatabaseConnectionTest />
          {doctorId && <DoctorAppointmentDebug doctorId={doctorId} />}
        */}
        
        {/* Status Display */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Doctor Appointment Status</h3>
              <p className="text-xs text-blue-700 mt-1">
                Doctor ID: {doctorId} | Appointments Found: {appointments.length}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-blue-600">
                With Patient Names: {appointments.filter(apt => 
                  apt.patient_name && 
                  apt.patient_name !== 'Unknown Patient' && 
                  !apt.patient_name.includes('Patient ID:') &&
                  !apt.patient_name.includes('Patient (')
                ).length}
              </p>
              <p className="text-xs text-blue-600">
                Status Filter: {filterStatus} | Date Filter: {filterDate || 'None'}
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    console.log('🧪 Direct prescription modal test');
                    if (appointments.length > 0) {
                      setSelectedAppointment(appointments[0]);
                      setPrescriptionData({
                        medications: ['Test Medication'],
                        dosages: ['500mg'],
                        frequencies: ['Twice daily'],
                        durations: ['7 days'],
                        instructions: ['Take with food'],
                        refills: [0]
                      });
                      setShowPrescriptionModal(true);
                    } else {
                      alert('No appointments available for prescription test');
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1"
                >
                  Test Prescription Modal
                </Button>
              </div>
            </div>
          </div>
        </Card>
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
        <div className="flex gap-4">
          {/* Date Filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <Button onClick={loadAppointments} variant="outline">
            Refresh
          </Button>
          
          {/* Debug Prescription Button */}
          <Button 
            onClick={() => {
              console.log('🧪 Prescription Debug Info:');
              console.log('Doctor ID:', doctorId);
              console.log('Appointments:', appointments.length);
              console.log('Selected appointment:', selectedAppointment?.id);
              console.log('Prescription service available:', !!prescriptionService);
              
              // Test opening prescription modal with first appointment
              if (appointments.length > 0) {
                console.log('Testing prescription modal with first appointment');
                handleCreatePrescription(appointments[0]);
              } else {
                alert(`Debug Info:\nDoctor ID: ${doctorId}\nAppointments: ${appointments.length}\nPrescription Service: ${!!prescriptionService ? 'Available' : 'Missing'}\n\nNo appointments available to test prescription creation.`);
              }
            }}
            variant="outline"
            className="text-purple-600"
          >
            Test Rx
          </Button>
        </div>
      </div>

      {/* Appointments List - Responsive Design */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clinic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                          <p className="text-sm text-gray-500">You don't have any appointments matching the current filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {appointment.patient_name && appointment.patient_name.trim() !== '' 
                                  ? appointment.patient_name
                                  : (appointment.patient 
                                      ? `${appointment.patient.first_name || ''} ${appointment.patient.last_name || ''}`.trim() || 'Unknown Patient'
                                      : 'Unknown Patient')}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {appointment.patient_email && appointment.patient_email.trim() !== ''
                                  ? appointment.patient_email
                                  : (appointment.patient?.email || 'No email')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(appointment.appointment_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(appointment.appointment_time)} • {appointment.duration_minutes}min
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900">
                              {APPOINTMENT_TYPES[appointment.appointment_type]}
                            </span>
                          </div>
                          {appointment.payment_amount && (
                            <div className="text-xs text-green-600 mt-1 font-medium">
                              ₱{appointment.payment_amount.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {appointment.clinic?.clinic_name || 'Unknown Clinic'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {appointment.clinic?.address}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(appointment.status)}
                            {appointment.priority && getPriorityBadge(appointment.priority)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getActionButtons(appointment)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {appointments.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-sm text-gray-500">You don't have any appointments matching the current filters.</p>
            </Card>
          ) : (
            appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <div className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-medium text-gray-900 truncate">
                          {appointment.patient_name && appointment.patient_name.trim() !== ''
                            ? appointment.patient_name
                            : (appointment.patient 
                                ? `${appointment.patient.first_name || ''} ${appointment.patient.last_name || ''}`.trim() || 'Unknown Patient'
                                : 'Unknown Patient')}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {appointment.patient_email && appointment.patient_email.trim() !== ''
                            ? appointment.patient_email
                            : (appointment.patient?.email || 'No email provided')}
                        </p>
                        {appointment.patient?.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Phone className="h-3 w-3" />
                            <span>{appointment.patient.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(appointment.status)}
                      {appointment.priority && getPriorityBadge(appointment.priority)}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Date & Time</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(appointment.appointment_date)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatTime(appointment.appointment_time)} • {appointment.duration_minutes}min
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Stethoscope className="h-4 w-4" />
                        <span>Type</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {APPOINTMENT_TYPES[appointment.appointment_type]}
                      </div>
                      {appointment.payment_amount && (
                        <div className="text-sm text-green-600 font-medium">
                          ₱{appointment.payment_amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clinic Info */}
                  {appointment.clinic && (
                    <div className="py-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <MapPin className="h-4 w-4" />
                        <span>Clinic</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.clinic.clinic_name}
                      </div>
                      {appointment.clinic.address && (
                        <div className="text-sm text-gray-600">
                          {appointment.clinic.address}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Services */}
                  {appointmentServices[appointment.id] && appointmentServices[appointment.id].length > 0 && (
                    <div className="py-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">Services</div>
                      <div className="text-sm text-gray-700">
                        {AppointmentServicesService.formatServicesDisplay(appointmentServices[appointment.id])}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {getActionButtons(appointment)}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Start Appointment Dialog */}
      <ConfirmDialog
        isOpen={showStartAppointmentModal}
        onClose={() => setShowStartAppointmentModal(false)}
        onConfirm={startAppointment}
        title="Start Appointment"
        message={`Are you ready to start the appointment with ${selectedAppointment?.patient_name || 
                 (selectedAppointment?.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Unknown Patient')}?`}
      />

      {/* Complete Appointment Dialog */}
      <Modal
        isOpen={showCompleteAppointmentModal}
        onClose={() => setShowCompleteAppointmentModal(false)}
        title="Complete Appointment"
        size="md"
      >
        <div className="space-y-6">
          {/* Patient Info Header */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedAppointment?.patient_name || 
                   (selectedAppointment?.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Unknown Patient')}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedAppointment ? APPOINTMENT_TYPES[selectedAppointment.appointment_type] : ''} • {selectedAppointment?.appointment_date}
                </p>
              </div>
            </div>
          </div>
          
          {/* Consultation Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Consultation Notes
              <span className="text-gray-400 font-normal ml-1">(Optional)</span>
            </label>
            <textarea
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              placeholder="Enter consultation summary, diagnosis, treatment recommendations, follow-up instructions..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none text-sm"
            />
            <p className="text-xs text-gray-500">These notes will be saved with the appointment record.</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
            <Button 
              onClick={() => setShowCompleteAppointmentModal(false)} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={completeAppointment}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Appointment"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-medium text-orange-900">
              {selectedAppointment?.patient_name || 
               (selectedAppointment?.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 
                selectedAppointment?.patient_id ? `Patient ID: ${selectedAppointment.patient_id.substring(0, 8)}` : 'Patient')}
            </h3>
            <p className="text-sm text-orange-700">
              Current: {selectedAppointment?.appointment_date} at {selectedAppointment?.appointment_time}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Date
              </label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Time
              </label>
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setShowRescheduleModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={rescheduleAppointment} disabled={!newDate || !newTime}>
              <Edit3 className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Consultation Notes Modal */}
      <Modal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        title="Consultation Notes"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900">
              {selectedAppointment?.patient_name || 
               (selectedAppointment?.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 
                selectedAppointment?.patient_id ? `Patient ID: ${selectedAppointment.patient_id.substring(0, 8)}` : 'Patient')}
            </h3>
            <p className="text-sm text-purple-700">
              {selectedAppointment ? APPOINTMENT_TYPES[selectedAppointment.appointment_type] : ''} - {selectedAppointment?.appointment_date}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consultation Notes
            </label>
            <textarea
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              placeholder="Enter detailed consultation notes, diagnosis, symptoms, treatment plan, recommendations, etc."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setShowConsultationModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveConsultationNotes}>
              <Save className="h-4 w-4 mr-2" />
              Save Notes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Prescription Modal */}
      <Modal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        title="Create Prescription"
        size="xl"
      >
        <div className="space-y-6">
          {/* Patient Info Header */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Pill className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedAppointment?.patient_name || 
                   (selectedAppointment?.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 
                    selectedAppointment?.patient_id ? `Patient ID: ${selectedAppointment.patient_id.substring(0, 8)}` : 'Patient')}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedAppointment ? APPOINTMENT_TYPES[selectedAppointment.appointment_type] : ''} • {selectedAppointment?.appointment_date}
                </p>
              </div>
            </div>
          </div>
          
          {/* Medications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-600" />
                Medications
              </h4>
              <Button onClick={addPrescriptionField} variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                <Plus className="h-4 w-4 mr-1" />
                Add Medication
              </Button>
            </div>
            
            {/* Scrollable medications container */}
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
            
              {prescriptionData.medications.map((_, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-600">
                        {index + 1}
                      </div>
                      <h5 className="font-semibold text-gray-800">Medication {index + 1}</h5>
                    </div>
                    {prescriptionData.medications.length > 1 && (
                      <Button 
                        onClick={() => removePrescriptionField(index)}
                        variant="outline" 
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Primary Information - Always full width on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medication Name *
                      </label>
                      <Input
                        placeholder="e.g., Amoxicillin, Paracetamol"
                        value={prescriptionData.medications[index]}
                        onChange={(e) => updatePrescriptionField(index, 'medications', e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dosage/Strength *
                      </label>
                      <Input
                        placeholder="e.g., 500mg, 250ml"
                        value={prescriptionData.dosages[index]}
                        onChange={(e) => updatePrescriptionField(index, 'dosages', e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Secondary Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <Input
                        placeholder="e.g., Twice daily, Every 8 hours"
                        value={prescriptionData.frequencies[index]}
                        onChange={(e) => updatePrescriptionField(index, 'frequencies', e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <Input
                        placeholder="e.g., 7 days, 2 weeks"
                        value={prescriptionData.durations[index]}
                        onChange={(e) => updatePrescriptionField(index, 'durations', e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Additional Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions
                      </label>
                      <Input
                        placeholder="e.g., Take with meals, Before bedtime"
                        value={prescriptionData.instructions[index]}
                        onChange={(e) => updatePrescriptionField(index, 'instructions', e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Refills Allowed
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="12"
                        placeholder="0"
                        value={prescriptionData.refills[index]}
                        onChange={(e) => updatePrescriptionField(index, 'refills', parseInt(e.target.value) || 0)}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl border-t border-gray-200">
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{prescriptionData.medications.filter(med => med.trim()).length}</span> 
                medication{prescriptionData.medications.filter(med => med.trim()).length !== 1 ? 's' : ''} added
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <Button 
                  onClick={() => setShowPrescriptionModal(false)} 
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createPrescription}
                  disabled={prescriptionData.medications.filter(med => med.trim()).length === 0}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300"
                >
                  <Pill className="h-4 w-4 mr-2" />
                  Create Prescription
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Patient Details Modal */}
      <Modal
        isOpen={showPatientDetailsModal}
        onClose={() => setShowPatientDetailsModal(false)}
        title="Patient Details"
        size="lg"
      >
        <div className="space-y-6">
          {selectedAppointment && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedAppointment.patient_name || 
                     (selectedAppointment.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 
                      selectedAppointment.patient_id ? `Patient ID: ${selectedAppointment.patient_id.substring(0, 8)}` : 'Unknown Patient')}
                  </h3>
                  <p className="text-gray-600">
                    Patient ID: {selectedAppointment.patient_id}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedAppointment.patient?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedAppointment.patient.email}</span>
                      </div>
                    )}
                    {selectedAppointment.patient?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedAppointment.patient.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Appointment Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedAppointment.appointment_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedAppointment.appointment_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{APPOINTMENT_TYPES[selectedAppointment.appointment_type]}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Patient Notes</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                  </div>
                </div>
              )}
              
              {selectedAppointment.doctor_notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Doctor Notes</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">{selectedAppointment.doctor_notes}</p>
                  </div>
                </div>
              )}
              
              {appointmentServices[selectedAppointment.id] && appointmentServices[selectedAppointment.id].length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Services</h4>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">
                      {AppointmentServicesService.formatServicesDisplay(appointmentServices[selectedAppointment.id])}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowPatientDetailsModal(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Enhanced Appointment Completion Modal */}
      <EnhancedAppointmentCompletionModal
        isOpen={showCompleteAppointmentModal}
        onClose={() => setShowCompleteAppointmentModal(false)}
        onComplete={completeAppointment}
        appointment={selectedAppointment}
        loading={completionLoading}
      />
    </div>
  );
};
