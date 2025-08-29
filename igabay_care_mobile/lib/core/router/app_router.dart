/// App Router with Custom Implementations
///
/// This file provides navigation functionality for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:flutter/material.dart (replaced with custom Widget classes)
/// - package:go_router/go_router.dart (replaced with MockGoRouter)
/// - package:provider/provider.dart (replaced with MockProvider)
///
/// The mock implementations maintain API compatibility for future migration
/// back to real packages when the environment issues are resolved.

// Custom implementations to replace unavailable packages
// import 'package:flutter/material.dart'; // Replaced with custom widgets
// import 'package:go_router/go_router.dart'; // Replaced with MockGoRouter
// import 'package:provider/provider.dart'; // Replaced with MockProvider

import '../providers/auth_provider.dart';
import '../models/user.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/auth/screens/role_selection_screen.dart';
import '../../features/patient/screens/patient_home_screen.dart';
import '../../features/patient/screens/book_appointment_screen.dart';
import '../../features/patient/screens/patient_appointments_screen.dart';
import '../../features/patient/screens/patient_profile_screen.dart';
import '../../features/clinic/screens/clinic_home_screen.dart';
import '../../features/clinic/screens/clinic_appointments_screen.dart';
import '../../features/clinic/screens/clinic_profile_screen.dart';
import '../../features/onboarding/screens/welcome_screen.dart';

/// Custom Widget base class
abstract class Widget {
  const Widget();
}

/// Custom BuildContext for navigation
class BuildContext {
  final Map<String, dynamic> _data = {};

  T? read<T>() {
    return _data[T.toString()] as T?;
  }

  void _setProvider<T>(T provider) {
    _data[T.toString()] = provider;
  }
}

/// Mock URI class for route parameters
class MockUri {
  final Map<String, String> queryParameters;

  MockUri(this.queryParameters);
}

/// Mock GoRouterState for navigation state
class GoRouterState {
  final MockUri uri;
  final String matchedLocation;

  GoRouterState({required this.uri, required this.matchedLocation});
}

/// Mock GoRoute for route definitions
class GoRoute {
  final String path;
  final String name;
  final dynamic Function(BuildContext, GoRouterState)? builder;
  final List<GoRoute> routes;

  GoRoute({
    required this.path,
    required this.name,
    this.builder,
    this.routes = const [],
  });
}

/// Custom ChangeNotifier replacement
abstract class ChangeNotifier {
  final List<void Function()> _listeners = [];

  void addListener(void Function() listener) {
    _listeners.add(listener);
  }

  void removeListener(void Function() listener) {
    _listeners.remove(listener);
  }

  void notifyListeners() {
    for (final listener in _listeners) {
      try {
        listener();
      } catch (e) {
        print('Error in listener: $e');
      }
    }
  }

  void dispose() {
    _listeners.clear();
  }
}

/// Mock Provider class for state management
class Provider {
  static T of<T>(BuildContext context, {bool listen = true}) {
    final provider = context.read<T>();
    if (provider == null) {
      throw Exception('Provider<$T> not found in context');
    }
    return provider;
  }
}

/// Mock GoRouter for navigation management
class GoRouter {
  final String initialLocation;
  final List<GoRoute> routes;
  final String? Function(BuildContext, GoRouterState)? redirect;
  final ChangeNotifier? refreshListenable;

  // Current navigation state
  String _currentLocation = '/';
  final Map<String, String> _queryParameters = {};

  GoRouter({
    required this.initialLocation,
    required this.routes,
    this.redirect,
    this.refreshListenable,
  }) {
    _currentLocation = initialLocation;
    print('[MockGoRouter] Initialized with location: $initialLocation');
  }

  // Navigation methods
  void go(String location, {Map<String, String>? queryParameters}) {
    _currentLocation = location;
    if (queryParameters != null) {
      _queryParameters.clear();
      _queryParameters.addAll(queryParameters);
    }
    print('[MockGoRouter] Navigated to: $location');
  }

  void push(String location, {Map<String, String>? queryParameters}) {
    // In a real implementation, this would maintain a navigation stack
    go(location, queryParameters: queryParameters);
    print('[MockGoRouter] Pushed: $location');
  }

  void pop() {
    // Mock pop implementation
    print('[MockGoRouter] Pop navigation');
  }

  void goNamed(String name, {Map<String, String>? queryParameters}) {
    // Find route by name
    final route = _findRouteByName(name);
    if (route != null) {
      go(route.path, queryParameters: queryParameters);
    } else {
      print('[MockGoRouter] Route not found: $name');
    }
  }

  GoRoute? _findRouteByName(String name) {
    for (final route in routes) {
      if (route.name == name) return route;
      // Search nested routes
      final found = _findRouteByNameRecursive(route.routes, name);
      if (found != null) return found;
    }
    return null;
  }

  GoRoute? _findRouteByNameRecursive(List<GoRoute> routes, String name) {
    for (final route in routes) {
      if (route.name == name) return route;
      final found = _findRouteByNameRecursive(route.routes, name);
      if (found != null) return found;
    }
    return null;
  }

  // Current route information
  String get currentLocation => _currentLocation;
  Map<String, String> get queryParameters => Map.unmodifiable(_queryParameters);
}

class AppRouter {
  static GoRouter get router => _router;

  // Static context for global navigation access
  static BuildContext? _globalContext;

  static void setGlobalContext(BuildContext context) {
    _globalContext = context;
  }

  // Utility navigation methods
  static void go(String location, {Map<String, String>? queryParameters}) {
    _router.go(location, queryParameters: queryParameters);
  }

  static void goNamed(String name, {Map<String, String>? queryParameters}) {
    _router.goNamed(name, queryParameters: queryParameters);
  }

  static void push(String location, {Map<String, String>? queryParameters}) {
    _router.push(location, queryParameters: queryParameters);
  }

  static void pop() {
    _router.pop();
  }

  static final GoRouter _router = GoRouter(
    initialLocation: '/welcome',
    routes: [
      // Welcome and onboarding routes
      GoRoute(
        path: '/welcome',
        name: 'welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),

      // Authentication routes
      GoRoute(
        path: '/role-selection',
        name: 'role-selection',
        builder: (context, state) => const RoleSelectionScreen(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) {
          final role = state.uri.queryParameters['role'];
          return LoginScreen(role: role);
        },
      ),
      GoRoute(
        path: '/signup',
        name: 'signup',
        builder: (context, state) {
          final role = state.uri.queryParameters['role'];
          return SignupScreen(role: role);
        },
      ),

      // Patient routes
      GoRoute(
        path: '/patient',
        name: 'patient-home',
        builder: (context, state) => const PatientHomeScreen(),
        routes: [
          GoRoute(
            path: 'appointments',
            name: 'patient-appointments',
            builder: (context, state) => const PatientAppointmentsScreen(),
          ),
          GoRoute(
            path: 'book-appointment',
            name: 'book-appointment',
            builder: (context, state) {
              final clinicId = state.uri.queryParameters['clinicId'];
              return BookAppointmentScreen(clinicId: clinicId);
            },
          ),
          GoRoute(
            path: 'profile',
            name: 'patient-profile',
            builder: (context, state) => const PatientProfileScreen(),
          ),
        ],
      ),

      // Clinic routes
      GoRoute(
        path: '/clinic',
        name: 'clinic-home',
        builder: (context, state) => const ClinicHomeScreen(),
        routes: [
          GoRoute(
            path: 'appointments',
            name: 'clinic-appointments',
            builder: (context, state) => const ClinicAppointmentsScreen(),
          ),
          GoRoute(
            path: 'profile',
            name: 'clinic-profile',
            builder: (context, state) => const ClinicProfileScreen(),
          ),
        ],
      ),
    ],
    redirect: (context, state) {
      // Mock context setup - in a real app, this would be provided by the framework
      final mockAuthProvider = AuthProvider();
      context._setProvider<AuthProvider>(mockAuthProvider);

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final isAuthenticated = authProvider.isAuthenticated;
      final user = authProvider.user;

      // Public routes that don't require authentication
      final publicRoutes = ['/welcome', '/role-selection', '/login', '/signup'];
      final isPublicRoute = publicRoutes.any(
        (route) => state.matchedLocation.startsWith(route),
      );

      // If not authenticated and trying to access protected route
      if (!isAuthenticated && !isPublicRoute) {
        return '/welcome';
      }

      // If authenticated and on public route, redirect to appropriate home
      if (isAuthenticated && isPublicRoute) {
        if (user?.role == UserRole.patient) {
          return '/patient';
        } else if (user?.role == UserRole.clinic) {
          return '/clinic';
        }
      }

      // Role-based route protection
      if (isAuthenticated) {
        final isPatientRoute = state.matchedLocation.startsWith('/patient');
        final isClinicRoute = state.matchedLocation.startsWith('/clinic');

        if (user?.role == UserRole.patient && isClinicRoute) {
          return '/patient';
        }

        if (user?.role == UserRole.clinic && isPatientRoute) {
          return '/clinic';
        }
      }

      return null; // No redirect needed
    },
    refreshListenable: AuthChangeNotifier(),
  );
}

class AuthChangeNotifier extends ChangeNotifier {
  AuthChangeNotifier() {
    // Listen to auth changes and notify router
    // This ensures the router rebuilds when auth state changes
    print('[AuthChangeNotifier] Initialized for router refresh');
  }

  void onAuthStateChange() {
    notifyListeners();
  }
}
