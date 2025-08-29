// Custom Flutter Material Design Implementation
// This replaces Flutter Material and GoRouter packages due to package resolution issues

// Core Flutter Widget System
abstract class Widget {
  final Key? key;
  const Widget({this.key});
}

abstract class StatefulWidget extends Widget {
  const StatefulWidget({super.key});
  State createState();
}

abstract class StatelessWidget extends Widget {
  const StatelessWidget({super.key});
  Widget build(BuildContext context);
}

abstract class State<T extends StatefulWidget> {
  late T widget;
  bool _mounted = true;
  BuildContext get context => BuildContext();
  bool get mounted => _mounted;
  void setState(VoidCallback fn) {
    if (_mounted) fn();
  }

  Widget build(BuildContext context);
  void initState() {}
  void dispose() {
    _mounted = false;
  }
}

// Core Types
typedef VoidCallback = void Function();
typedef ValueChanged<T> = void Function(T value);

// Mock BuildContext
class BuildContext {
  final Map<String, dynamic> _data = {};
  T? read<T>() => _data['provider_$T'] as T?;
  T? watch<T>() => _data['provider_$T'] as T?;
  void _setProvider<T>(T value) {
    _data['provider_$T'] = value;
  }
}

// GoRouter Extension
extension BuildContextGoRouter on BuildContext {
  void go(String location) => print('[MockGoRouter] Navigating to: $location');
  void push(String location) => print('[MockGoRouter] Pushing to: $location');
  void pop() => print('[MockGoRouter] Popping route');
}

// Color System
class Color {
  final int value;
  const Color(this.value);
  const Color.fromARGB(int a, int r, int g, int b)
    : value = (a << 24) | (r << 16) | (g << 8) | b;
  Color withOpacity(double opacity) {
    return Color.fromARGB(
      (opacity * 255).round(),
      (value >> 16) & 0xFF,
      (value >> 8) & 0xFF,
      value & 0xFF,
    );
  }
}

class Colors {
  static const Color white = Color(0xFFFFFFFF);
  static const Color blue = Color(0xFF2196F3);
  static const Color grey = Color(0xFF9E9E9E);
  static const Color black = Color(0xFF000000);
}

// Icon System
class IconData {
  final int codePoint;
  const IconData(this.codePoint);
}

class Icons {
  static const IconData dashboard = IconData(0xe3ae);
  static const IconData calendar_today = IconData(0xe1ec);
  static const IconData business = IconData(0xe0af);
}

// Typography
class TextStyle {
  final Color? color;
  final double? fontSize;
  const TextStyle({this.color, this.fontSize});
}

// Basic Widgets
class Text extends Widget {
  final String data;
  final TextStyle? style;
  const Text(this.data, {super.key, this.style});
}

class Icon extends Widget {
  final IconData icon;
  final double? size;
  final Color? color;
  const Icon(this.icon, {super.key, this.size, this.color});
}

// Bottom Navigation
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

// Key system
abstract class Key {
  const Key();
}

class ClinicBottomNav extends StatelessWidget {
  final int currentIndex;

  const ClinicBottomNav({super.key, required this.currentIndex});

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: currentIndex,
      onTap: (index) => _onItemTapped(context, index),
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard),
          label: 'Dashboard',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.calendar_today),
          label: 'Appointments',
        ),
        BottomNavigationBarItem(icon: Icon(Icons.business), label: 'Profile'),
      ],
    );
  }

  void _onItemTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        if (currentIndex != 0) context.go('/clinic');
        break;
      case 1:
        if (currentIndex != 1) context.go('/clinic/appointments');
        break;
      case 2:
        if (currentIndex != 2) context.go('/clinic/profile');
        break;
    }
  }
}
