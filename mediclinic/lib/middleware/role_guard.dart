import 'package:flutter/material.dart';
import '../models/user_model.dart';

class RoleGuard extends StatelessWidget {
  final AppUser user;
  final String requiredRole;
  final Widget child;

  const RoleGuard({required this.user, required this.requiredRole, required this.child});

  @override
  Widget build(BuildContext context) {
    return user.role == requiredRole ? child : Center(child: Text('Access Denied'));
  }
}