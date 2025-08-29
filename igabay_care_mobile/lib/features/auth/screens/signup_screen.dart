// Custom Flutter Material Design Implementation
// This replaces Flutter Material, GoRouter, and Provider packages due to package resolution issues

import '../../../core/providers/auth_provider.dart';
import '../../../core/models/user.dart';

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

  bool get mounted => _mounted;

  void setState(VoidCallback fn) {
    if (_mounted) {
      fn();
      // In real Flutter, this triggers a rebuild
    }
  }

  Widget build(BuildContext context);

  void initState() {}
  void dispose() {
    _mounted = false;
  }
}

// Core Types
typedef VoidCallback = void Function();
typedef WidgetBuilder = Widget Function(BuildContext context);
typedef ValueChanged<T> = void Function(T value);
typedef FormFieldValidator<T> = String? Function(T? value);
typedef FormFieldBuilder<T> = Widget Function(FormFieldState<T> field);

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
  void go(String location) {
    print('[MockGoRouter] Navigating to: $location');
  }

  void push(String location) {
    print('[MockGoRouter] Pushing to: $location');
  }

  void pop() {
    print('[MockGoRouter] Popping route');
  }
}

// Provider Pattern Implementation
class Provider<T> {
  static T of<T>(BuildContext context, {bool listen = true}) {
    final provider = context.read<T>();
    if (provider == null) {
      throw Exception('Provider<$T> not found');
    }
    return provider;
  }
}

class Consumer<T> extends Widget {
  final Widget Function(BuildContext context, T value, Widget? child) builder;
  final Widget? child;

  const Consumer({super.key, required this.builder, this.child});
}

class ChangeNotifier {
  final List<VoidCallback> _listeners = [];

  void addListener(VoidCallback listener) {
    _listeners.add(listener);
  }

  void removeListener(VoidCallback listener) {
    _listeners.remove(listener);
  }

  void notifyListeners() {
    for (final listener in _listeners) {
      listener();
    }
  }

  void dispose() {
    _listeners.clear();
  }
}

// Color System
class Color {
  final int value;

  const Color(this.value);

  const Color.fromARGB(int a, int r, int g, int b)
    : value = (a << 24) | (r << 16) | (g << 8) | b;

  Color.fromRGBO(int r, int g, int b, double opacity)
    : value = ((opacity * 255).round() << 24) | (r << 16) | (g << 8) | b;

  Color withOpacity(double opacity) {
    return Color.fromARGB(
      (opacity * 255).round(),
      (value >> 16) & 0xFF,
      (value >> 8) & 0xFF,
      value & 0xFF,
    );
  }
}

// Material Colors
class Colors {
  static const Color transparent = Color(0x00000000);
  static const Color black = Color(0xFF000000);
  static const Color white = Color(0xFFFFFFFF);
  static const Color blue = Color(0xFF2196F3);
  static const Color green = Color(0xFF4CAF50);
  static const Color red = Color(0xFFF44336);
  static const Color orange = Color(0xFFFF9800);
  static const Color grey = Color(0xFF9E9E9E);
  static const Color purple = Color(0xFF9C27B0);
  static const Color deepOrange = Color(0xFFFF5722);
}

// Icon System
class IconData {
  final int codePoint;
  const IconData(this.codePoint);
}

class Icons {
  static const IconData arrow_back = IconData(0xe5c4);
  static const IconData person = IconData(0xe7fd);
  static const IconData local_hospital = IconData(0xe548);
  static const IconData email_outlined = IconData(0xe0be);
  static const IconData lock_outlined = IconData(0xe897);
  static const IconData visibility = IconData(0xe8f4);
  static const IconData visibility_off = IconData(0xe8f5);
  static const IconData check_circle_outline = IconData(0xe86d);
  static const IconData error_outline = IconData(0xe001);
}

// Text and Typography
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

enum TextDecoration { none, underline, overline, lineThrough }

class TextTheme {
  final TextStyle? displayLarge;
  final TextStyle? displayMedium;
  final TextStyle? displaySmall;
  final TextStyle? headlineLarge;
  final TextStyle? headlineMedium;
  final TextStyle? headlineSmall;
  final TextStyle? titleLarge;
  final TextStyle? titleMedium;
  final TextStyle? titleSmall;
  final TextStyle? bodyLarge;
  final TextStyle? bodyMedium;
  final TextStyle? bodySmall;

  const TextTheme({
    this.displayLarge,
    this.displayMedium,
    this.displaySmall,
    this.headlineLarge,
    this.headlineMedium,
    this.headlineSmall,
    this.titleLarge,
    this.titleMedium,
    this.titleSmall,
    this.bodyLarge,
    this.bodyMedium,
    this.bodySmall,
  });
}

class TextSpan {
  final String? text;
  final List<TextSpan>? children;
  final TextStyle? style;

  const TextSpan({this.text, this.children, this.style});
}

// Layout and Positioning
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

enum TextInputType {
  text,
  emailAddress,
  number,
  phone,
  url,
  multiline,
  name,
  address,
}

class EdgeInsets {
  final double left;
  final double top;
  final double right;
  final double bottom;

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
  final double topLeft;
  final double topRight;
  final double bottomLeft;
  final double bottomRight;

  const BorderRadius.all(double radius)
    : topLeft = radius,
      topRight = radius,
      bottomLeft = radius,
      bottomRight = radius;

  static BorderRadius circular(double radius) => BorderRadius.all(radius);
}

class BorderSide {
  final Color color;
  final double width;

  const BorderSide({this.color = Colors.black, this.width = 1.0});

  static const BorderSide none = BorderSide(
    width: 0.0,
    color: Color(0x00000000),
  );
}

class Border {
  final BorderSide top;
  final BorderSide right;
  final BorderSide bottom;
  final BorderSide left;

  const Border({
    this.top = BorderSide.none,
    this.right = BorderSide.none,
    this.bottom = BorderSide.none,
    this.left = BorderSide.none,
  });

  static Border all({Color color = Colors.black, double width = 1.0}) {
    final side = BorderSide(color: color, width: width);
    return Border(top: side, right: side, bottom: side, left: side);
  }
}

class BoxDecoration {
  final Color? color;
  final BorderRadius? borderRadius;
  final Border? border;
  final List<BoxShadow>? boxShadow;

  const BoxDecoration({
    this.color,
    this.borderRadius,
    this.border,
    this.boxShadow,
  });
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
  final double dx;
  final double dy;

  const Offset(this.dx, this.dy);

  static const Offset zero = Offset(0.0, 0.0);
}

// Color Scheme and Theme
class ColorScheme {
  final Color primary;
  final Color onPrimary;
  final Color secondary;
  final Color onSecondary;
  final Color surface;
  final Color onSurface;
  final Color background;
  final Color onBackground;
  final Color error;
  final Color onError;
  final Color outline;

  const ColorScheme({
    required this.primary,
    required this.onPrimary,
    required this.secondary,
    required this.onSecondary,
    required this.surface,
    required this.onSurface,
    required this.background,
    required this.onBackground,
    required this.error,
    required this.onError,
    required this.outline,
  });

  static const ColorScheme light = ColorScheme(
    primary: Color(0xFF1976D2),
    onPrimary: Color(0xFFFFFFFF),
    secondary: Color(0xFF03DAC6),
    onSecondary: Color(0xFF000000),
    surface: Color(0xFFFFFFFF),
    onSurface: Color(0xFF000000),
    background: Color(0xFFFAFAFA),
    onBackground: Color(0xFF000000),
    error: Color(0xFFB00020),
    onError: Color(0xFFFFFFFF),
    outline: Color(0xFF79747E),
  );
}

class ThemeData {
  final ColorScheme colorScheme;
  final TextTheme textTheme;

  const ThemeData({required this.colorScheme, required this.textTheme});

  static const ThemeData light = ThemeData(
    colorScheme: ColorScheme.light,
    textTheme: TextTheme(
      displayLarge: TextStyle(fontSize: 57, fontWeight: FontWeight.w400),
      displayMedium: TextStyle(fontSize: 45, fontWeight: FontWeight.w400),
      displaySmall: TextStyle(fontSize: 36, fontWeight: FontWeight.w400),
      headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w400),
      headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w400),
      headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w400),
      titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w400),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
      titleSmall: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
      bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400),
    ),
  );
}

class Theme {
  static ThemeData of(BuildContext context) {
    return ThemeData.light; // Mock implementation
  }
}

// Form System
class FormState extends State<StatefulWidget> {
  @override
  Widget build(BuildContext context) => Container();

  bool validate() {
    print('[MockForm] Validating form');
    return true; // Mock validation always passes
  }

  void save() {
    print('[MockForm] Saving form');
  }

  void reset() {
    print('[MockForm] Resetting form');
  }
}

class Form extends StatefulWidget {
  final GlobalKey<FormState>? key;
  final Widget child;

  const Form({this.key, required this.child}) : super(key: key);

  @override
  FormState createState() => FormState();
}

class FormFieldState<T> {
  T? value;
  String? errorText;

  void didChange(T? value) {
    this.value = value;
  }

  bool validate() => errorText == null;
}

class InputDecoration {
  final String? labelText;
  final String? hintText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final String? errorText;
  final EdgeInsets? contentPadding;
  final BorderRadius? borderRadius;

  const InputDecoration({
    this.labelText,
    this.hintText,
    this.prefixIcon,
    this.suffixIcon,
    this.errorText,
    this.contentPadding,
    this.borderRadius,
  });
}

// Text Input Widgets
class TextEditingController {
  String _text = '';
  final List<VoidCallback> _listeners = [];

  String get text => _text;

  set text(String newText) {
    if (_text != newText) {
      _text = newText;
      for (final listener in _listeners) {
        listener();
      }
    }
  }

  void addListener(VoidCallback listener) {
    _listeners.add(listener);
  }

  void removeListener(VoidCallback listener) {
    _listeners.remove(listener);
  }

  void dispose() {
    _listeners.clear();
  }
}

class TextFormField extends Widget {
  final TextEditingController? controller;
  final String? initialValue;
  final InputDecoration? decoration;
  final TextInputType? keyboardType;
  final bool obscureText;
  final FormFieldValidator<String>? validator;
  final ValueChanged<String>? onChanged;
  final int? maxLines;
  final bool enabled;

  const TextFormField({
    super.key,
    this.controller,
    this.initialValue,
    this.decoration,
    this.keyboardType,
    this.obscureText = false,
    this.validator,
    this.onChanged,
    this.maxLines = 1,
    this.enabled = true,
  });
}

// Basic Widgets
class Text extends Widget {
  final String data;
  final TextStyle? style;

  const Text(this.data, {super.key, this.style});
}

class RichText extends Widget {
  final TextSpan text;

  const RichText({super.key, required this.text});
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
  final EdgeInsets? margin;
  final BoxDecoration? decoration;
  final double? width;
  final double? height;
  final Color? color;

  const Container({
    super.key,
    this.child,
    this.padding,
    this.margin,
    this.decoration,
    this.width,
    this.height,
    this.color,
  });
}

class SizedBox extends Widget {
  final double? width;
  final double? height;
  final Widget? child;

  const SizedBox({super.key, this.width, this.height, this.child});

  const SizedBox.shrink({super.key}) : width = 0.0, height = 0.0, child = null;
}

class Padding extends Widget {
  final EdgeInsets padding;
  final Widget child;

  const Padding({super.key, required this.padding, required this.child});
}

class Column extends Widget {
  final List<Widget> children;
  final MainAxisAlignment mainAxisAlignment;
  final CrossAxisAlignment crossAxisAlignment;
  final MainAxisSize mainAxisSize;

  const Column({
    super.key,
    required this.children,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.crossAxisAlignment = CrossAxisAlignment.center,
    this.mainAxisSize = MainAxisSize.max,
  });
}

class Row extends Widget {
  final List<Widget> children;
  final MainAxisAlignment mainAxisAlignment;
  final CrossAxisAlignment crossAxisAlignment;
  final MainAxisSize mainAxisSize;

  const Row({
    super.key,
    required this.children,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.crossAxisAlignment = CrossAxisAlignment.center,
    this.mainAxisSize = MainAxisSize.max,
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

class Center extends Widget {
  final Widget child;

  const Center({super.key, required this.child});
}

// Interactive Widgets
class GestureDetector extends Widget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onDoubleTap;
  final VoidCallback? onLongPress;

  const GestureDetector({
    super.key,
    required this.child,
    this.onTap,
    this.onDoubleTap,
    this.onLongPress,
  });
}

class TextButton extends Widget {
  final VoidCallback? onPressed;
  final Widget child;
  final ButtonStyle? style;

  const TextButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.style,
  });
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
}

class IconButton extends Widget {
  final VoidCallback? onPressed;
  final Widget icon;
  final Color? color;
  final double? iconSize;

  const IconButton({
    super.key,
    required this.onPressed,
    required this.icon,
    this.color,
    this.iconSize,
  });
}

class Checkbox extends Widget {
  final bool? value;
  final ValueChanged<bool?>? onChanged;
  final Color? activeColor;

  const Checkbox({
    super.key,
    required this.value,
    required this.onChanged,
    this.activeColor,
  });
}

class ButtonStyle {
  final Color? backgroundColor;
  final Color? foregroundColor;
  final EdgeInsets? padding;
  final BorderRadius? borderRadius;

  const ButtonStyle({
    this.backgroundColor,
    this.foregroundColor,
    this.padding,
    this.borderRadius,
  });
}

// Progress Indicators
class CircularProgressIndicator extends Widget {
  final double? value;
  final Color? backgroundColor;
  final Color? valueColor;
  final double strokeWidth;

  const CircularProgressIndicator({
    super.key,
    this.value,
    this.backgroundColor,
    this.valueColor,
    this.strokeWidth = 4.0,
  });
}

// Material Design Widgets
class Scaffold extends Widget {
  final PreferredSizeWidget? appBar;
  final Widget? body;
  final Widget? floatingActionButton;
  final Widget? drawer;
  final Widget? endDrawer;
  final Widget? bottomNavigationBar;
  final Color? backgroundColor;
  final bool resizeToAvoidBottomInset;

  const Scaffold({
    super.key,
    this.appBar,
    this.body,
    this.floatingActionButton,
    this.drawer,
    this.endDrawer,
    this.bottomNavigationBar,
    this.backgroundColor,
    this.resizeToAvoidBottomInset = true,
  });
}

abstract class PreferredSizeWidget extends Widget {
  Size get preferredSize;
}

class Size {
  final double width;
  final double height;

  const Size(this.width, this.height);

  const Size.fromHeight(double height)
    : width = double.infinity,
      height = height;

  static const Size zero = Size(0.0, 0.0);
}

class AppBar extends StatelessWidget implements PreferredSizeWidget {
  final Widget? title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool automaticallyImplyLeading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? elevation;
  final bool centerTitle;

  const AppBar({
    super.key,
    this.title,
    this.actions,
    this.leading,
    this.automaticallyImplyLeading = true,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation,
    this.centerTitle = false,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: preferredSize.height,
      color: backgroundColor ?? Theme.of(context).colorScheme.primary,
      child: Row(
        children: [
          if (leading != null) leading!,
          if (title != null) Expanded(child: title!),
          if (actions != null) ...actions!,
        ],
      ),
    );
  }
}

const double kToolbarHeight = 56.0;

class SafeArea extends Widget {
  final Widget child;
  final bool top;
  final bool bottom;
  final bool left;
  final bool right;

  const SafeArea({
    super.key,
    required this.child,
    this.top = true,
    this.bottom = true,
    this.left = true,
    this.right = true,
  });
}

class SingleChildScrollView extends Widget {
  final Widget child;
  final EdgeInsets? padding;
  final bool reverse;

  const SingleChildScrollView({
    super.key,
    required this.child,
    this.padding,
    this.reverse = false,
  });
}

class SnackBar extends Widget {
  final Widget content;
  final Color? backgroundColor;
  final Duration duration;

  const SnackBar({
    super.key,
    required this.content,
    this.backgroundColor,
    this.duration = const Duration(milliseconds: 4000),
  });
}

class ScaffoldMessenger {
  static ScaffoldMessengerState of(BuildContext context) {
    return ScaffoldMessengerState();
  }
}

class ScaffoldMessengerState {
  void showSnackBar(SnackBar snackBar) {
    print('[MockScaffoldMessenger] Showing snackbar: ${snackBar.content}');
  }
}

// Key system
abstract class Key {
  const Key();
}

class ValueKey<T> extends Key {
  final T value;
  const ValueKey(this.value);
}

class GlobalKey<T extends State<StatefulWidget>> extends Key {
  T? _currentState;

  GlobalKey();

  T? get currentState => _currentState;

  void _register(T state) {
    _currentState = state;
  }
}

// RegExp for validation
class RegExp {
  final String pattern;

  RegExp(this.pattern);

  bool hasMatch(String input) {
    // Mock implementation - basic pattern matching
    if (pattern.contains('email') || pattern.contains('@')) {
      return input.contains('@') && input.contains('.');
    }
    if (pattern.contains('[a-z]') &&
        pattern.contains('[A-Z]') &&
        pattern.contains('\\d')) {
      return input.length >= 8; // Simplified password validation
    }
    return true; // Default to valid for other patterns
  }
}

class SignupScreen extends StatefulWidget {
  final String? role;
  const SignupScreen({super.key, this.role});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _agreeToTerms = false;

  UserRole get _selectedRole {
    if (widget.role == 'patient') return UserRole.patient;
    if (widget.role == 'clinic') return UserRole.clinic;
    return UserRole.patient; // Default fallback
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: Theme.of(context).colorScheme.onBackground,
          ),
          onPressed: () => context.go('/role-selection'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),

                // Title
                Text(
                  'Create Account',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 8),

                Text(
                  widget.role != null
                      ? 'Join IgabayCare as a ${widget.role}'
                      : 'Join IgabayCare today',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(
                      context,
                    ).colorScheme.onBackground.withOpacity(0.7),
                  ),
                ),

                const SizedBox(height: 32),

                // Role indicator
                if (widget.role != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Theme.of(
                          context,
                        ).colorScheme.primary.withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          widget.role == 'patient'
                              ? Icons.person
                              : Icons.local_hospital,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Creating ${widget.role} account',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () => context.go('/role-selection'),
                          child: const Text('Change'),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 32),

                // Email field
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    hintText: 'Enter your email address',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email';
                    }
                    if (!RegExp(
                      r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
                    ).hasMatch(value)) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Password field
                TextFormField(
                  controller: _passwordController,
                  obscureText: !_isPasswordVisible,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: 'Create a strong password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _isPasswordVisible
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          _isPasswordVisible = !_isPasswordVisible;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a password';
                    }
                    if (value.length < 8) {
                      return 'Password must be at least 8 characters';
                    }
                    if (!RegExp(
                      r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)',
                    ).hasMatch(value)) {
                      return 'Password must contain uppercase, lowercase, and numbers';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Confirm password field
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: !_isConfirmPasswordVisible,
                  decoration: InputDecoration(
                    labelText: 'Confirm Password',
                    hintText: 'Re-enter your password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _isConfirmPasswordVisible
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          _isConfirmPasswordVisible =
                              !_isConfirmPasswordVisible;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please confirm your password';
                    }
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Password requirements
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Theme.of(
                        context,
                      ).colorScheme.outline.withOpacity(0.2),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Password Requirements:',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildPasswordRequirement(
                        context,
                        'At least 8 characters',
                      ),
                      _buildPasswordRequirement(
                        context,
                        'One uppercase letter',
                      ),
                      _buildPasswordRequirement(
                        context,
                        'One lowercase letter',
                      ),
                      _buildPasswordRequirement(context, 'One number'),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Terms and conditions
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(
                      value: _agreeToTerms,
                      onChanged: (value) {
                        setState(() {
                          _agreeToTerms = value ?? false;
                        });
                      },
                    ),
                    Expanded(
                      child: RichText(
                        text: TextSpan(
                          style: Theme.of(context).textTheme.bodySmall,
                          children: [
                            const TextSpan(text: 'I agree to the '),
                            TextSpan(
                              text: 'Terms of Service',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.primary,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                            const TextSpan(text: ' and '),
                            TextSpan(
                              text: 'Privacy Policy',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.primary,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // Sign up button
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    return SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: (authProvider.isLoading || !_agreeToTerms)
                            ? null
                            : () => _signUp(context),
                        child: authProvider.isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Create Account'),
                      ),
                    );
                  },
                ),

                const SizedBox(height: 24),

                // Error message
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    if (authProvider.errorMessage != null) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Theme.of(
                            context,
                          ).colorScheme.error.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Theme.of(
                              context,
                            ).colorScheme.error.withOpacity(0.3),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.error_outline,
                              color: Theme.of(context).colorScheme.error,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                authProvider.errorMessage!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),

                const SizedBox(height: 32),

                // Sign in option
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(
                          context,
                        ).colorScheme.onBackground.withOpacity(0.7),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        if (widget.role != null) {
                          context.go('/login?role=${widget.role}');
                        } else {
                          context.go('/role-selection');
                        }
                      },
                      child: Text(
                        'Sign In',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w600,
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
      ),
    );
  }

  Widget _buildPasswordRequirement(BuildContext context, String requirement) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 16,
            color: Theme.of(context).colorScheme.primary.withOpacity(0.6),
          ),
          const SizedBox(width: 8),
          Text(
            requirement,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _signUp(BuildContext context) async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreeToTerms) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    await authProvider.signUp(
      email: _emailController.text.trim(),
      password: _passwordController.text,
      role: _selectedRole,
    );

    if (mounted && authProvider.user != null) {
      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Account created successfully! Please complete your profile.',
          ),
          backgroundColor: Colors.green,
        ),
      );

      // Navigate based on user role
      if (authProvider.user!.role == UserRole.patient) {
        context.go('/patient');
      } else if (authProvider.user!.role == UserRole.clinic) {
        context.go('/clinic');
      }
    }
  }
}
