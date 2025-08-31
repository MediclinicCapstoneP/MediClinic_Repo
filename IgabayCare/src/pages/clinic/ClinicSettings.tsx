import React, { useState, useEffect } from "react";
import {
  Save,
  Camera,
  Clock,
  DollarSign,
  Shield,
  Bell,
  Edit,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ProfilePicture } from '../../components/ui/ProfilePicture';
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { roleBasedAuthService } from "../../features/auth/utils/roleBasedAuthService";
import {
  clinicService,
  type ClinicProfile,
} from "../../features/auth/utils/clinicService";
import {
  ClinicPaymentMethod,
  CreateClinicPaymentMethodData,
  PaymentMethodType
} from '../../types/payment';
import { ClinicPaymentMethodService } from '../../services/paymentService';

export const ClinicSettings: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clinicData, setClinicData] = useState<ClinicProfile>({
    id: "",
    user_id: "",
    clinic_name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    license_number: "",
    accreditation: "",
    tax_id: "",
    year_established: undefined,
    specialties: [],
    custom_specialties: [],
    services: [],
    custom_services: [],
    operating_hours: {
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "18:00" },
      saturday: { open: "09:00", close: "16:00" },
      sunday: { open: "10:00", close: "14:00" },
    },
    number_of_doctors: 0,
    number_of_staff: 0,
    description: "",
    status: "pending",
    created_at: "",
    updated_at: "",
    profile_pic_url: undefined,
  });

  const [originalData, setOriginalData] = useState<ClinicProfile | null>(null);

  const [settings, setSettings] = useState({
    paymentBeforeBooking: true,
    emailNotifications: true,
    smsNotifications: false,
    bookingConfirmation: true,
    autoValidation: true,
  });

  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    thisMonth: 0,
    status: "pending",
  });

  const [paymentMethods, setPaymentMethods] = useState<ClinicPaymentMethod[]>([]);
  const [showPaymentMethodForm, setShowPaymentMethodForm] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<ClinicPaymentMethod | null>(null);
  
  // Payment method form state
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    method_type: 'gcash' as PaymentMethodType,
    is_enabled: true,
    account_number: '',
    account_name: '',
    bank_name: '',
    branch_code: '',
    qr_code_url: '',
    minimum_amount: 0,
    maximum_amount: undefined as number | undefined,
    processing_fee_percentage: 0,
    processing_fee_fixed: 0,
    payment_instructions: '',
    notes: '',
    status: 'active' as 'active' | 'inactive' | 'pending_verification'
  });

  const handleProfilePictureUpdate = (url: string) => {
    setClinicData(prev => ({
      ...prev,
      profile_pic_url: url,
    }));
  };

  const handleProfilePictureDelete = () => {
    setClinicData(prev => ({
      ...prev,
      profile_pic_url: undefined,
    }));
  };

  // Fetch clinic data from Supabase
  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const currentUser = await roleBasedAuthService.getCurrentUser();
        if (!currentUser || currentUser.role !== "clinic") {
          setError(
            "No authenticated clinic user found. Please sign in as a clinic."
          );
          return;
        }

        if (!currentUser.user || !currentUser.user.id) {
          setError("Invalid user session. Please sign in again.");
          return;
        }

        console.log("Fetching clinic data for user:", currentUser.user.id);

        const clinicResult = await clinicService.getClinicByUserId(
          currentUser.user.id
        );
        if (clinicResult.success && clinicResult.clinic) {
          // Convert null values to empty strings for React inputs
          const sanitizedClinic = {
            ...clinicResult.clinic,
            phone: clinicResult.clinic.phone || "",
            website: clinicResult.clinic.website || "",
            address: clinicResult.clinic.address || "",
            city: clinicResult.clinic.city || "",
            state: clinicResult.clinic.state || "",
            zip_code: clinicResult.clinic.zip_code || "",
            license_number: clinicResult.clinic.license_number || "",
            accreditation: clinicResult.clinic.accreditation || "",
            tax_id: clinicResult.clinic.tax_id || "",
            description: clinicResult.clinic.description || "",
            profile_pic_url: clinicResult.clinic.profile_pic_url || undefined,
            specialties: clinicResult.clinic.specialties || [],
            custom_specialties: clinicResult.clinic.custom_specialties || [],
            services: clinicResult.clinic.services || [],
            custom_services: clinicResult.clinic.custom_services || [],
            operating_hours: clinicResult.clinic.operating_hours || {
              monday: { open: "08:00", close: "18:00" },
              tuesday: { open: "08:00", close: "18:00" },
              wednesday: { open: "08:00", close: "18:00" },
              thursday: { open: "08:00", close: "18:00" },
              friday: { open: "08:00", close: "18:00" },
              saturday: { open: "09:00", close: "16:00" },
              sunday: { open: "10:00", close: "14:00" },
            },
            number_of_doctors: clinicResult.clinic.number_of_doctors || 0,
            number_of_staff: clinicResult.clinic.number_of_staff || 0,
          };
          setClinicData(sanitizedClinic);
          setOriginalData(sanitizedClinic);

          // Update stats
          setStats({
            totalDoctors: sanitizedClinic.number_of_doctors || 0,
            totalPatients: 1247, // Mock data for now
            thisMonth: 69, // Mock data for now
            status: sanitizedClinic.status,
          });

          // After setting clinic data, fetch payment methods
          setTimeout(() => {
            fetchPaymentMethods();
          }, 0);
        } else {
          if (clinicResult.clinic === undefined) {
            // No clinic profile found - show setup message
            setError(
              "No clinic profile found. Please complete your clinic registration or contact support."
            );
          } else {
            setError(
              clinicResult.error ||
                "Clinic profile not found. Please complete your clinic registration."
            );
          }
        }
      } catch (err) {
        console.error("Error fetching clinic data:", err);
        setError("Failed to load clinic data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setError(null);

      const currentUser = await roleBasedAuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== "clinic") {
        throw new Error("No authenticated clinic user found");
      }

      // Update clinic data in Supabase
      const sanitizedData = sanitizeDataForDatabase(clinicData);
      
      // If profile picture was updated, use the specific update function first
      if (clinicData.profile_pic_url !== originalData?.profile_pic_url) {
        const profilePicResult = await clinicService.updateClinicProfilePicture(
          clinicData.id,
          clinicData.profile_pic_url || ''
        );
        
        if (!profilePicResult.success) {
          throw new Error(profilePicResult.error || "Failed to update profile picture");
        }
      }
      
      const updatedData = await clinicService.updateClinic(
        clinicData.id,
        sanitizedData
      );

      if (updatedData.success && updatedData.clinic) {
        setClinicData(updatedData.clinic);
        setOriginalData(updatedData.clinic);
        setIsEditing(false);
        // You could add a success toast here
      } else {
        throw new Error(updatedData.error || "Failed to update clinic profile");
      }
    } catch (err) {
      console.error("Error saving clinic profile:", err);
      setError("Failed to save clinic profile changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setClinicData(originalData);
    }
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setClinicData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper function to sanitize data for database
  const sanitizeDataForDatabase = (data: ClinicProfile) => {
    return {
      ...data,
      phone: data.phone || undefined,
      website: data.website || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zip_code: data.zip_code || undefined,
      license_number: data.license_number || undefined,
      accreditation: data.accreditation || undefined,
      tax_id: data.tax_id || undefined,
      description: data.description || undefined,
    };
  };

  const handleOperatingHoursChange = (
    day: string,
    field: "open" | "close",
    value: string
  ) => {
    setClinicData((prev) => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: {
          ...prev.operating_hours[day as keyof typeof prev.operating_hours],
          [field]: value,
        },
      },
    }));
  };

  const handleSettingToggle = (setting: string) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev],
    }));
  };

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  // Fetch clinic payment methods
  const fetchPaymentMethods = async () => {
    if (!clinicData.id) return;
    
    try {
      const result = await ClinicPaymentMethodService.getClinicPaymentMethods(clinicData.id);
      if (result.success && result.data) {
        setPaymentMethods(result.data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  // Handle payment method form changes
  const handlePaymentMethodFormChange = (field: string, value: any) => {
    setPaymentMethodForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle save payment method
  const handleSavePaymentMethod = async () => {
    if (!clinicData.id) return;
    
    try {
      const paymentMethodData: CreateClinicPaymentMethodData = {
        clinic_id: clinicData.id,
        ...paymentMethodForm
      };
      
      let result;
      if (editingPaymentMethod) {
        // Update existing payment method
        result = await ClinicPaymentMethodService.updatePaymentMethod({
          id: editingPaymentMethod.id,
          ...paymentMethodForm
        });
      } else {
        // Create new payment method
        result = await ClinicPaymentMethodService.createPaymentMethod(paymentMethodData);
      }
      
      if (result.success) {
        setShowPaymentMethodForm(false);
        setEditingPaymentMethod(null);
        setPaymentMethodForm({
          method_type: 'gcash',
          is_enabled: true,
          account_number: '',
          account_name: '',
          bank_name: '',
          branch_code: '',
          qr_code_url: '',
          minimum_amount: 0,
          maximum_amount: undefined,
          processing_fee_percentage: 0,
          processing_fee_fixed: 0,
          payment_instructions: '',
          notes: '',
          status: 'active'
        });
        fetchPaymentMethods();
      } else {
        setError(result.error || 'Failed to save payment method');
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      setError('Failed to save payment method');
    }
  };

  // Handle edit payment method
  const handleEditPaymentMethod = (method: ClinicPaymentMethod) => {
    setEditingPaymentMethod(method);
    setPaymentMethodForm({
      method_type: method.method_type,
      is_enabled: method.is_enabled,
      account_number: method.account_number || '',
      account_name: method.account_name || '',
      bank_name: method.bank_name || '',
      branch_code: method.branch_code || '',
      qr_code_url: method.qr_code_url || '',
      minimum_amount: method.minimum_amount,
      maximum_amount: method.maximum_amount,
      processing_fee_percentage: method.processing_fee_percentage,
      processing_fee_fixed: method.processing_fee_fixed,
      payment_instructions: method.payment_instructions || '',
      notes: method.notes || '',
      status: method.status
    });
    setShowPaymentMethodForm(true);
  };

  // Handle delete payment method
  const handleDeletePaymentMethod = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    
    try {
      const result = await ClinicPaymentMethodService.deletePaymentMethod(id);
      if (result.success) {
        fetchPaymentMethods();
      } else {
        setError(result.error || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setError('Failed to delete payment method');
    }
  };

  // Handle cancel payment method form
  const handleCancelPaymentMethodForm = () => {
    setShowPaymentMethodForm(false);
    setEditingPaymentMethod(null);
    setPaymentMethodForm({
      method_type: 'gcash',
      is_enabled: true,
      account_number: '',
      account_name: '',
      bank_name: '',
      branch_code: '',
      qr_code_url: '',
      minimum_amount: 0,
      maximum_amount: undefined,
      processing_fee_percentage: 0,
      processing_fee_fixed: 0,
      payment_instructions: '',
      notes: '',
      status: 'active'
    });
  };

  // Get payment method name
  const getPaymentMethodName = (type: PaymentMethodType) => {
    const names = {
      gcash: 'GCash',
      paymaya: 'PayMaya',
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      cash: 'Cash Payment'
    };
    return names[type] || type;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading clinic settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Clinic Settings
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Clinic Settings
          </h1>
          <p className="text-gray-600">
            Manage your clinic's information and preferences
          </p>
        </div>
        <div className="flex space-x-2">
          {isEditing && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant={isEditing ? "gradient" : "outline"}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            loading={isSaving}
          >
            {isEditing ? (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <Edit size={16} className="mr-2" />
                Edit Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={20} className="text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Clinic Logo */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <ProfilePicture
                  currentImageUrl={clinicData.profile_pic_url || undefined}
                  userId={clinicData.user_id}
                  userType="clinic"
                  size="xl"
                  onImageUpdate={handleProfilePictureUpdate}
                  onImageDelete={handleProfilePictureDelete}
                  disabled={!isEditing}
                  className="mx-auto"
                />
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors">
                    <Camera size={16} />
                  </button>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {clinicData.clinic_name}
              </h3>
              <p className="text-gray-600">{clinicData.email}</p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Stats
              </h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Doctors</span>
                  <span className="font-medium">{stats.totalDoctors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Patients</span>
                  <span className="font-medium">{stats.totalPatients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-medium">
                    {stats.thisMonth} appointments
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`px-2 py-1 text-sm font-medium rounded-full ${
                      stats.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : stats.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {stats.status.charAt(0).toUpperCase() +
                      stats.status.slice(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <Input
                label="Clinic Name"
                value={clinicData.clinic_name}
                onChange={(e) =>
                  handleInputChange("clinic_name", e.target.value)
                }
                disabled={!isEditing}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  value={clinicData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={clinicData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <Input
                label="Website"
                value={clinicData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                disabled={!isEditing}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={clinicData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={clinicData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* License & Accreditation */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="text-primary-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  License & Accreditation
                </h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Medical License Number"
                  value={clinicData.license_number}
                  onChange={(e) =>
                    handleInputChange("license_number", e.target.value)
                  }
                  disabled={!isEditing}
                />
                <Input
                  label="Accreditation Number"
                  value={clinicData.accreditation}
                  onChange={(e) =>
                    handleInputChange("accreditation", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="text-green-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payment Methods
                  </h3>
                </div>
                <Button 
                  onClick={() => {
                    setEditingPaymentMethod(null);
                    setShowPaymentMethodForm(true);
                  }}
                  disabled={!isEditing}
                  variant="outline"
                >
                  Add Payment Method
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Configure payment methods that patients can use when booking appointments
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {showPaymentMethodForm ? (
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900">
                    {editingPaymentMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method Type
                      </label>
                      <select
                        value={paymentMethodForm.method_type}
                        onChange={(e) => handlePaymentMethodFormChange('method_type', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      >
                        <option value="gcash">GCash</option>
                        <option value="paymaya">PayMaya</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="debit_card">Debit Card</option>
                        <option value="cash">Cash Payment</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={paymentMethodForm.status}
                        onChange={(e) => handlePaymentMethodFormChange('status', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending_verification">Pending Verification</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={paymentMethodForm.is_enabled}
                          onChange={(e) => handlePaymentMethodFormChange('is_enabled', e.target.checked)}
                          disabled={!isEditing}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enabled for patients</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Method-specific fields */}
                  {paymentMethodForm.method_type === 'gcash' || paymentMethodForm.method_type === 'paymaya' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Phone Number"
                        value={paymentMethodForm.account_number}
                        onChange={(e) => handlePaymentMethodFormChange('account_number', e.target.value)}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Account Name"
                        value={paymentMethodForm.account_name}
                        onChange={(e) => handlePaymentMethodFormChange('account_name', e.target.value)}
                        disabled={!isEditing}
                      />
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          QR Code URL (Optional)
                        </label>
                        <Input
                          value={paymentMethodForm.qr_code_url}
                          onChange={(e) => handlePaymentMethodFormChange('qr_code_url', e.target.value)}
                          disabled={!isEditing}
                          placeholder="https://example.com/qr-code.png"
                        />
                      </div>
                    </div>
                  ) : null}
                  
                  {paymentMethodForm.method_type === 'bank_transfer' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Bank Name"
                        value={paymentMethodForm.bank_name}
                        onChange={(e) => handlePaymentMethodFormChange('bank_name', e.target.value)}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Account Number"
                        value={paymentMethodForm.account_number}
                        onChange={(e) => handlePaymentMethodFormChange('account_number', e.target.value)}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Account Name"
                        value={paymentMethodForm.account_name}
                        onChange={(e) => handlePaymentMethodFormChange('account_name', e.target.value)}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Branch Code (Optional)"
                        value={paymentMethodForm.branch_code}
                        onChange={(e) => handlePaymentMethodFormChange('branch_code', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  ) : null}
                  
                  {(paymentMethodForm.method_type === 'credit_card' || paymentMethodForm.method_type === 'debit_card') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Account Name"
                        value={paymentMethodForm.account_name}
                        onChange={(e) => handlePaymentMethodFormChange('account_name', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  ) : null}
                  
                  {/* Fee configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Processing Fee Percentage (%)"
                      type="number"
                      step="0.01"
                      value={paymentMethodForm.processing_fee_percentage}
                      onChange={(e) => handlePaymentMethodFormChange('processing_fee_percentage', parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Processing Fee Fixed Amount (₱)"
                      type="number"
                      step="0.01"
                      value={paymentMethodForm.processing_fee_fixed}
                      onChange={(e) => handlePaymentMethodFormChange('processing_fee_fixed', parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  {/* Amount limits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Minimum Amount (₱)"
                      type="number"
                      step="0.01"
                      value={paymentMethodForm.minimum_amount}
                      onChange={(e) => handlePaymentMethodFormChange('minimum_amount', parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Maximum Amount (₱) (Optional)"
                      type="number"
                      step="0.01"
                      value={paymentMethodForm.maximum_amount || ''}
                      onChange={(e) => handlePaymentMethodFormChange('maximum_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  {/* Instructions and notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Instructions (Optional)
                    </label>
                    <textarea
                      value={paymentMethodForm.payment_instructions}
                      onChange={(e) => handlePaymentMethodFormChange('payment_instructions', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      rows={3}
                      placeholder="Instructions for patients on how to complete this payment method..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Internal Notes (Optional)
                    </label>
                    <textarea
                      value={paymentMethodForm.notes}
                      onChange={(e) => handlePaymentMethodFormChange('notes', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                      rows={2}
                      placeholder="Internal notes about this payment method..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={handleCancelPaymentMethodForm} disabled={!isEditing}>
                      Cancel
                    </Button>
                    <Button onClick={handleSavePaymentMethod} disabled={!isEditing}>
                      {editingPaymentMethod ? 'Update' : 'Add'} Payment Method
                    </Button>
                  </div>
                </div>
              ) : null}
              
              {/* Payment methods list */}
              <div className="space-y-3">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <div 
                      key={method.id} 
                      className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {getPaymentMethodName(method.method_type)}
                          </span>
                          {method.is_enabled ? (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Enabled
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Disabled
                            </span>
                          )}
                          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            method.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                            method.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {method.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {method.account_name && (
                            <span>Account: {method.account_name} • </span>
                          )}
                          {method.account_number && (
                            <span>Number: {method.account_number} • </span>
                          )}
                          {(method.processing_fee_percentage > 0 || method.processing_fee_fixed > 0) && (
                            <span>
                              Fee: {method.processing_fee_percentage}% + ₱{method.processing_fee_fixed}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditPaymentMethod(method)}
                          disabled={!isEditing}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          disabled={!isEditing}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">No payment methods configured</p>
                    <p className="text-sm">Add payment methods to allow patients to pay when booking appointments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Operating Hours
                </h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {days.map((day) => (
                  <div
                    key={day.key}
                    className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-24 text-sm font-medium text-gray-900">
                      {day.label}
                    </div>
                    <Input
                      type="time"
                      value={
                        clinicData.operating_hours[
                          day.key as keyof typeof clinicData.operating_hours
                        ].open
                      }
                      onChange={(e) =>
                        handleOperatingHoursChange(
                          day.key,
                          "open",
                          e.target.value
                        )
                      }
                      disabled={!isEditing}
                      className="flex-1"
                    />
                    <div className="text-gray-500">to</div>
                    <Input
                      type="time"
                      value={
                        clinicData.operating_hours[
                          day.key as keyof typeof clinicData.operating_hours
                        ].close
                      }
                      onChange={(e) =>
                        handleOperatingHoursChange(
                          day.key,
                          "close",
                          e.target.value
                        )
                      }
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Booking Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <DollarSign className="text-purple-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Booking Settings
                </h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Payment Before Booking
                    </h4>
                    <p className="text-sm text-gray-600">
                      Require patients to pay before confirming appointments
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingToggle("paymentBeforeBooking")}
                    disabled={!isEditing}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.paymentBeforeBooking
                        ? "bg-primary-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full transition-transform ${
                        settings.paymentBeforeBooking
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Automated Validation
                    </h4>
                    <p className="text-sm text-gray-600">
                      Use ML to validate bookings and prevent fraud
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingToggle("autoValidation")}
                    disabled={!isEditing}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.autoValidation ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full transition-transform ${
                        settings.autoValidation
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="text-orange-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Notification Settings
                </h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Email Notifications
                    </h4>
                    <p className="text-sm text-gray-600">
                      Receive appointment updates via email
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingToggle("emailNotifications")}
                    disabled={!isEditing}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.emailNotifications
                        ? "bg-primary-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full transition-transform ${
                        settings.emailNotifications
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      SMS Notifications
                    </h4>
                    <p className="text-sm text-gray-600">
                      Receive text message notifications
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingToggle("smsNotifications")}
                    disabled={!isEditing}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.smsNotifications
                        ? "bg-primary-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full transition-transform ${
                        settings.smsNotifications
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Booking Confirmations
                    </h4>
                    <p className="text-sm text-gray-600">
                      Send confirmation notifications for new bookings
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingToggle("bookingConfirmation")}
                    disabled={!isEditing}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.bookingConfirmation
                        ? "bg-primary-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full transition-transform ${
                        settings.bookingConfirmation
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
