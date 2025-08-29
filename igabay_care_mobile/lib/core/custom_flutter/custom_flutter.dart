// Custom Flutter Material Design Implementation
// This provides a unified implementation to replace Flutter packages due to package resolution issues
// Import this file instead of Flutter packages to avoid duplicate class definitions

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
typedef AsyncCallback = Future<void> Function();
typedef FormFieldValidator<T> = String? Function(T? value);
typedef IndexedWidgetBuilder = Widget Function(BuildContext context, int index);

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

// Provider Pattern Implementation
class Provider<T> {
  static T of<T>(BuildContext context, {bool listen = true}) {
    final provider = context.read<T>();
    if (provider == null) throw Exception('Provider<$T> not found');
    return provider;
  }
}

class MultiProvider extends Widget {
  final List<dynamic> providers;
  final Widget child;
  const MultiProvider({
    super.key,
    required this.providers,
    required this.child,
  });
}

class ChangeNotifierProvider<T> {
  final T Function(BuildContext) create;
  const ChangeNotifierProvider({required this.create});
}

class Consumer<T> extends Widget {
  final Widget Function(BuildContext context, T value, Widget? child) builder;
  final Widget? child;
  const Consumer({super.key, required this.builder, this.child});
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
  static const Color green = Color(0xFF4CAF50);
  static const Color red = Color(0xFFF44336);
  static const Color blue = Color(0xFF2196F3);
  static const Color orange = Color(0xFFFF9800);
  static const Color purple = Color(0xFF9C27B0);
  static const Color grey = Color(0xFF9E9E9E);
  static const Color amber = Color(0xFFFFC107);
  static const Color transparent = Color(0x00000000);
}

// Icon System
class IconData {
  final int codePoint;
  const IconData(this.codePoint);
}

class Icons {
  static const IconData arrow_back = IconData(0xe5c4);
  static const IconData calendar_today = IconData(0xe1ec);
  static const IconData arrow_forward_ios = IconData(0xe5e1);
  static const IconData schedule = IconData(0xe8b5);
  static const IconData medical_services = IconData(0xea76);
  static const IconData note_alt = IconData(0xea70);
  static const IconData search = IconData(0xe8b6);
  static const IconData local_hospital = IconData(0xe548);
  static const IconData home = IconData(0xe88a);
  static const IconData person = IconData(0xe7fd);
  static const IconData today = IconData(0xe8df);
  static const IconData calendar_month = IconData(0xe1d0);
  static const IconData check_circle = IconData(0xe86c);
  static const IconData cancel = IconData(0xe5c9);
  static const IconData calendar_today_outlined = IconData(0xe1ec);
  static const IconData check = IconData(0xe5ca);
  static const IconData check_circle_outline = IconData(0xe86d);
  static const IconData notifications_outlined = IconData(0xe7f4);
  static const IconData edit = IconData(0xe3c9);
  static const IconData add = IconData(0xe145);
  static const IconData history = IconData(0xe889);
  static const IconData location_on = IconData(0xe0c8);
  static const IconData health_and_safety = IconData(0xe99e);
  static const IconData camera_alt = IconData(0xe3b3);
  static const IconData cake = IconData(0xe7e9);
  static const IconData phone = IconData(0xe0cd);
  static const IconData emergency = IconData(0xe1eb);
  static const IconData bloodtype = IconData(0xe7e6);
  static const IconData warning = IconData(0xe002);
  static const IconData medication = IconData(0xea70);
  static const IconData logout = IconData(0xe9ba);
  static const IconData lightbulb_outline = IconData(0xe90f);
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
  final TextStyle? displayMedium,
      titleLarge,
      titleMedium,
      headlineSmall,
      bodyLarge,
      bodyMedium,
      bodySmall,
      labelLarge;
  const TextTheme({
    this.displayMedium,
    this.titleLarge,
    this.titleMedium,
    this.headlineSmall,
    this.bodyLarge,
    this.bodyMedium,
    this.bodySmall,
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

class BorderSide {
  final Color color;
  final double width;
  const BorderSide({this.color = Colors.black, this.width = 1.0});
}

class Border {
  final BorderSide top, right, bottom, left;
  const Border({
    this.top = const BorderSide(),
    this.right = const BorderSide(),
    this.bottom = const BorderSide(),
    this.left = const BorderSide(),
  });
  static Border all({Color color = Colors.black, double width = 1.0}) {
    final side = BorderSide(color: color, width: width);
    return Border(top: side, right: side, bottom: side, left: side);
  }
}

enum BoxShape { rectangle, circle }

class BoxDecoration {
  final Color? color;
  final BorderRadius? borderRadius;
  final Border? border;
  final List<BoxShadow>? boxShadow;
  final BoxShape shape;
  final Gradient? gradient;
  const BoxDecoration({
    this.color,
    this.borderRadius,
    this.border,
    this.boxShadow,
    this.shape = BoxShape.rectangle,
    this.gradient,
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
  final double dx, dy;
  const Offset(this.dx, this.dy);
  static const Offset zero = Offset(0.0, 0.0);
}

// Theme System
class ColorScheme {
  final Color primary,
      onPrimary,
      surface,
      onSurface,
      outline,
      error,
      errorContainer,
      background,
      secondary;
  const ColorScheme({
    required this.primary,
    required this.onPrimary,
    required this.surface,
    required this.onSurface,
    required this.outline,
    required this.error,
    required this.errorContainer,
    required this.background,
    required this.secondary,
  });

  static const ColorScheme light = ColorScheme(
    primary: Color(0xFF1976D2),
    onPrimary: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFFFF),
    onSurface: Color(0xFF000000),
    outline: Color(0xFF79747E),
    error: Color(0xFFB00020),
    errorContainer: Color(0xFFFFDAD6),
    background: Color(0xFFFAFAFA),
    secondary: Color(0xFF03DAC6),
  );
}

enum ThemeMode { system, light, dark }

class ThemeData {
  final ColorScheme colorScheme;
  final TextTheme textTheme;
  const ThemeData({required this.colorScheme, required this.textTheme});

  static const ThemeData light = ThemeData(
    colorScheme: ColorScheme.light,
    textTheme: TextTheme(
      displayMedium: TextStyle(fontSize: 45, fontWeight: FontWeight.w400),
      titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w400),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
      headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w400),
      bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
    ),
  );
}

class Theme {
  static ThemeData of(BuildContext context) => ThemeData.light;
}

// Material App
class MaterialApp extends Widget {
  final String? title;
  final ThemeData? theme, darkTheme;
  final ThemeMode? themeMode;
  final bool debugShowCheckedModeBanner;
  final Widget? home;
  const MaterialApp({
    super.key,
    this.title,
    this.theme,
    this.darkTheme,
    this.themeMode,
    this.debugShowCheckedModeBanner = true,
    this.home,
  });

  const MaterialApp.router({
    super.key,
    this.title,
    this.theme,
    this.darkTheme,
    this.themeMode,
    required GoRouter routerConfig,
    this.debugShowCheckedModeBanner = true,
  }) : home = null;
}

class GoRouter {
  const GoRouter();
}

// Form System
class GlobalKey<T> extends Key {
  final String? debugLabel;
  const GlobalKey({this.debugLabel});
  
  T? get currentState => null;
}

class FormState extends State<StatefulWidget> {
  Widget build(BuildContext context) => Container();
  bool validate() {
    print('[MockForm] Validating form');
    return true;
  }

  void save() {
    print('[MockForm] Saving form');
  }
}

class Form extends StatefulWidget {
  final GlobalKey<FormState>? key;
  final Widget child;
  const Form({this.key, required this.child}) : super(key: key);
  FormState createState() => FormState();
}

class InputDecoration {
  final String? labelText, hintText, errorText;
  final Widget? prefixIcon, suffixIcon;
  final EdgeInsets? contentPadding;
  final InputBorder? border, enabledBorder, focusedBorder, errorBorder;
  const InputDecoration({
    this.labelText,
    this.hintText,
    this.errorText,
    this.prefixIcon,
    this.suffixIcon,
    this.contentPadding,
    this.border,
    this.enabledBorder,
    this.focusedBorder,
    this.errorBorder,
  });
}

class InputBorder {
  const InputBorder();
}

class OutlineInputBorder extends InputBorder {
  final BorderRadius? borderRadius;
  final BorderSide borderSide;
  const OutlineInputBorder({
    this.borderRadius,
    this.borderSide = const BorderSide(),
  });
}

class TextEditingController {
  String _text = '';
  String get text => _text;
  set text(String newText) => _text = newText;
  void dispose() {}
}

class TextFormField extends Widget {
  final TextEditingController? controller;
  final InputDecoration? decoration;
  final int? maxLines;
  final FormFieldValidator<String>? validator;
  final bool readOnly;
  final VoidCallback? onTap;
  final TextInputType? keyboardType;
  final bool enabled;
  
  const TextFormField({
    super.key,
    this.controller,
    this.decoration,
    this.maxLines = 1,
    this.validator,
    this.readOnly = false,
    this.onTap,
    this.keyboardType,
    this.enabled = true,
  });
}

class DropdownMenuItem<T> {
  final T? value;
  final Widget child;
  const DropdownMenuItem({this.value, required this.child});
}

class DropdownButtonFormField<T> extends Widget {
  final T? value;
  final InputDecoration? decoration;
  final List<DropdownMenuItem<T>>? items;
  final ValueChanged<T?>? onChanged;
  final bool enabled;
  const DropdownButtonFormField({
    super.key,
    this.value,
    this.decoration,
    this.items,
    this.onChanged,
    this.enabled = true,
  });
}

// Date/Time Pickers
Future<DateTime?> showDatePicker({
  required BuildContext context,
  required DateTime initialDate,
  required DateTime firstDate,
  required DateTime lastDate,
  String? helpText,
}) async {
  print('[MockDatePicker] Showing date picker');
  return DateTime.now();
}

Future<TimeOfDay?> showTimePicker({
  required BuildContext context,
  required TimeOfDay initialTime,
}) async {
  print('[MockTimePicker] Showing time picker');
  return const TimeOfDay(hour: 9, minute: 0);
}

class TimeOfDay {
  final int hour;
  final int minute;
  const TimeOfDay({required this.hour, required this.minute});

  String format(BuildContext context) {
    final period = hour < 12 ? 'AM' : 'PM';
    final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    final displayMinute = minute.toString().padLeft(2, '0');
    return '$displayHour:$displayMinute $period';
  }
}

// Basic Widgets
class Text extends Widget {
  final String data;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  const Text(
    this.data, {
    super.key,
    this.style,
    this.textAlign,
    this.maxLines,
  });
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
  final double? width, height;
  final Color? color;
  final AlignmentGeometry? alignment;
  const Container({
    super.key,
    this.child,
    this.padding,
    this.margin,
    this.decoration,
    this.width,
    this.height,
    this.color,
    this.alignment,
  });
}

class SizedBox extends Widget {
  final double? width, height;
  final Widget? child;
  const SizedBox({super.key, this.width, this.height, this.child});
  const SizedBox.shrink({super.key}) : width = 0.0, height = 0.0, child = null;
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
  final int flex;
  final Widget child;
  const Expanded({super.key, this.flex = 1, required this.child});
}

class Flexible extends Widget {
  final int flex;
  final Widget child;
  const Flexible({super.key, this.flex = 1, required this.child});
}

class Padding extends Widget {
  final EdgeInsets padding;
  final Widget child;
  const Padding({super.key, required this.padding, required this.child});
}

class Center extends Widget {
  final Widget child;
  const Center({super.key, required this.child});
}

class Align extends Widget {
  final AlignmentGeometry alignment;
  final Widget child;
  const Align({super.key, required this.alignment, required this.child});
}

// Alignment
abstract class AlignmentGeometry {
  const AlignmentGeometry();
}

class Alignment extends AlignmentGeometry {
  final double x, y;
  const Alignment(this.x, this.y);
  
  static const Alignment topLeft = Alignment(-1.0, -1.0);
  static const Alignment topCenter = Alignment(0.0, -1.0);
  static const Alignment topRight = Alignment(1.0, -1.0);
  static const Alignment centerLeft = Alignment(-1.0, 0.0);
  static const Alignment center = Alignment(0.0, 0.0);
  static const Alignment centerRight = Alignment(1.0, 0.0);
  static const Alignment bottomLeft = Alignment(-1.0, 1.0);
  static const Alignment bottomCenter = Alignment(0.0, 1.0);
  static const Alignment bottomRight = Alignment(1.0, 1.0);
}

// Scroll Widgets
abstract class ScrollPhysics {
  const ScrollPhysics();
}

class NeverScrollableScrollPhysics extends ScrollPhysics {
  const NeverScrollableScrollPhysics();
}

class BouncingScrollPhysics extends ScrollPhysics {
  const BouncingScrollPhysics();
}

class SingleChildScrollView extends Widget {
  final Widget child;
  final EdgeInsets? padding;
  final ScrollPhysics? physics;
  const SingleChildScrollView({
    super.key,
    required this.child,
    this.padding,
    this.physics,
  });
}

// Supabase Implementation
class Supabase {
  static Future<void> initialize({
    required String url,
    required String anonKey,
  }) async {
    print('[MockSupabase] Initializing with URL: $url');
  }
}

// Flutter Binding
class WidgetsFlutterBinding {
  static void ensureInitialized() {
    print('[MockFlutter] Widgets binding initialized');
  }
}

// Key System
abstract class Key {
  const Key();
}

// Run App Function
void runApp(Widget app) {
  print('[MockFlutter] Running app: ${app.runtimeType}');
}

// Export all classes and functions that apps might need
// This ensures a clean API surface

// Scaffold and App Bar
class Scaffold extends Widget {
  final Widget? appBar;
  final Widget? body;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final Color? backgroundColor;
  const Scaffold({
    super.key,
    this.appBar,
    this.body,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.backgroundColor,
  });
}

abstract class PreferredSizeWidget extends Widget {
  const PreferredSizeWidget({super.key});
  Size get preferredSize;
}

class Size {
  final double width, height;
  const Size(this.width, this.height);
  static const Size fromHeight(double height) = _SizeFromHeight;
}

class _SizeFromHeight extends Size {
  const _SizeFromHeight._(double height) : super(double.infinity, height);
  const _SizeFromHeight(double height) : this._(height);
}

class AppBar extends StatelessWidget implements PreferredSizeWidget {
  final Widget? title;
  final Widget? leading;
  final List<Widget>? actions;
  final PreferredSizeWidget? bottom;
  final double? elevation;
  final Color? backgroundColor;
  final bool automaticallyImplyLeading;
  
  const AppBar({
    super.key,
    this.title,
    this.leading,
    this.actions,
    this.bottom,
    this.elevation,
    this.backgroundColor,
    this.automaticallyImplyLeading = true,
  });

  @override
  Size get preferredSize => const Size.fromHeight(56.0);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56.0,
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

class SafeArea extends Widget {
  final Widget child;
  final bool top, bottom, left, right;
  const SafeArea({
    super.key,
    required this.child,
    this.top = true,
    this.bottom = true,
    this.left = true,
    this.right = true,
  });
}

// Buttons
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
    Size? minimumSize,
    BorderSide? side,
  }) {
    return ButtonStyle(
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      padding: padding,
      minimumSize: minimumSize,
      side: side,
    );
  }
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

class IconButton extends Widget {
  final VoidCallback? onPressed;
  final Widget icon;
  final double? iconSize;
  final Color? color;
  const IconButton({
    super.key,
    required this.onPressed,
    required this.icon,
    this.iconSize,
    this.color,
  });
}

class FloatingActionButton extends Widget {
  final VoidCallback? onPressed;
  final Widget? child;
  final Color? backgroundColor;
  const FloatingActionButton({
    super.key,
    required this.onPressed,
    this.child,
    this.backgroundColor,
  });

  const FloatingActionButton.extended({
    super.key,
    required this.onPressed,
    required Widget icon,
    required Widget label,
    this.backgroundColor,
  }) : child = null;
}

class ButtonStyle {
  final Color? backgroundColor;
  final Color? foregroundColor;
  final EdgeInsets? padding;
  final Size? minimumSize;
  final BorderSide? side;
  
  const ButtonStyle({
    this.backgroundColor,
    this.foregroundColor,
    this.padding,
    this.minimumSize,
    this.side,
  });
}

// Progress Indicators
class CircularProgressIndicator extends Widget {
  final double? strokeWidth;
  final Color? color;
  const CircularProgressIndicator({
    super.key,
    this.strokeWidth = 4.0,
    this.color,
  });
}

// Tabs
mixin SingleTickerProviderStateMixin<T extends StatefulWidget> on State<T>
    implements TickerProvider {
  Ticker? _ticker;
  
  @override
  Ticker createTicker(TickerCallback onTick) {
    _ticker = Ticker(onTick);
    return _ticker!;
  }
  
  @override
  void dispose() {
    _ticker?.dispose();
    super.dispose();
  }
}

abstract class TickerProvider {
  Ticker createTicker(TickerCallback onTick);
}

typedef TickerCallback = void Function(Duration elapsed);

class Ticker {
  final TickerCallback _onTick;
  Ticker(this._onTick);
  void dispose() {}
}

class TabController {
  final int length;
  final TickerProvider vsync;
  int _index = 0;
  
  TabController({required this.length, required this.vsync});
  
  int get index => _index;
  set index(int value) => _index = value;
  
  void dispose() {}
}

class TabBar extends StatelessWidget implements PreferredSizeWidget {
  final TabController? controller;
  final List<Widget> tabs;
  const TabBar({
    super.key,
    this.controller,
    required this.tabs,
  });

  @override
  Size get preferredSize => const Size.fromHeight(48.0);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48.0,
      child: Row(
        children: tabs,
      ),
    );
  }
}

class Tab extends Widget {
  final Widget? child;
  final String? text;
  final Widget? icon;
  const Tab({super.key, this.child, this.text, this.icon});
}

class TabBarView extends Widget {
  final TabController? controller;
  final List<Widget> children;
  const TabBarView({
    super.key,
    this.controller,
    required this.children,
  });
}

// Sliver Widgets
class CustomScrollView extends Widget {
  final List<Widget> slivers;
  const CustomScrollView({
    super.key,
    required this.slivers,
  });
}

class SliverAppBar extends Widget {
  final Widget? title;
  final List<Widget>? actions;
  final bool floating;
  final Color? backgroundColor;
  final double? elevation;
  const SliverAppBar({
    super.key,
    this.title,
    this.actions,
    this.floating = false,
    this.backgroundColor,
    this.elevation,
  });
}

class SliverPadding extends Widget {
  final EdgeInsets padding;
  final Widget sliver;
  const SliverPadding({
    super.key,
    required this.padding,
    required this.sliver,
  });
}

class SliverList extends Widget {
  final SliverChildDelegate delegate;
  const SliverList({
    super.key,
    required this.delegate,
  });
}

class SliverChildListDelegate extends SliverChildDelegate {
  final List<Widget> children;
  const SliverChildListDelegate(this.children);
}

abstract class SliverChildDelegate {
  const SliverChildDelegate();
}

// Refresh Indicator
class RefreshIndicator extends Widget {
  final Widget child;
  final AsyncCallback onRefresh;
  const RefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
  });
}

// Snack Bar
class SnackBar extends Widget {
  final Widget content;
  final Color? backgroundColor;
  final Duration? duration;
  const SnackBar({
    super.key,
    required this.content,
    this.backgroundColor,
    this.duration,
  });
}

class ScaffoldMessenger {
  static ScaffoldMessengerState of(BuildContext context) {
    return ScaffoldMessengerState();
  }
}

class ScaffoldMessengerState {
  void showSnackBar(SnackBar snackBar) {
    print('[MockSnackBar] ${snackBar.content}');
  }
}

// Additional Material Widgets
class Card extends Widget {
  final Widget child;
  final EdgeInsets? margin;
  final Color? color;
  final double? elevation;
  final ShapeBorder? shape;
  const Card({
    super.key,
    required this.child,
    this.margin,
    this.color,
    this.elevation,
    this.shape,
  });
}

class RoundedRectangleBorder extends ShapeBorder {
  final BorderRadius borderRadius;
  const RoundedRectangleBorder({required this.borderRadius});
}

abstract class ShapeBorder {
  const ShapeBorder();
}

class InkWell extends Widget {
  final Widget child;
  final VoidCallback? onTap;
  final BorderRadius? borderRadius;
  const InkWell({
    super.key,
    required this.child,
    this.onTap,
    this.borderRadius,
  });
}

class GestureDetector extends Widget {
  final Widget child;
  final VoidCallback? onTap;
  const GestureDetector({
    super.key,
    required this.child,
    this.onTap,
  });
}

class ListView extends Widget {
  final List<Widget> children;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final EdgeInsets? padding;
  final IndexedWidgetBuilder? itemBuilder;
  final int? itemCount;

  const ListView({
    super.key,
    required this.children,
    this.shrinkWrap = false,
    this.physics,
    this.padding,
  }) : itemBuilder = null, itemCount = null;

  const ListView.builder({
    super.key,
    this.shrinkWrap = false,
    this.physics,
    this.padding,
    required this.itemBuilder,
    required this.itemCount,
  }) : children = const [];
}

// Stack and Positioned widgets
class Stack extends Widget {
  final List<Widget> children;
  final AlignmentGeometry alignment;
  const Stack({
    super.key,
    required this.children,
    this.alignment = Alignment.topLeft,
  });
}

class Positioned extends Widget {
  final Widget child;
  final double? top, right, bottom, left;
  const Positioned({
    super.key,
    required this.child,
    this.top,
    this.right,
    this.bottom,
    this.left,
  });
}

// Input decoration components
class InputDecorator extends Widget {
  final InputDecoration decoration;
  final Widget? child;
  const InputDecorator({
    super.key,
    required this.decoration,
    this.child,
  });
}

// Text input types
enum TextInputType {
  text,
  number,
  phone,
  email,
  url,
  multiline,
  datetime,
  emailAddress,
  name,
  streetAddress,
  visiblePassword,
}

// Additional form field properties
class TextFormFieldExtended extends TextFormField {
  const TextFormFieldExtended({
    super.key,
    super.controller,
    super.decoration,
    super.maxLines,
    super.validator,
    super.readOnly,
    super.onTap,
    TextInputType? keyboardType,
    bool? enabled,
  });
}

// Outlined button
class OutlinedButton extends Widget {
  final VoidCallback? onPressed;
  final Widget child;
  final ButtonStyle? style;
  
  const OutlinedButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.style,
  });

  const OutlinedButton.icon({
    super.key,
    required this.onPressed,
    required Widget icon,
    required Widget label,
    this.style,
  }) : child = const Text('');

  static ButtonStyle styleFrom({
    Color? backgroundColor,
    Color? foregroundColor,
    EdgeInsets? padding,
    Size? minimumSize,
    BorderSide? side,
  }) {
    return ButtonStyle(
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      padding: padding,
      minimumSize: minimumSize,
      side: side,
    );
  }
}

// Alert dialog and navigation
class AlertDialog extends Widget {
  final Widget? title;
  final Widget? content;
  final List<Widget>? actions;
  const AlertDialog({
    super.key,
    this.title,
    this.content,
    this.actions,
  });
}

Future<T?> showDialog<T>({
  required BuildContext context,
  required Widget Function(BuildContext) builder,
  bool barrierDismissible = true,
}) async {
  print('[MockDialog] Showing dialog');
  return null;
}

class Navigator {
  static NavigatorState of(BuildContext context) {
    return NavigatorState();
  }
}

class NavigatorState {
  void pop([dynamic result]) {
    print('[MockNavigator] Popping route');
  }
}

// Linear gradient
class LinearGradient extends Gradient {
  final List<Color> colors;
  final Alignment begin;
  final Alignment end;
  const LinearGradient({
    required this.colors,
    this.begin = Alignment.centerLeft,
    this.end = Alignment.centerRight,
  });
}

abstract class Gradient {
  const Gradient();
}

// Global key support
class GlobalKeyExtended<T> extends GlobalKey<T> {
  const GlobalKeyExtended({super.debugLabel});
  
  T? get currentState => null;
}

class ListTile extends Widget {
  final Widget? leading;
  final Widget? title;
  final Widget? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final EdgeInsets? contentPadding;
  const ListTile({
    super.key,
    this.leading,
    this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.contentPadding,
  });
}

class Divider extends Widget {
  final double? height;
  final Color? color;
  const Divider({super.key, this.height, this.color});
}

class CircleAvatar extends Widget {
  final double radius;
  final Color? backgroundColor;
  final Widget? child;
  final ImageProvider? backgroundImage;
  const CircleAvatar({
    super.key,
    required this.radius,
    this.backgroundColor,
    this.child,
    this.backgroundImage,
  });
}

class NetworkImage extends ImageProvider {
  final String url;
  const NetworkImage(this.url);
}

abstract class ImageProvider {
  const ImageProvider();
}

// GridView
class GridView extends Widget {
  final int crossAxisCount;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final List<Widget> children;
  final EdgeInsets? padding;
  final double? childAspectRatio;
  final double mainAxisSpacing;
  final double crossAxisSpacing;

  const GridView.count({
    super.key,
    required this.crossAxisCount,
    this.shrinkWrap = false,
    this.physics,
    required this.children,
    this.padding,
    this.childAspectRatio = 1.0,
    this.mainAxisSpacing = 0.0,
    this.crossAxisSpacing = 0.0,
  });
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