class AppUser {
  final String uid;
  final String email;
  final String role; // 'patient' or 'clinic'
  final String? phone;
  final String? name;
  // Add more fields as needed

  AppUser({required this.uid, required this.email, required this.role, this.phone, this.name});

  Map<String, dynamic> toMap() => {
    'uid': uid,
    'email': email,
    'role': role,
    'phone': phone,
    'name': name,
  };

  factory AppUser.fromMap(Map<String, dynamic> map) => AppUser(
    uid: map['uid'],
    email: map['email'],
    role: map['role'],
    phone: map['phone'],
    name: map['name'],
  );
}
