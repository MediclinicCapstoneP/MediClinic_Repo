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
  static const Color black = Color(0xFF000000);
  static const Color blue = Color(0xFF2196F3);
  static const Color transparent = Color(0x00000000);
}

// Icon System
class IconData {
  final int codePoint;
  const IconData(this.codePoint);
}

class Icons {
  static const IconData local_hospital = IconData(0xe548);
  static const IconData calendar_today = IconData(0xe1ec);
  static const IconData location_on = IconData(0xe0c8);
  static const IconData health_and_safety = IconData(0xe99e);
}

// Typography
enum FontWeight {
  w100,
  w200,
  w300,
  w400,
  w500,
  w600,
  w700,
  w800,
  w900;

  static const FontWeight normal = FontWeight.w400;
  static const FontWeight bold = FontWeight.w700;
}

enum TextAlign { left, right, center, justify, start, end }

enum TextDecoration { none, underline, overline, lineThrough }

class TextStyle {
  final Color? color;
  final double? fontSize;
  final FontWeight? fontWeight;
  final String? fontFamily;
  final TextDecoration? decoration;
  const TextStyle({
    this.color,
    this.fontSize,
    this.fontWeight,
    this.fontFamily,
    this.decoration,
  });

  TextStyle copyWith({
    Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    String? fontFamily,
    TextDecoration? decoration,
  }) {
    return TextStyle(
      color: color ?? this.color,
      fontSize: fontSize ?? this.fontSize,
      fontWeight: fontWeight ?? this.fontWeight,
      fontFamily: fontFamily ?? this.fontFamily,
      decoration: decoration ?? this.decoration,
    );
  }
}

class TextTheme {
  final TextStyle? displayMedium, titleLarge, bodyLarge, bodyMedium, labelLarge;
  const TextTheme({
    this.displayMedium,
    this.titleLarge,
    this.bodyLarge,
    this.bodyMedium,
    this.labelLarge,
  });
}

// Layout
enum MainAxisAlignment {
  start,
  end,
  center,
  spaceBetween,
  spaceAround,
  spaceEvenly,
}

enum CrossAxisAlignment { start, end, center, stretch, baseline }

enum MainAxisSize { min, max }

class EdgeInsets {
  final double left, top, right, bottom;
  const EdgeInsets.all(double value)
    : left = value,
      top = value,
      right = value,
      bottom = value;
  const EdgeInsets.only({
    this.left = 0.0,
    this.top = 0.0,
    this.right = 0.0,
    this.bottom = 0.0,
  });
  const EdgeInsets.symmetric({double vertical = 0.0, double horizontal = 0.0})
    : left = horizontal,
      top = vertical,
      right = horizontal,
      bottom = vertical;
}

class BorderRadius {
  final double topLeft, topRight, bottomLeft, bottomRight;
  const BorderRadius.all(double radius)
    : topLeft = radius,
      topRight = radius,
      bottomLeft = radius,
      bottomRight = radius;
  static BorderRadius circular(double radius) => BorderRadius.all(radius);
}

class BoxDecoration {
  final Color? color;
  final BorderRadius? borderRadius;
  final List<BoxShadow>? boxShadow;
  const BoxDecoration({this.color, this.borderRadius, this.boxShadow});
}

class BoxShadow {
  final Color color;
  final Offset offset;
  final double blurRadius;
  final double spreadRadius;
  const BoxShadow({
    this.color = Colors.black,
    this.offset = Offset.zero,
    this.blurRadius = 0.0,
    this.spreadRadius = 0.0,
  });
}

class Offset {
  final double dx, dy;
  const Offset(this.dx, this.dy);
  static const Offset zero = Offset(0.0, 0.0);
}

class RoundedRectangleBorder {
  final BorderRadius borderRadius;
  const RoundedRectangleBorder({required this.borderRadius});
}

// Theme System
class ColorScheme {
  final Color primary, onPrimary, surface, onSurface;
  const ColorScheme({
    required this.primary,
    required this.onPrimary,
    required this.surface,
    required this.onSurface,
  });

  static const ColorScheme light = ColorScheme(
    primary: Color(0xFF1976D2),
    onPrimary: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFFFF),
    onSurface: Color(0xFF000000),
  );
}

class ThemeData {
  final ColorScheme colorScheme;
  final TextTheme textTheme;
  const ThemeData({required this.colorScheme, required this.textTheme});

  static const ThemeData light = ThemeData(
    colorScheme: ColorScheme.light,
    textTheme: TextTheme(
      displayMedium: TextStyle(fontSize: 45, fontWeight: FontWeight.w400),
      titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w400),
      bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
    ),
  );
}

class Theme {
  static ThemeData of(BuildContext context) => ThemeData.light;
}

// Basic Widgets
class Text extends Widget {
  final String data;
  final TextStyle? style;
  final TextAlign? textAlign;
  const Text(this.data, {super.key, this.style, this.textAlign});
}

class Icon extends Widget {
  final IconData icon;
  final double? size;
  final Color? color;
  const Icon(this.icon, {super.key, this.size, this.color});
}

class Container extends Widget {
  final Widget? child;
  final EdgeInsets? padding;
  final BoxDecoration? decoration;
  final double? width, height;
  final Color? color;
  const Container({
    super.key,
    this.child,
    this.padding,
    this.decoration,
    this.width,
    this.height,
    this.color,
  });
}

class SizedBox extends Widget {
  final double? width, height;
  final Widget? child;
  const SizedBox({super.key, this.width, this.height, this.child});
}

class Column extends Widget {
  final List<Widget> children;
  final MainAxisAlignment mainAxisAlignment;
  final CrossAxisAlignment crossAxisAlignment;
  const Column({
    super.key,
    required this.children,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.crossAxisAlignment = CrossAxisAlignment.center,
  });
}

class Row extends Widget {
  final List<Widget> children;
  final MainAxisAlignment mainAxisAlignment;
  final CrossAxisAlignment crossAxisAlignment;
  const Row({
    super.key,
    required this.children,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.crossAxisAlignment = CrossAxisAlignment.center,
  });
}

class Expanded extends Widget {
  final Widget child;
  final int flex;
  const Expanded({super.key, required this.child, this.flex = 1});
}

class Spacer extends Widget {
  final int flex;
  const Spacer({super.key, this.flex = 1});
}

class Padding extends Widget {
  final EdgeInsets padding;
  final Widget child;
  const Padding({super.key, required this.padding, required this.child});
}

// Interactive Widgets
class GestureDetector extends Widget {
  final Widget child;
  final VoidCallback? onTap;
  const GestureDetector({super.key, required this.child, this.onTap});
}

class ElevatedButton extends Widget {
  final VoidCallback? onPressed;
  final Widget child;
  final ButtonStyle? style;
  const ElevatedButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.style,
  });

  static ButtonStyle styleFrom({
    Color? backgroundColor,
    Color? foregroundColor,
    EdgeInsets? padding,
    RoundedRectangleBorder? shape,
  }) {
    return ButtonStyle(
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      padding: padding,
      shape: shape,
    );
  }
}

class ButtonStyle {
  final Color? backgroundColor, foregroundColor;
  final EdgeInsets? padding;
  final RoundedRectangleBorder? shape;
  const ButtonStyle({
    this.backgroundColor,
    this.foregroundColor,
    this.padding,
    this.shape,
  });
}

// Material Widgets
class Scaffold extends Widget {
  final Widget? body;
  final Color? backgroundColor;
  const Scaffold({super.key, this.body, this.backgroundColor});
}

class SafeArea extends Widget {
  final Widget child;
  const SafeArea({super.key, required this.child});
}

// Key System
abstract class Key {
  const Key();
}

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.primary,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const Spacer(),

              // Logo and app name
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.local_hospital,
                  size: 60,
                  color: Color(0xFF2563EB),
                ),
              ),

              const SizedBox(height: 32),

              Text(
                'IgabayCare',
                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 16),

              Text(
                'Your healthcare companion',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white.withOpacity(0.9),
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 8),

              Text(
                'Connect with clinics, book appointments, and manage your health journey seamlessly.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.white.withOpacity(0.8),
                ),
                textAlign: TextAlign.center,
              ),

              const Spacer(),

              // Features list
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    _buildFeatureItem(
                      icon: Icons.calendar_today,
                      title: 'Easy Scheduling',
                      description:
                          'Book appointments with your preferred clinics',
                    ),
                    const SizedBox(height: 16),
                    _buildFeatureItem(
                      icon: Icons.location_on,
                      title: 'Find Nearby Clinics',
                      description: 'Discover healthcare providers in your area',
                    ),
                    const SizedBox(height: 16),
                    _buildFeatureItem(
                      icon: Icons.health_and_safety,
                      title: 'Health Records',
                      description: 'Keep track of your medical history',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Get Started Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.go('/role-selection'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Theme.of(context).colorScheme.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Get Started',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Already have account
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Already have an account? ',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withOpacity(0.8),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/role-selection'),
                    child: Text(
                      'Sign In',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: Colors.white, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
