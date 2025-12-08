import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
  User, Calendar, Clock, CheckCircle, Edit, Camera, 
  LogOut, Search, Filter, Plus, FileText, Stethoscope,
  AlertCircle, CheckSquare, CalendarDays, UserCheck,
  ArrowLeft, ArrowRight, X, Save, Upload, Eye,
  Heart, Pill, Activity, History, Settings, Mail, Phone
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { prescriptionService, PrescriptionWithPatient, CreatePrescriptionData } from '../../features/auth/utils/prescriptionService';
import { doctorDashboardService, DoctorStats, DoctorActivity } from '../../features/auth/utils/doctorDashboardService';
import { doctorService, DoctorProfile } from '../../features/auth/utils/doctorService';
import { doctorAppointmentService, PatientInfo } from '../../features/auth/utils/doctorAppointmentService';
import { DoctorScheduleManager } from '../../components/doctor/DoctorScheduleManager';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DoctorAppointments } from './DoctorAppointments';
import { DoctorAppointmentHistory } from './DoctorAppointmentHistory';
import { DoctorPrescriptions } from './DoctorPrescriptionsEnhanced';
import { DoctorPatientRecords } from './DoctorPatientRecords';
import { DoctorManageProfile } from './DoctorManageProfile';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import { DoctorNotificationDropdown } from '../../components/doctor/DoctorNotificationDropdown';

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: string;
  notes?: string;
  prescription?: string;
  followUpDate?: string;
}

// Using PatientInfo from doctorAppointmentService instead of local interface

// Using PrescriptionWithPatient from prescriptionService instead of local interface

export const DoctorDashboard: React.FC = () => {
  const { user: authUser, logout, loading: authLoading } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [doctorStats, setDoctorStats] = useState<DoctorStats | null>(null);
  const [doctorActivity, setDoctorActivity] = useState<DoctorActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [prescriptionData, setPrescriptionData] = useState({
    medications: [''],
    dosage: [''],
    frequency: [''],
    duration: [''],
    instructions: [''],
    refills_remaining: [0]
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileUpdateData, setProfileUpdateData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
    availability: '',
    years_experience: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated and is a doctor
        if (!authUser) {
          navigate('/doctor-signin');
          return;
        }
        
        if (authUser.role !== 'doctor') {
          await logout();
          navigate('/signin');
          return;
        }
        
        await loadDoctorData(authUser.id);
      } catch (error) {
        console.error('Auth check error:', error);
        await logout();
        navigate('/doctor-signin');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAuth();
    }
  }, [authUser, authLoading, navigate, logout]);

  const loadDoctorData = async (userId: string) => {
    try {
      // Get doctor profile
      const doctorResult = await doctorDashboardService.getDoctorByUserId(userId);
      if (doctorResult.success && doctorResult.doctor) {
        const doctor = doctorResult.doctor;
        setDoctorProfile(doctor);
        
        // Set profile update data
        setProfileUpdateData({
          first_name: doctor.first_name || '',
          last_name: doctor.last_name || '',
          email: doctor.email || '',
          phone: doctor.phone || '',
          specialization: doctor.specialization || '',
          availability: doctor.availability || '',
          years_experience: doctor.years_experience || 0
        });

        // Load doctor stats
        const statsResult = await doctorDashboardService.getDoctorStats(doctor.id);
        if (statsResult.success && statsResult.stats) {
          setDoctorStats(statsResult.stats);
        }

        // Load doctor activity
        const activityResult = await doctorDashboardService.getDoctorActivity(doctor.id, 10);
        if (activityResult.success && activityResult.activities) {
          setDoctorActivity(activityResult.activities);
        }

        // Load prescriptions
        const prescriptionsResult = await prescriptionService.getPrescriptionsByDoctor(doctor.id);
        if (prescriptionsResult.success && prescriptionsResult.prescriptions) {
          setPrescriptions(prescriptionsResult.prescriptions);
        }
      } else {
        console.error('Failed to load doctor profile:', doctorResult.error);
      }
    } catch (error) {
      console.error('Error loading doctor data:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('[DoctorDashboard] Starting sign out');
    try {
      await logout();
      console.log('[DoctorDashboard] Logout successful, navigating to home');
      navigate('/');
    } catch (error) {
      console.error('[DoctorDashboard] Sign out error:', error);
      // Even if logout fails, try to navigate away
      navigate('/');
    }
  };

  const handleMarkAsDone = (appointmentId: string) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'completed' as const }
          : apt
      )
    );
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(appointment.date);
    setSelectedTime(appointment.time);
    setShowRescheduleModal(true);
  };

  const handleMakePrescription = (appointment: Appointment) => {
    const patient = patients.find(p => p.id === appointment.patientId);
    if (patient) {
      setSelectedPatient(patient);
      setSelectedAppointment(appointment);
      setPrescriptionData({
        medications: [''],
        dosage: [''],
        frequency: [''],
        duration: [''],
        instructions: [''],
        refills_remaining: [0]
      });
      setShowPrescriptionModal(true);
    }
  };

  const confirmReschedule = () => {
    if (selectedAppointment && selectedDate && selectedTime) {
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, date: selectedDate, time: selectedTime }
            : apt
        )
      );
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
    }
  };

  const confirmPrescription = async () => {
    if (selectedPatient && selectedAppointment && authUser?.id) {
      try {
        // Create multiple prescriptions for each medication
        const prescriptionsToCreate: CreatePrescriptionData[] = prescriptionData.medications
          .filter((med, index) => med.trim() && prescriptionData.dosage[index]?.trim())
          .map((medication, index) => ({
            patient_id: selectedPatient.id,
            doctor_id: authUser.id,
            clinic_id: doctorProfile?.clinic_id || '',
            medication_name: medication.trim(),
            dosage: prescriptionData.dosage[index]?.trim() || '',
            frequency: prescriptionData.frequency[index]?.trim() || 'As needed',
            duration: prescriptionData.duration[index]?.trim() || '',
            instructions: prescriptionData.instructions[index]?.trim() || '',
            prescribed_date: new Date().toISOString().split('T')[0],
            refills_remaining: prescriptionData.refills_remaining[index] || 0,
            status: 'active'
          }));

        if (prescriptionsToCreate.length === 0) {
          alert('Please add at least one medication with dosage');
          return;
        }

        const result = await prescriptionService.createMultiplePrescriptions(prescriptionsToCreate);
        
        if (result.success) {
          // Reload prescriptions
          const prescriptionsResult = await prescriptionService.getPrescriptionsByDoctor(authUser.id);
          if (prescriptionsResult.success && prescriptionsResult.prescriptions) {
            setPrescriptions(prescriptionsResult.prescriptions);
          }
          
          // Update appointment with prescription info
          setAppointments(prev => 
            prev.map(apt => 
              apt.id === selectedAppointment.id 
                ? { 
                    ...apt, 
                    prescription: prescriptionsToCreate.map(p => p.medication_name).join(', ')
                  }
                : apt
            )
          );

          alert('Prescription created successfully!');
          setShowPrescriptionModal(false);
          setSelectedPatient(null);
          setSelectedAppointment(null);
        } else {
          alert(`Failed to create prescription: ${result.error}`);
        }
      } catch (error) {
        console.error('Error creating prescription:', error);
        alert('Failed to create prescription');
      }
    }
  };

  const addPrescriptionField = () => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: [...prev.medications, ''],
      dosage: [...prev.dosage, ''],
      frequency: [...prev.frequency, ''],
      duration: [...prev.duration, ''],
      instructions: [...prev.instructions, ''],
      refills_remaining: [...prev.refills_remaining, 0]
    }));
  };

  const removePrescriptionField = (index: number) => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
      dosage: prev.dosage.filter((_, i) => i !== index),
      frequency: prev.frequency.filter((_, i) => i !== index),
      duration: prev.duration.filter((_, i) => i !== index),
      instructions: prev.instructions.filter((_, i) => i !== index),
      refills_remaining: prev.refills_remaining.filter((_, i) => i !== index)
    }));
  };

  const updatePrescriptionField = (index: number, field: 'medications' | 'dosage' | 'frequency' | 'duration' | 'instructions', value: string) => {
    setPrescriptionData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const updatePrescriptionNumberField = (index: number, field: 'refills_remaining', value: number) => {
    setPrescriptionData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleProfilePictureUpload = async (file: File) => {
    if (!doctorProfile) return;
    
    try {
      setProfilePicture(file);
      const result = await doctorDashboardService.uploadProfilePicture(doctorProfile.id, file);
      
      if (result.success) {
        // Update doctor profile state
        setDoctorProfile(prev => prev ? {
          ...prev,
          profile_picture_url: result.url || null,
          profile_picture_path: result.path || null
        } : null);
        alert('Profile picture updated successfully!');
      } else {
        alert(`Failed to upload profile picture: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    } finally {
      setProfilePicture(null);
    }
  };

  const handleUpdateProfile = async () => {
    if (!doctorProfile) return;
    
    try {
      const result = await doctorDashboardService.updateDoctorProfile(doctorProfile.id, profileUpdateData);
      
      if (result.success && result.doctor) {
        setDoctorProfile(result.doctor);
        setShowProfileModal(false);
        alert('Profile updated successfully!');
      } else {
        alert(`Failed to update profile: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredAppointments = appointments.filter(apt =>
    apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayAppointments = filteredAppointments.filter(apt => 
    apt.date === new Date().toISOString().split('T')[0]
  );

  const upcomingAppointments = filteredAppointments.filter(apt => 
    apt.date > new Date().toISOString().split('T')[0]
  );

  const pastAppointments = filteredAppointments.filter(apt => 
    apt.date < new Date().toISOString().split('T')[0]
  );

  const navigationItems = [
    { id: 'appointments', label: 'View Appointments', icon: Calendar },
    { id: 'history', label: 'Appointment History', icon: History },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'patients', label: 'Patient Records', icon: UserCheck },
    { id: 'profile', label: 'Manage Profile', icon: Settings }
  ];

  const renderAppointments = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Appointments</h1>
          <p className="text-gray-600 mt-1">Manage your current and upcoming appointments</p>
        </div>
        <div className="flex items-center gap-2">
              <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
              type="text"
              placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
                />
              </div>
            </div>
            </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-theme">{todayAppointments.length}</p>
          </div>
              <Calendar className="h-8 w-8 text-theme" />
        </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-green-600">{upcomingAppointments.length}</p>
            </div>
              <ArrowRight className="h-8 w-8 text-green-600" />
                            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
                            <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-600">{pastAppointments.length}</p>
                            </div>
              <CheckCircle className="h-8 w-8 text-gray-600" />
                          </div>
          </CardContent>
        </Card>
                          
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
                            <div>
                <p className="text-sm font-medium text-gray-600">Patients</p>
                <p className="text-2xl font-bold text-blue-600">{patients.length}</p>
                            </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      {todayAppointments.length > 0 && (
                            <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Schedule</h2>
          <div className="space-y-4">
            {todayAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(appointment.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('-', ' ')}
                              </span>
                            </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{appointment.patientName}</span>
                            </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{appointment.date}</span>
                            </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{appointment.time}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{appointment.type}</span>
                        </div>
                          </div>
                        </div>

                    <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                        onClick={() => setShowPatientDetails(true)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>

                      {appointment.status === 'scheduled' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsDone(appointment.id)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Done
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReschedule(appointment)}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Reschedule
                          </Button>
                        </>
                      )}

                          <Button
                            variant="outline"
                            size="sm"
                        onClick={() => handleMakePrescription(appointment)}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                        <Pill className="h-3 w-3 mr-1" />
                            Prescription
                          </Button>
                        </div>
                      </div>

                  {appointment.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}
                    </CardContent>
                  </Card>
            ))}
            </div>
          </div>
        )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(appointment.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">{appointment.patientName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{appointment.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{appointment.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{appointment.type}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReschedule(appointment)}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Reschedule
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMakePrescription(appointment)}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      <Pill className="h-3 w-3 mr-1" />
                      Prescription
                    </Button>
                  </div>
              </CardContent>
            </Card>
            ))}
          </div>
          </div>
        )}

      {filteredAppointments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms.' : 'You have no appointments scheduled.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderHistory = () => (
          <div className="space-y-6">
                    <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointment History</h1>
          <p className="text-gray-600 mt-1">View past appointments and patient records</p>
                        </div>
      </div>

      <div className="space-y-4">
        {pastAppointments.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(appointment.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">{appointment.patientName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{appointment.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{appointment.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{appointment.type}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPatientDetails(true)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>

              {appointment.prescription && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Prescription</span>
                  </div>
                  <p className="text-sm text-purple-700">{appointment.prescription}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPrescriptions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
                        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600 mt-1">Manage patient prescriptions and medications</p>
                        </div>
                      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prescriptions.map((prescription) => (
          <Card key={prescription.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-purple-600" />
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    prescription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {prescription.status}
                  </span>
                      </div>
                    </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {prescription.patient?.first_name} {prescription.patient?.last_name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{prescription.prescribed_date}</span>
                </div>

                {prescription.expiry_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Expires: {prescription.expiry_date}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-900">{prescription.medication_name}</p>
                  <p className="text-xs text-gray-600">
                    {prescription.dosage} - {prescription.frequency}
                    {prescription.duration && ` for ${prescription.duration}`}
                  </p>
                  {prescription.instructions && (
                    <p className="text-xs text-gray-500 mt-1">{prescription.instructions}</p>
                  )}
                  {prescription.refills_remaining > 0 && (
                    <p className="text-xs text-blue-600 mt-1">Refills: {prescription.refills_remaining}</p>
                  )}
                </div>
              </div>
                  </CardContent>
                </Card>
              ))}
            </div>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
          <p className="text-gray-600 mt-1">View and manage patient information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-theme-light rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-theme-dark" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{patient.first_name} {patient.last_name}</h3>
                  {patient.date_of_birth && (
                    <p className="text-sm text-gray-600">
                      {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{patient.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{patient.phone}</span>
                </div>

                {patient.last_visit && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Last visit: {patient.last_visit}</span>
          </div>
        )}
      </div>

              {patient.medical_conditions && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Medical History</span>
                  </div>
                  <p className="text-sm text-blue-700">{patient.medical_conditions}</p>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPatient(patient);
                    setShowPatientDetails(true);
                  }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Profile</h1>
          <p className="text-gray-600 mt-1">Update your profile information and settings</p>
        </div>
          </div>
          
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-theme-light rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-theme-dark" />
              </div>
            <div>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('profile-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProfilePictureUpload(file);
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input value={doctorProfile ? `${doctorProfile.first_name} ${doctorProfile.last_name}` : 'Dr. John Doe'} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input value={authUser?.email || 'doctor@example.com'} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <Input value="General Medicine" disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    const doctorId = doctorProfile?.id || '';
    
    // Log doctor ID for debugging
    console.log('Doctor Dashboard - Current doctor ID:', doctorId);
    
    // Check if the doctor ID matches the one in the appointment
    const matchesAppointmentDoctorId = doctorId === 'a35516af-53a9-4ed2-9329-bbe2126bb972';
    console.log('Doctor ID matches appointment doctor_id:', matchesAppointmentDoctorId);
    
    switch (activeTab) {
      case 'appointments':
        return (
          <>
            {/* Debug info */}
            {import.meta.env.DEV && (
              <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p>Debug - Doctor ID: {doctorId}</p>
                <p>Matches appointment doctor_id: {matchesAppointmentDoctorId ? 'Yes' : 'No'}</p>
              </div>
            )}
            <DoctorAppointments doctorId={doctorId} />
          </>
        );
      case 'history':
        return <DoctorAppointmentHistory doctorId={doctorId} />;
      case 'prescriptions':
        return <DoctorPrescriptions doctorId={doctorId} />;
      case 'patients':
        return <DoctorPatientRecords doctorId={doctorId} />;
      case 'profile':
        return <DoctorManageProfile doctorId={doctorId} onProfileUpdate={() => loadDoctorData(authUser?.id)} />;
      default:
        return <DoctorAppointments doctorId={doctorId} />;
    }
  };

  if (loading || authLoading) {
    return <SkeletonDashboard />;
  }

  const handleSearch = (query: string) => {
    // TODO: Implement search functionality for doctor dashboard
    console.log('Doctor search query:', query);
  };

  return (
    <DashboardLayout
      navigationItems={navigationItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={authUser}
      variant="doctor"
      showNavbar={true}
      onSignOut={() => setShowLogoutConfirm(true)}
    >
      {renderContent()}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <Modal isOpen={showRescheduleModal} onClose={() => setShowRescheduleModal(false)}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reschedule Appointment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <p className="text-gray-900">{selectedAppointment.patientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={confirmReschedule}>
                  <Save className="h-4 w-4 mr-2" />
              Confirm Reschedule
            </Button>
                <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>
                  Cancel
                </Button>
              </div>
          </div>
        </div>
      </Modal>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedPatient && selectedAppointment && (
        <Modal isOpen={showPrescriptionModal} onClose={() => setShowPrescriptionModal(false)}>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Prescription</h2>
            <div className="space-y-4">
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <p className="text-gray-900">{selectedPatient.first_name} {selectedPatient.last_name}</p>
          </div>
          
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment</label>
                <p className="text-gray-900">{selectedAppointment.type} - {selectedAppointment.date}</p>
          </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Medications</label>
                {prescriptionData.medications.map((med, index) => (
                  <div key={index} className="space-y-3 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Medication name"
                        value={med}
                        onChange={(e) => updatePrescriptionField(index, 'medications', e.target.value)}
                      />
                      <Input
                        placeholder="Dosage (e.g., 500mg)"
                        value={prescriptionData.dosage[index]}
                        onChange={(e) => updatePrescriptionField(index, 'dosage', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Frequency (e.g., Twice daily)"
                        value={prescriptionData.frequency[index]}
                        onChange={(e) => updatePrescriptionField(index, 'frequency', e.target.value)}
                      />
                      <Input
                        placeholder="Duration (e.g., 7 days)"
                        value={prescriptionData.duration[index]}
                        onChange={(e) => updatePrescriptionField(index, 'duration', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Instructions (e.g., Take with meals)"
                        value={prescriptionData.instructions[index]}
                        onChange={(e) => updatePrescriptionField(index, 'instructions', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Refills remaining"
                        value={prescriptionData.refills_remaining[index]}
                        onChange={(e) => updatePrescriptionNumberField(index, 'refills_remaining', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePrescriptionField(index)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addPrescriptionField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>



              <div className="flex gap-2 pt-4">
                <Button onClick={confirmPrescription}>
                  <Save className="h-4 w-4 mr-2" />
              Confirm Prescription
            </Button>
                <Button variant="outline" onClick={() => setShowPrescriptionModal(false)}>
                  Cancel
                </Button>
              </div>
          </div>
        </div>
      </Modal>
      )}

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatient && (
        <Modal isOpen={showPatientDetails} onClose={() => setShowPatientDetails(false)}>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Patient Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-theme-light rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-theme-dark" />
                </div>
          <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                  {selectedPatient.date_of_birth && (
                    <p className="text-gray-600">
                      {new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()} years
                    </p>
                  )}
              </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedPatient.email}</p>
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{selectedPatient.phone}</p>
            </div>
          </div>
          
              {selectedPatient.medical_conditions && (
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedPatient.medical_conditions}</p>
          </div>
              )}

              {selectedPatient.allergies && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                  <p className="text-gray-900 bg-red-50 p-3 rounded text-red-800">{selectedPatient.allergies}</p>
                </div>
              )}

              {selectedPatient.medications && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded">{selectedPatient.medications}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowPatientDetails(false)}>
                  Close
            </Button>
          </div>
        </div>
    </div>
        </Modal>
      )}

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleSignOut}
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmText="Sign Out"
          cancelText="Cancel"
        />
      )}
    </DashboardLayout>
  );
}; 
export default DoctorDashboard;
