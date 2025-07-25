import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/regester.dart';
import 'screens/patient/patient_landing_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MediClinic',
      home: LoginScreen(),
      routes: {
        '/login_screen': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/patientLanding': (context) => const PatientLandingPage(),
      },
    );
  }
}
node -v