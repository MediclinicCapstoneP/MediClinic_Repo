// Custom Flutter Material Design Implementation
// This replaces Flutter Material, GoRouter, and Provider packages due to package resolution issues

import '../../../core/providers/auth_provider.dart';
import '../../../core/models/patient_profile.dart';
import '../widgets/patient_bottom_nav.dart';
import '../../../core/custom_flutter/custom_flutter.dart';

class PatientProfileScreen extends StatefulWidget {
  const PatientProfileScreen({super.key});

  @override
  State<PatientProfileScreen> createState() => _PatientProfileScreenState();
}

class _PatientProfileScreenState extends State<PatientProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _emergencyContactController = TextEditingController();
  final _allergiesController = TextEditingController();
  final _medicationsController = TextEditingController();
  final _medicalConditionsController = TextEditingController();

  DateTime? _selectedDateOfBirth;
  String? _selectedBloodType;
  bool _isEditing = false;
  bool _isSaving = false;

  final List<String> _bloodTypes = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _emergencyContactController.dispose();
    _allergiesController.dispose();
    _medicationsController.dispose();
    _medicalConditionsController.dispose();
    super.dispose();
  }

  void _loadProfileData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final profile = authProvider.user?.patientProfile;

    if (profile != null) {
      _firstNameController.text = profile.firstName;
      _lastNameController.text = profile.lastName;
      _phoneController.text = profile.phone ?? '';
      _addressController.text = profile.address ?? '';
      _emergencyContactController.text = profile.emergencyContact ?? '';
      _allergiesController.text = profile.allergies ?? '';
      _medicationsController.text = profile.medications ?? '';
      _medicalConditionsController.text = profile.medicalConditions ?? '';
      _selectedDateOfBirth = profile.dateOfBirth;
      _selectedBloodType = profile.bloodType;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/patient'),
        ),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                setState(() {
                  _isEditing = true;
                });
              },
            )
          else
            TextButton(
              onPressed: _isSaving ? null : _saveProfile,
              child: _isSaving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save'),
            ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final profile = authProvider.user?.patientProfile;

          if (profile == null) {
            return const Center(child: Text('No profile data available'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile Picture Section
                  Center(
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 60,
                          backgroundColor: Theme.of(
                            context,
                          ).colorScheme.primary.withOpacity(0.1),
                          backgroundImage: profile.profilePictureUrl != null
                              ? NetworkImage(profile.profilePictureUrl!)
                              : null,
                          child: profile.profilePictureUrl == null
                              ? Icon(
                                  Icons.person,
                                  size: 60,
                                  color: Theme.of(context).colorScheme.primary,
                                )
                              : null,
                        ),
                        if (_isEditing)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.primary,
                                shape: BoxShape.circle,
                              ),
                              child: IconButton(
                                icon: const Icon(
                                  Icons.camera_alt,
                                  color: Colors.white,
                                ),
                                onPressed: () {
                                  // TODO: Implement image picker
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Image upload coming soon'),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Personal Information Section
                  _buildSectionHeader('Personal Information'),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          controller: _firstNameController,
                          label: 'First Name',
                          icon: Icons.person,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your first name';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _lastNameController,
                          label: 'Last Name',
                          icon: Icons.person,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your last name';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Date of Birth
                  InkWell(
                    onTap: _isEditing ? _selectDateOfBirth : null,
                    child: InputDecorator(
                      decoration: InputDecoration(
                        labelText: 'Date of Birth',
                        prefixIcon: const Icon(Icons.cake),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        // enabled: _isEditing,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _selectedDateOfBirth != null
                                ? '${_selectedDateOfBirth!.day}/${_selectedDateOfBirth!.month}/${_selectedDateOfBirth!.year}'
                                : 'Select date of birth',
                            style: TextStyle(
                              color: _selectedDateOfBirth != null
                                  ? Theme.of(context).colorScheme.onSurface
                                  : Theme.of(
                                      context,
                                    ).colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                          if (_isEditing)
                            Icon(
                              Icons.calendar_today,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _phoneController,
                    label: 'Phone Number',
                    icon: Icons.phone,
                    keyboardType: TextInputType.phone,
                  ),

                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _addressController,
                    label: 'Address',
                    icon: Icons.home,
                    maxLines: 2,
                  ),

                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _emergencyContactController,
                    label: 'Emergency Contact',
                    icon: Icons.emergency,
                    keyboardType: TextInputType.phone,
                  ),

                  const SizedBox(height: 32),

                  // Medical Information Section
                  _buildSectionHeader('Medical Information'),
                  const SizedBox(height: 16),

                  // Blood Type Dropdown
                  DropdownButtonFormField<String>(
                    value: _selectedBloodType,
                    decoration: InputDecoration(
                      labelText: 'Blood Type',
                      prefixIcon: const Icon(Icons.bloodtype),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      // enabled: _isEditing,
                    ),
                    items: _bloodTypes.map((bloodType) {
                      return DropdownMenuItem(
                        value: bloodType,
                        child: Text(bloodType),
                      );
                    }).toList(),
                    onChanged: _isEditing
                        ? (String? value) {
                            setState(() {
                              _selectedBloodType = value;
                            });
                          }
                        : null,
                  ),

                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _allergiesController,
                    label: 'Allergies',
                    icon: Icons.warning,
                    maxLines: 2,
                    hintText: 'List any known allergies...',
                  ),

                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _medicationsController,
                    label: 'Current Medications',
                    icon: Icons.medication,
                    maxLines: 2,
                    hintText: 'List current medications...',
                  ),

                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _medicalConditionsController,
                    label: 'Medical Conditions',
                    icon: Icons.local_hospital,
                    maxLines: 2,
                    hintText: 'List any medical conditions...',
                  ),

                  const SizedBox(height: 32),

                  // Action Buttons
                  if (_isEditing) ...[
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _isSaving
                                ? null
                                : () {
                                    setState(() {
                                      _isEditing = false;
                                    });
                                    _loadProfileData(); // Reset to original data
                                  },
                            child: const Text('Cancel'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isSaving ? null : _saveProfile,
                            child: _isSaving
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text('Save Profile'),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          final authProvider = Provider.of<AuthProvider>(
                            context,
                            listen: false,
                          );
                          authProvider.signOut();
                          context.go('/welcome');
                        },
                        icon: const Icon(Icons.logout),
                        label: const Text('Sign Out'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Theme.of(context).colorScheme.error,
                          side: BorderSide(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: const PatientBottomNav(currentIndex: 2),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: Theme.of(
        context,
      ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hintText,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        hintText: hintText,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        // enabled: _isEditing,
      ),
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
    );
  }

  Future<void> _selectDateOfBirth() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate:
          _selectedDateOfBirth ??
          DateTime.now().subtract(const Duration(days: 365 * 25)),
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 120)),
      lastDate: DateTime.now(),
    );

    if (picked != null && picked != _selectedDateOfBirth) {
      setState(() {
        _selectedDateOfBirth = picked;
      });
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final currentProfile = authProvider.user?.patientProfile;

      if (currentProfile != null) {
        final updatedProfile = currentProfile.copyWith(
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
          phone: _phoneController.text.trim().isEmpty
              ? null
              : _phoneController.text.trim(),
          dateOfBirth: _selectedDateOfBirth,
          address: _addressController.text.trim().isEmpty
              ? null
              : _addressController.text.trim(),
          emergencyContact: _emergencyContactController.text.trim().isEmpty
              ? null
              : _emergencyContactController.text.trim(),
          bloodType: _selectedBloodType,
          allergies: _allergiesController.text.trim().isEmpty
              ? null
              : _allergiesController.text.trim(),
          medications: _medicationsController.text.trim().isEmpty
              ? null
              : _medicationsController.text.trim(),
          medicalConditions: _medicalConditionsController.text.trim().isEmpty
              ? null
              : _medicalConditionsController.text.trim(),
          updatedAt: DateTime.now(),
        );

        await authProvider.updatePatientProfile(updatedProfile);

        if (mounted) {
          setState(() {
            _isEditing = false;
            _isSaving = false;
          });

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile updated successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error updating profile: $e')));
      }
    }
  }
}
