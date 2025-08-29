// Custom Flutter Material Design Implementation
// This replaces Flutter Material and GoRouter packages due to package resolution issues

import '../../../core/custom_flutter/custom_flutter.dart';

// Bottom Navigation Components
enum BottomNavigationBarType { fixed, shifting }

class BottomNavigationBarItem {
  final Widget icon;
  final String label;
  final Widget? activeIcon;
  const BottomNavigationBarItem({
    required this.icon,
    required this.label,
    this.activeIcon,
  });
}

class BottomNavigationBar extends Widget {
  final BottomNavigationBarType? type;
  final int currentIndex;
  final ValueChanged<int>? onTap;
  final List<BottomNavigationBarItem> items;
  final Color? backgroundColor;
  final Color? selectedItemColor;
  final Color? unselectedItemColor;

  const BottomNavigationBar({
    super.key,
    this.type,
    this.currentIndex = 0,
    this.onTap,
    required this.items,
    this.backgroundColor,
    this.selectedItemColor,
    this.unselectedItemColor,
  });
}

class PatientBottomNav extends StatelessWidget {
  final int currentIndex;

  const PatientBottomNav({super.key, required this.currentIndex});

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: currentIndex,
      onTap: (index) => _onItemTapped(context, index),
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        BottomNavigationBarItem(
          icon: Icon(Icons.calendar_today),
          label: 'Appointments',
        ),
        BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
      ],
    );
  }

  void _onItemTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        if (currentIndex != 0) context.go('/patient');
        break;
      case 1:
        if (currentIndex != 1) context.go('/patient/appointments');
        break;
      case 2:
        if (currentIndex != 2) context.go('/patient/profile');
        break;
    }
  }
}
