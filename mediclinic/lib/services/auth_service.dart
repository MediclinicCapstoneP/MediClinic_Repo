import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';

class AuthService {
  final _auth = FirebaseAuth.instance;
  final _db = FirebaseFirestore.instance;
  
  Future<AppUser?> register(String email, String password, String role, {String? phone, String? name}) async {
    final cred = await _auth.createUserWithEmailAndPassword(email: email, password: password);
    final user = AppUser(uid: cred.user!.uid, email: email, role: role, phone: phone, name: name);
    await _db.collection('users').doc(user.uid).set(user.toMap());
    await cred.user!.sendEmailVerification();
    return user;
  }

  Future<AppUser?> signIn(String email, String password) async {
    final cred = await _auth.signInWithEmailAndPassword(email: email, password: password);
    final doc = await _db.collection('users').doc(cred.user!.uid).get();
    return AppUser.fromMap(doc.data()!);
  }

  Future<void> signOut() async => _auth.signOut();
}