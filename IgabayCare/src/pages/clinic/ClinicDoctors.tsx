import React, { useState, useEffect } from 'react';
import {
  User,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Star,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  doctorService,
  DoctorProfile,
  CreateDoctorData
} from '../../features/auth/utils/doctorService';
import { roleBasedAuthService } from '../../features/auth/utils/roleBasedAuthService';
import { clinicService } from '../../features/auth/utils/clinicService';

const defaultFormState = {
  full_name: '',
  specialization: '',
  email: '',
  phone: '',
  license_number: '',
  years_experience: '',
  availability: '',
  username: '',
  password: '',
  confirmPassword: ''
};

type FormState = typeof defaultFormState;

interface DoctorFormProps {
  mode: 'add' | 'edit';
  initialData?: Partial<FormState>;
  availableSpecializations: string[];
  clinicSpecializationsHint: string | null;
  onCancel: () => void;
  onSubmit: (form: FormState) => Promise<void>;
  submitting: boolean;
}

const DoctorForm: React.FC<DoctorFormProps> = ({
  mode,
  initialData = {},
  availableSpecializations,
  clinicSpecializationsHint,
  onCancel,
  onSubmit,
  submitting
}) => {
  const [formData, setFormData] = useState<FormState>({
    ...defaultFormState,
    ...initialData
  });

  // Validation helpers
  const passwordsMatch = formData.password === formData.confirmPassword;
  const requiredFilled =
    formData.full_name &&
    formData.specialization &&
    formData.email &&
    formData.license_number &&
    (mode === 'add' ? formData.password && formData.confirmPassword : true);

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <Input
            placeholder="Dr. John Doe"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialization *
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
          >
            <option value="">Select specialization</option>
            {availableSpecializations && availableSpecializations.length > 0 ? (
              availableSpecializations.map((specialization) => (
                <option key={specialization} value={specialization}>
                  {specialization}
                </option>
              ))
            ) : (
              <>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Neurology">Neurology</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Surgery">Surgery</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
                <option value="Family Medicine">Family Medicine</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Obstetrics and Gynecology">
                  Obstetrics and Gynecology
                </option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="ENT (Ear, Nose, Throat)">
                  ENT (Ear, Nose, Throat)
                </option>
                <option value="Radiology">Radiology</option>
                <option value="Anesthesiology">Anesthesiology</option>
                <option value="Pathology">Pathology</option>
                <option value="Oncology">Oncology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Gastroenterology">Gastroenterology</option>
                <option value="Pulmonology">Pulmonology</option>
                <option value="Nephrology">Nephrology</option>
                <option value="Rheumatology">Rheumatology</option>
                <option value="Infectious Disease">Infectious Disease</option>
                <option value="Physical Medicine and Rehabilitation">
                  Physical Medicine and Rehabilitation
                </option>
              </>
            )}
            <option value="Other">Other (Custom)</option>
          </select>
          {clinicSpecializationsHint && (
            <p className="text-xs text-gray-500 mt-1">{clinicSpecializationsHint}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <Input
            type="email"
            placeholder="doctor@clinic.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <Input
            placeholder="+1 234-567-8900"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <Input
            type="number"
            placeholder="10"
            value={formData.years_experience}
            onChange={(e) =>
              setFormData({ ...formData, years_experience: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Number *
          </label>
          <Input
            placeholder="MD-12345"
            value={formData.license_number}
            onChange={(e) =>
              setFormData({ ...formData, license_number: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username (Optional)
          </label>
          <Input
            placeholder="dr.johndoe"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password {mode === 'add' ? '*' : '(leave blank to keep)'}
          </label>
          <Input
            type="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password {mode === 'add' ? '*' : '(leave blank to keep)'}
          </label>
          <Input
            type="password"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Availability
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="e.g., Mon-Fri, 9AM-5PM"
          value={formData.availability}
          onChange={(e) =>
            setFormData({ ...formData, availability: e.target.value })
          }
        />
      </div>

      {!passwordsMatch && (
        <p className="text-xs text-red-600">Passwords do not match.</p>
      )}
      {formData.password && formData.password.length > 0 && formData.password.length < 6 && (
        <p className="text-xs text-red-600">
          Password must be at least 6 characters long.
        </p>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!!(submitting || !requiredFilled || (formData.password && !passwordsMatch) || (formData.password && formData.password.length > 0 && formData.password.length < 6))}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'add' ? 'Adding...' : 'Saving...'}
            </>
          ) : mode === 'add' ? (
            'Add Doctor'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
};

export const ClinicDoctors: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicData, setClinicData] = useState<any>(null);
  const [editModalDoctor, setEditModalDoctor] = useState<DoctorProfile | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = await roleBasedAuthService.getCurrentUser();
        if (user && user.role === 'clinic' && user.user && user.user.id) {
          setCurrentUser(user);

          const clinicResult = await clinicService.getClinicByUserId(user.user.id);
          if (clinicResult.success && clinicResult.clinic) {
            setClinicId(clinicResult.clinic.id);
            setClinicData(clinicResult.clinic);
            await fetchDoctors(clinicResult.clinic.id);
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchDoctors = async (clinicId: string) => {
    try {
      const result = await doctorService.getDoctorsByClinicId(clinicId);
      if (result.success && result.doctors) {
        setDoctors(result.doctors);
      } else {
        console.error('Failed to fetch doctors:', result.error);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const filters = [
    { id: 'all', label: 'All Doctors' },
    { id: 'active', label: 'Active' },
    { id: 'on-leave', label: 'On Leave' },
    { id: 'inactive', label: 'Inactive' }
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === 'all' || doctor.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on-leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableSpecializations = () => {
    const specializations = new Set<string>();

    if (clinicData?.services) {
      clinicData.services.forEach((service: string) =>
        specializations.add(service)
      );
    }
    if (clinicData?.specialties) {
      clinicData.specialties.forEach((specialty: string) =>
        specializations.add(specialty)
      );
    }
    if (clinicData?.custom_specialties) {
      clinicData.custom_specialties.forEach((specialty: string) =>
        specializations.add(specialty)
      );
    }
    if (clinicData?.custom_services) {
      clinicData.custom_services.forEach((service: string) =>
        specializations.add(service)
      );
    }

    return Array.from(specializations);
  };

  const clinicHint = (() => {
    const available = getAvailableSpecializations();
    if (available.length > 0) {
      return `Using clinic's specializations: ${available.join(', ')}`;
    }
    return null;
  })();

  const handleAddDoctor = async (form: FormState) => {
    if (!clinicId || !currentUser || !currentUser.user || !currentUser.user.id) {
      alert('Clinic information not found');
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const doctorData: CreateDoctorData = {
        user_id: currentUser.user.id,
        clinic_id: clinicId,
        full_name: form.full_name,
        specialization: form.specialization,
        email: form.email,
        phone: form.phone || undefined,
        license_number: form.license_number,
        years_experience: form.years_experience
          ? parseInt(form.years_experience)
          : undefined,
        availability: form.availability || undefined,
        status: 'active',
        username: form.username || undefined,
        password: form.password,
        is_clinic_created: true
      };

      const result = await doctorService.createDoctor(doctorData);
      if (result.success) {
        alert(
          'Doctor added successfully! The doctor can now log in with their email and password. Their email has been automatically confirmed.'
        );
        setShowAddModal(false);
        await fetchDoctors(clinicId);
      } else {
        alert(`Failed to add doctor: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding doctor:', error);
      alert('Failed to add doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (doctor: DoctorProfile) => {
    setEditModalDoctor(doctor);
    setShowEditModal(true);
  };

  const handleEditDoctor = async (form: FormState) => {
    if (!clinicId || !editModalDoctor) return;

    if (form.password && form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (form.password && form.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const updatePayload: Partial<CreateDoctorData> = {
        full_name: form.full_name,
        specialization: form.specialization,
        email: form.email,
        phone: form.phone || undefined,
        license_number: form.license_number,
        years_experience: form.years_experience
          ? parseInt(form.years_experience)
          : undefined,
        availability: form.availability || undefined,
        username: form.username || undefined
      };

      if (form.password) {
        updatePayload.password = form.password;
      }

      const result = await doctorService.updateDoctor(
        editModalDoctor.id,
        updatePayload
      );
      if (result.success) {
        alert('Doctor updated successfully.');
        setShowEditModal(false);
        setEditModalDoctor(null);
        await fetchDoctors(clinicId);
      } else {
        alert(`Failed to update doctor: ${result.error}`);
      }
    } catch (err) {
      console.error('Error updating doctor:', err);
      alert('Failed to update doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDoctor = async (doctor: DoctorProfile) => {
    if (!clinicId) return;
    const confirmed = window.confirm(
      `Are you sure you want to remove Dr. ${doctor.full_name}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const result = await doctorService.deleteDoctor(doctor.id);
      if (result.success) {
        setDoctors((prev) => prev.filter((d) => d.id !== doctor.id));
        alert('Doctor removed.');
      } else {
        alert(`Failed to remove doctor: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting doctor:', err);
      alert('Failed to remove doctor');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctors</h1>
        <p className="text-gray-600">
          Manage your clinic's medical staff and doctors
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search doctors by name or specialization..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {filters.map((filter) => (
                      <option key={filter.id} value={filter.id}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Doctor
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <Card
            key={doctor.id}
            className="hover:shadow-lg transition-shadow relative"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {doctor.full_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {doctor.specialization}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    doctor.status
                  )}`}
                >
                  {doctor.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-medium">
                    {doctor.years_experience || 0} years
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{doctor.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Patients</span>
                  <span className="font-medium">{doctor.total_patients}</span>
                </div>

                {doctor.availability && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {doctor.availability}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-1" />
                    {doctor.email}
                  </div>
                </div>
                {doctor.phone && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-1" />
                      {doctor.phone}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditModal(doctor)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteDoctor(doctor)}
                >
                  Delete
                </Button>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDoctors.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No doctors found
          </h3>
          <p className="text-gray-600 mb-4">
            {doctors.length === 0
              ? "You haven't added any doctors yet. Get started by adding your first doctor."
              : 'No doctors match your search criteria.'}
          </p>
          {doctors.length === 0 && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Doctor
            </Button>
          )}
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Doctor"
        size="lg"
      >
        <DoctorForm
          mode="add"
          availableSpecializations={getAvailableSpecializations()}
          clinicSpecializationsHint={clinicHint}
          onCancel={() => setShowAddModal(false)}
          onSubmit={handleAddDoctor}
          submitting={submitting}
        />
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditModalDoctor(null);
        }}
        title="Edit Doctor"
        size="lg"
      >
        <DoctorForm
          mode="edit"
          initialData={
            editModalDoctor
              ? {
                  full_name: editModalDoctor.full_name || '',
                  specialization: editModalDoctor.specialization || '',
                  email: editModalDoctor.email || '',
                  phone: editModalDoctor.phone || '',
                  license_number: editModalDoctor.license_number || '',
                  years_experience: editModalDoctor.years_experience
                    ? String(editModalDoctor.years_experience)
                    : '',
                  availability: editModalDoctor.availability || '',
                  username: editModalDoctor.username || ''
                }
              : {}
          }
          availableSpecializations={getAvailableSpecializations()}
          clinicSpecializationsHint={clinicHint}
          onCancel={() => {
            setShowEditModal(false);
            setEditModalDoctor(null);
          }}
          onSubmit={handleEditDoctor}
          submitting={submitting}
        />
      </Modal>
    </div>
  );
};
