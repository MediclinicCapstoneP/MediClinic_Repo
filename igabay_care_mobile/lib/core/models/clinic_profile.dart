class ClinicProfile {
  final String id;
  final String userId;
  final String clinicName;
  final String email;
  final String? phone;
  final String? website;
  final String? address;
  final String? city;
  final String? state;
  final String? zipCode;
  final String? licenseNumber;
  final String? accreditation;
  final String? taxId;
  final int? yearEstablished;
  final List<String> specialties;
  final List<String> customSpecialties;
  final List<String> services;
  final List<String> customServices;
  final Map<String, dynamic>? operatingHours;
  final int? numberOfDoctors;
  final int? numberOfStaff;
  final String? description;
  final String? profilePictureUrl;
  final String? profilePicturePath;
  final ClinicStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  ClinicProfile({
    required this.id,
    required this.userId,
    required this.clinicName,
    required this.email,
    this.phone,
    this.website,
    this.address,
    this.city,
    this.state,
    this.zipCode,
    this.licenseNumber,
    this.accreditation,
    this.taxId,
    this.yearEstablished,
    this.specialties = const [],
    this.customSpecialties = const [],
    this.services = const [],
    this.customServices = const [],
    this.operatingHours,
    this.numberOfDoctors,
    this.numberOfStaff,
    this.description,
    this.profilePictureUrl,
    this.profilePicturePath,
    this.status = ClinicStatus.pending,
    required this.createdAt,
    required this.updatedAt,
  });

  String get fullAddress {
    final parts = [
      address,
      city,
      state,
      zipCode,
    ].where((part) => part != null && part.isNotEmpty);
    return parts.join(', ');
  }

  factory ClinicProfile.fromJson(Map<String, dynamic> json) {
    return ClinicProfile(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      clinicName: json['clinic_name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      website: json['website'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      zipCode: json['zip_code'] as String?,
      licenseNumber: json['license_number'] as String?,
      accreditation: json['accreditation'] as String?,
      taxId: json['tax_id'] as String?,
      yearEstablished: json['year_established'] as int?,
      specialties: json['specialties'] != null
          ? List<String>.from(json['specialties'] as List)
          : [],
      customSpecialties: json['custom_specialties'] != null
          ? List<String>.from(json['custom_specialties'] as List)
          : [],
      services: json['services'] != null
          ? List<String>.from(json['services'] as List)
          : [],
      customServices: json['custom_services'] != null
          ? List<String>.from(json['custom_services'] as List)
          : [],
      operatingHours: json['operating_hours'] as Map<String, dynamic>?,
      numberOfDoctors: json['number_of_doctors'] as int?,
      numberOfStaff: json['number_of_staff'] as int?,
      description: json['description'] as String?,
      profilePictureUrl: json['profile_picture_url'] as String?,
      profilePicturePath: json['profile_picture_path'] as String?,
      status: ClinicStatus.fromString(json['status'] as String? ?? 'pending'),
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'clinic_name': clinicName,
      'email': email,
      'phone': phone,
      'website': website,
      'address': address,
      'city': city,
      'state': state,
      'zip_code': zipCode,
      'license_number': licenseNumber,
      'accreditation': accreditation,
      'tax_id': taxId,
      'year_established': yearEstablished,
      'specialties': specialties,
      'custom_specialties': customSpecialties,
      'services': services,
      'custom_services': customServices,
      'operating_hours': operatingHours,
      'number_of_doctors': numberOfDoctors,
      'number_of_staff': numberOfStaff,
      'description': description,
      'profile_picture_url': profilePictureUrl,
      'profile_picture_path': profilePicturePath,
      'status': status.toString(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  ClinicProfile copyWith({
    String? id,
    String? userId,
    String? clinicName,
    String? email,
    String? phone,
    String? website,
    String? address,
    String? city,
    String? state,
    String? zipCode,
    String? licenseNumber,
    String? accreditation,
    String? taxId,
    int? yearEstablished,
    List<String>? specialties,
    List<String>? customSpecialties,
    List<String>? services,
    List<String>? customServices,
    Map<String, dynamic>? operatingHours,
    int? numberOfDoctors,
    int? numberOfStaff,
    String? description,
    String? profilePictureUrl,
    String? profilePicturePath,
    ClinicStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ClinicProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      clinicName: clinicName ?? this.clinicName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      website: website ?? this.website,
      address: address ?? this.address,
      city: city ?? this.city,
      state: state ?? this.state,
      zipCode: zipCode ?? this.zipCode,
      licenseNumber: licenseNumber ?? this.licenseNumber,
      accreditation: accreditation ?? this.accreditation,
      taxId: taxId ?? this.taxId,
      yearEstablished: yearEstablished ?? this.yearEstablished,
      specialties: specialties ?? this.specialties,
      customSpecialties: customSpecialties ?? this.customSpecialties,
      services: services ?? this.services,
      customServices: customServices ?? this.customServices,
      operatingHours: operatingHours ?? this.operatingHours,
      numberOfDoctors: numberOfDoctors ?? this.numberOfDoctors,
      numberOfStaff: numberOfStaff ?? this.numberOfStaff,
      description: description ?? this.description,
      profilePictureUrl: profilePictureUrl ?? this.profilePictureUrl,
      profilePicturePath: profilePicturePath ?? this.profilePicturePath,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

enum ClinicStatus {
  pending,
  approved,
  rejected;

  static ClinicStatus fromString(String status) {
    switch (status) {
      case 'pending':
        return ClinicStatus.pending;
      case 'approved':
        return ClinicStatus.approved;
      case 'rejected':
        return ClinicStatus.rejected;
      default:
        return ClinicStatus.pending;
    }
  }

  @override
  String toString() {
    return name;
  }
}
