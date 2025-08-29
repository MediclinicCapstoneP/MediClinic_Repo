// Custom Flutter Material Design Implementation
// This replaces Flutter Material, Provider, Supabase, and GoRouter packages

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/config/supabase_config.dart';
import 'core/providers/auth_provider.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart' as app_router;
import 'core/custom_flutter/custom_flutter.dart';

class AppRouter {
  static final router = app_router.AppRouter();
  // make sure core/router/app_router.dart defines `class AppRouter`
}

// Entry point
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
  );

  runApp(const IgabayCareApp());
}

class IgabayCareApp extends StatelessWidget {
  const IgabayCareApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [ChangeNotifierProvider(create: (_) => AuthProvider())],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp.router(
            title: 'IgabayCare Mobile',
            theme: AppTheme.lightTheme,   // ✅ fixed
            darkTheme: AppTheme.darkTheme, // ✅ fixed
            themeMode: ThemeMode.system,
            routerConfig: AppRouter.router,
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }
}
