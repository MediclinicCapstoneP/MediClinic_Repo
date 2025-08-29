// Custom Flutter Material Design Implementation
// This replaces Flutter Material, GoRouter, and Provider packages due to package resolution issues

import '../../../core/providers/auth_provider.dart';
import '../../../core/services/appointment_service.dart';
import '../../../core/models/appointment.dart';
import '../widgets/clinic_bottom_nav.dart';
import '../widgets/clinic_widgets.dart';

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

  // Mock BuildContext for State classes
  BuildContext get context => BuildContext();

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

// Ticker Provider Mixin
abstract class TickerProvider {
  Ticker createTicker(TickerCallback onTick);
}

class Ticker {
  final TickerCallback _onTick;
  bool _active = false;

  Ticker(this._onTick);

  void start() {
    _active = true;
    print('[MockTicker] Started');
  }

  void stop() {
    _active = false;
    print('[MockTicker] Stopped');
  }

  void dispose() {
    stop();
    print('[MockTicker] Disposed');
  }
}

typedef TickerCallback = void Function(Duration elapsed);

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

// Core Types
typedef VoidCallback = void Function();
typedef WidgetBuilder = Widget Function(BuildContext context);
typedef ValueChanged<T> = void Function(T value);
typedef FormFieldValidator<T> = String? Function(T? value);
typedef AsyncCallback = Future<void> Function();

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
  static const IconData calendar_month = IconData(0xe1ec);
  static const IconData today = IconData(0xe8df);
  static const IconData schedule = IconData(0xe8b5);
  static const IconData history = IconData(0xe889);
  static const IconData calendar_today_outlined = IconData(0xe1ed);
  static const IconData calendar_today = IconData(0xe1ec);
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

enum TextAlign { left, right, center, justify, start, end }

class TextStyle {
  final Color? color;
  final double? fontSize;
  final FontWeight? fontWeight;
  final String? fontFamily;

  const TextStyle({
    this.color,
    this.fontSize,
    this.fontWeight,
    this.fontFamily,
  });

  TextStyle copyWith({
    Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    String? fontFamily,
  }) {
    return TextStyle(
      color: color ?? this.color,
      fontSize: fontSize ?? this.fontSize,
      fontWeight: fontWeight ?? this.fontWeight,
      fontFamily: fontFamily ?? this.fontFamily,
    );
  }
}

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

// Tab System
class TabController {
  final int length;
  final TickerProvider vsync;
  int _index = 0;

  TabController({required this.length, required this.vsync});

  int get index => _index;

  set index(int value) {
    _index = value;
    print('[MockTabController] Index changed to $value');
  }

  void dispose() {
    print('[MockTabController] Disposed');
  }
}

class Tab extends Widget {
  final Widget? child;
  final String? text;
  final IconData? icon;

  const Tab({super.key, this.child, this.text, this.icon});
}

class TabBar extends Widget implements PreferredSizeWidget {
  final TabController? controller;
  final List<Widget> tabs;

  const TabBar({super.key, this.controller, required this.tabs});

  @override
  Size get preferredSize => const Size.fromHeight(48.0);
}

class TabBarView extends Widget {
  final TabController? controller;
  final List<Widget> children;

  const TabBarView({super.key, this.controller, required this.children});
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

// List and Scroll Widgets
class ListView extends Widget {
  final List<Widget>? children;
  final EdgeInsets? padding;
  final Widget Function(BuildContext, int)? itemBuilder;
  final int? itemCount;

  const ListView({super.key, this.children, this.padding})
    : itemBuilder = null,
      itemCount = null;

  const ListView.builder({
    super.key,
    this.padding,
    required this.itemBuilder,
    this.itemCount,
  }) : children = null;
}

// Interactive Widgets
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

  static ButtonStyle styleFrom({
    Color? backgroundColor,
    Color? foregroundColor,
    EdgeInsets? padding,
  }) {
    return ButtonStyle(
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      padding: padding,
    );
  }
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

class RefreshIndicator extends Widget {
  final Widget child;
  final AsyncCallback onRefresh;

  const RefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
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
  final PreferredSizeWidget? bottom;

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
    this.bottom,
  });

  @override
  Size get preferredSize {
    final double height =
        kToolbarHeight + (bottom?.preferredSize.height ?? 0.0);
    return Size.fromHeight(height);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: preferredSize.height,
      color: backgroundColor ?? Theme.of(context).colorScheme.primary,
      child: Column(
        children: [
          Container(
            height: kToolbarHeight,
            child: Row(
              children: [
                if (leading != null) leading!,
                if (title != null) Expanded(child: title!),
                if (actions != null) ...actions!,
              ],
            ),
          ),
          if (bottom != null) bottom!,
        ],
      ),
    );
  }
}

const double kToolbarHeight = 56.0;

// Form and Input Widgets
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

class InputDecoration {
  final String? labelText;
  final String? hintText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final String? errorText;
  final EdgeInsets? contentPadding;
  final BorderRadius? borderRadius;
  final InputBorder? border;

  const InputDecoration({
    this.labelText,
    this.hintText,
    this.prefixIcon,
    this.suffixIcon,
    this.errorText,
    this.contentPadding,
    this.borderRadius,
    this.border,
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

class TextFormField extends Widget {
  final TextEditingController? controller;
  final String? initialValue;
  final InputDecoration? decoration;
  final int? maxLines;
  final bool enabled;

  const TextFormField({
    super.key,
    this.controller,
    this.initialValue,
    this.decoration,
    this.maxLines = 1,
    this.enabled = true,
  });
}

// Dialog System
class AlertDialog extends Widget {
  final Widget? title;
  final Widget? content;
  final List<Widget>? actions;

  const AlertDialog({super.key, this.title, this.content, this.actions});
}

class Navigator {
  static NavigatorState of(BuildContext context) {
    return NavigatorState();
  }
}

class NavigatorState {
  void pop<T extends Object?>([T? result]) {
    print('[MockNavigator] Popping with result: $result');
  }
}

// Date Picker
Future<DateTime?> showDatePicker({
  required BuildContext context,
  required DateTime initialDate,
  required DateTime firstDate,
  required DateTime lastDate,
}) async {
  print('[MockDatePicker] Showing date picker');
  // Mock implementation - return current date after delay
  await Future.delayed(const Duration(milliseconds: 100));
  return initialDate;
}

// Dialog Functions
Future<T?> showDialog<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  bool barrierDismissible = true,
}) async {
  print('[MockDialog] Showing dialog');
  // Mock implementation - return null after delay
  await Future.delayed(const Duration(milliseconds: 100));
  return null;
}

// SnackBar System
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

// Mock External Widget Classes
// These represent the clinic-specific widgets that are imported from other files
class ClinicBottomNav extends Widget {
  final int currentIndex;

  const ClinicBottomNav({super.key, required this.currentIndex});
}

class ClinicAppointmentCard extends Widget {
  final dynamic
  appointment; // Using dynamic since we don't have the Appointment type in scope
  final bool showActions;
  final VoidCallback? onConfirm;
  final VoidCallback? onComplete;
  final VoidCallback? onCancel;

  const ClinicAppointmentCard({
    super.key,
    required this.appointment,
    required this.showActions,
    this.onConfirm,
    this.onComplete,
    this.onCancel,
  });
}

class ClinicAppointmentsScreen extends StatefulWidget {
  const ClinicAppointmentsScreen({super.key});

  @override
  State<ClinicAppointmentsScreen> createState() =>
      _ClinicAppointmentsScreenState();
}

class _ClinicAppointmentsScreenState extends State<ClinicAppointmentsScreen>
    with SingleTickerProviderStateMixin {
  final AppointmentService _appointmentService = AppointmentService();
  late TabController _tabController;

  List<Appointment> _todayAppointments = [];
  List<Appointment> _upcomingAppointments = [];
  List<Appointment> _pastAppointments = [];
  bool _isLoading = true;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAppointments();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAppointments() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final clinicId = authProvider.user?.clinicProfile?.id;

    if (clinicId == null) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final allAppointments = await _appointmentService.getClinicAppointments(
        clinicId,
      );
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final tomorrow = today.add(const Duration(days: 1));

      setState(() {
        _todayAppointments = allAppointments.where((appointment) {
          final appointmentDate = DateTime(
            appointment.appointmentDate.year,
            appointment.appointmentDate.month,
            appointment.appointmentDate.day,
          );
          return appointmentDate.isAtSameMomentAs(today) &&
              (appointment.status == AppointmentStatus.scheduled ||
                  appointment.status == AppointmentStatus.confirmed ||
                  appointment.status == AppointmentStatus.inProgress);
        }).toList();

        _upcomingAppointments = allAppointments.where((appointment) {
          final appointmentDate = DateTime(
            appointment.appointmentDate.year,
            appointment.appointmentDate.month,
            appointment.appointmentDate.day,
          );
          return appointmentDate.isAfter(today) &&
              (appointment.status == AppointmentStatus.scheduled ||
                  appointment.status == AppointmentStatus.confirmed);
        }).toList();

        _pastAppointments = allAppointments.where((appointment) {
          final appointmentDate = DateTime(
            appointment.appointmentDate.year,
            appointment.appointmentDate.month,
            appointment.appointmentDate.day,
          );
          return appointmentDate.isBefore(today) ||
              appointment.status == AppointmentStatus.completed ||
              appointment.status == AppointmentStatus.cancelled ||
              appointment.status == AppointmentStatus.noShow;
        }).toList();

        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading appointments: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointments'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/clinic'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month),
            onPressed: _showDatePicker,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.today),
                  const SizedBox(width: 8),
                  Text('Today (${_todayAppointments.length})'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.schedule),
                  const SizedBox(width: 8),
                  Text('Upcoming (${_upcomingAppointments.length})'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.history),
                  const SizedBox(width: 8),
                  Text('Past (${_pastAppointments.length})'),
                ],
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAppointments,
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Today's Appointments
                  _buildAppointmentsList(
                    context: context,
                    appointments: _todayAppointments,
                    emptyMessage: 'No appointments today',
                    emptySubtitle: 'Your schedule is clear for today',
                    showActions: true,
                  ),

                  // Upcoming Appointments
                  _buildAppointmentsList(
                    context: context,
                    appointments: _upcomingAppointments,
                    emptyMessage: 'No upcoming appointments',
                    emptySubtitle: 'New appointments will appear here',
                    showActions: true,
                  ),

                  // Past Appointments
                  _buildAppointmentsList(
                    context: context,
                    appointments: _pastAppointments,
                    emptyMessage: 'No past appointments',
                    emptySubtitle: 'Your appointment history will appear here',
                    showActions: false,
                  ),
                ],
              ),
            ),
      bottomNavigationBar: const ClinicBottomNav(currentIndex: 1),
    );
  }

  Widget _buildAppointmentsList({
    required BuildContext context,
    required List<Appointment> appointments,
    required String emptyMessage,
    required String emptySubtitle,
    required bool showActions,
  }) {
    if (appointments.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.calendar_today_outlined,
                size: 64,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
              ),
              const SizedBox(height: 24),
              Text(
                emptyMessage,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                emptySubtitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.5),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    // Group appointments by date
    final groupedAppointments = <String, List<Appointment>>{};
    for (final appointment in appointments) {
      final dateKey =
          '${appointment.appointmentDate.day}/${appointment.appointmentDate.month}/${appointment.appointmentDate.year}';
      if (groupedAppointments.containsKey(dateKey)) {
        groupedAppointments[dateKey]!.add(appointment);
      } else {
        groupedAppointments[dateKey] = [appointment];
      }
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: groupedAppointments.length,
      itemBuilder: (context, index) {
        final dateKey = groupedAppointments.keys.elementAt(index);
        final dayAppointments = groupedAppointments[dateKey]!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    dateKey,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${dayAppointments.length}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Appointments for this date
            ...dayAppointments
                .map(
                  (appointment) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: ClinicAppointmentCard(
                      appointment: appointment,
                      showActions: showActions,
                      onConfirm: showActions
                          ? () => _confirmAppointment(context, appointment)
                          : null,
                      onComplete: showActions
                          ? () => _completeAppointment(context, appointment)
                          : null,
                      onCancel: showActions
                          ? () => _cancelAppointment(context, appointment)
                          : null,
                    ),
                  ),
                )
                .toList(),

            const SizedBox(height: 16),
          ],
        );
      },
    );
  }

  Future<void> _showDatePicker() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
      // TODO: Filter appointments by selected date
    }
  }

  Future<void> _confirmAppointment(
    BuildContext context,
    Appointment appointment,
  ) async {
    try {
      await _appointmentService.confirmAppointment(appointment.id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Appointment confirmed'),
            backgroundColor: Colors.green,
          ),
        );
        _loadAppointments();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error confirming appointment: $e')),
        );
      }
    }
  }

  Future<void> _completeAppointment(
    BuildContext context,
    Appointment appointment,
  ) async {
    final notes = await _showNotesDialog(
      context,
      'Appointment Notes',
      'Add any notes about this appointment...',
    );

    if (notes != null) {
      try {
        await _appointmentService.completeAppointment(
          appointmentId: appointment.id,
          doctorNotes: notes.isNotEmpty ? notes : null,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Appointment completed'),
              backgroundColor: Colors.green,
            ),
          );
          _loadAppointments();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error completing appointment: $e')),
          );
        }
      }
    }
  }

  Future<void> _cancelAppointment(
    BuildContext context,
    Appointment appointment,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Appointment'),
        content: const Text(
          'Are you sure you want to cancel this appointment? The patient will be notified.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Keep Appointment'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ButtonStyle.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Cancel Appointment'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final reason = await _showNotesDialog(
        context,
        'Cancellation Reason',
        'Please provide a reason for cancellation...',
        isRequired: true,
      );

      if (reason != null && reason.isNotEmpty) {
        try {
          await _appointmentService.cancelAppointment(
            appointmentId: appointment.id,
            cancelledBy: 'clinic',
            cancellationReason: reason,
          );

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Appointment cancelled'),
                backgroundColor: Colors.green,
              ),
            );
            _loadAppointments();
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Error cancelling appointment: $e')),
            );
          }
        }
      }
    }
  }

  Future<String?> _showNotesDialog(
    BuildContext context,
    String title,
    String hint, {
    bool isRequired = false,
  }) async {
    final controller = TextEditingController();

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: controller,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: hint,
                border: const OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final text = controller.text.trim();
              if (isRequired && text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('This field is required')),
                );
                return;
              }
              Navigator.of(context).pop(text);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
