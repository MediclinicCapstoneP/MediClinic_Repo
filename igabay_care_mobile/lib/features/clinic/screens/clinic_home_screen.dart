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

// Core Types
typedef VoidCallback = void Function();
typedef WidgetBuilder = Widget Function(BuildContext context);
typedef ValueChanged<T> = void Function(T value);
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
  static const Color amber = Color(0xFFFFC107);
}

// Icon System
class IconData {
  final int codePoint;
  const IconData(this.codePoint);
}

class Icons {
  static const IconData notifications_outlined = IconData(0xe7f7);
  static const IconData local_hospital = IconData(0xe548);
  static const IconData calendar_today = IconData(0xe1ec);
  static const IconData business = IconData(0xe0af);
  static const IconData analytics = IconData(0xe3b8);
  static const IconData settings = IconData(0xe8b8);
  static const IconData trending_up = IconData(0xe8e6);
  static const IconData check_circle = IconData(0xe86c);
  static const IconData star = IconData(0xe838);
  static const IconData schedule = IconData(0xe8b5);
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
  final TextStyle? labelLarge;
  final TextStyle? labelMedium;
  final TextStyle? labelSmall;

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
    this.labelLarge,
    this.labelMedium,
    this.labelSmall,
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
  final Gradient? gradient;
  final BoxShape? shape;

  const BoxDecoration({
    this.color,
    this.borderRadius,
    this.border,
    this.boxShadow,
    this.gradient,
    this.shape,
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

// Gradient System
abstract class Gradient {
  const Gradient();
}

class LinearGradient extends Gradient {
  final Alignment begin;
  final Alignment end;
  final List<Color> colors;
  final List<double>? stops;

  const LinearGradient({
    required this.colors,
    this.begin = Alignment.centerLeft,
    this.end = Alignment.centerRight,
    this.stops,
  });
}

class Alignment {
  final double x;
  final double y;

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
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
    ),
  );
}

class Theme {
  static ThemeData of(BuildContext context) {
    return ThemeData.light; // Mock implementation
  }
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

class Center extends Widget {
  final Widget child;

  const Center({super.key, required this.child});
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

// Sliver Widgets for CustomScrollView
class CustomScrollView extends Widget {
  final List<Widget> slivers;

  const CustomScrollView({super.key, required this.slivers});
}

class SliverAppBar extends Widget implements PreferredSizeWidget {
  final Widget? title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool floating;
  final bool pinned;
  final Color? backgroundColor;
  final double? elevation;
  final double? expandedHeight;

  const SliverAppBar({
    super.key,
    this.title,
    this.actions,
    this.leading,
    this.floating = false,
    this.pinned = false,
    this.backgroundColor,
    this.elevation,
    this.expandedHeight,
  });

  @override
  Size get preferredSize => Size.fromHeight(expandedHeight ?? kToolbarHeight);
}

const double kToolbarHeight = 56.0;

class SliverPadding extends Widget {
  final EdgeInsets padding;
  final Widget sliver;

  const SliverPadding({super.key, required this.padding, required this.sliver});
}

class SliverList extends Widget {
  final SliverChildDelegate delegate;

  const SliverList({super.key, required this.delegate});
}

abstract class SliverChildDelegate {
  const SliverChildDelegate();
}

class SliverChildListDelegate extends SliverChildDelegate {
  final List<Widget> children;

  const SliverChildListDelegate(this.children);
}

// Avatar and Image Widgets
class CircleAvatar extends Widget {
  final double? radius;
  final Color? backgroundColor;
  final Widget? child;
  final ImageProvider? backgroundImage;

  const CircleAvatar({
    super.key,
    this.radius,
    this.backgroundColor,
    this.child,
    this.backgroundImage,
  });
}

abstract class ImageProvider {
  const ImageProvider();
}

class NetworkImage extends ImageProvider {
  final String url;

  const NetworkImage(this.url);
}

// Shape System
enum BoxShape { rectangle, circle }

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

class ClinicStatsCard extends Widget {
  final Map<String, int> stats;

  const ClinicStatsCard({super.key, required this.stats});
}

class TodayAppointmentsCard extends Widget {
  final List<dynamic>
  appointments; // Using dynamic since we don't have the Appointment type in full scope

  const TodayAppointmentsCard({super.key, required this.appointments});
}

class ClinicHomeScreen extends StatefulWidget {
  const ClinicHomeScreen({super.key});

  @override
  State<ClinicHomeScreen> createState() => _ClinicHomeScreenState();
}

class _ClinicHomeScreenState extends State<ClinicHomeScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  List<Appointment> _todayAppointments = [];
  Map<String, int> _stats = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final clinicId = authProvider.user?.clinicProfile?.id;

    if (clinicId != null) {
      try {
        final today = DateTime.now();
        final todayAppointments = await _appointmentService
            .getAppointmentsByDate(clinicId: clinicId, date: today);

        final stats = await _appointmentService.getAppointmentStats(clinicId);

        if (mounted) {
          setState(() {
            _todayAppointments = todayAppointments;
            _stats = stats;
            _isLoading = false;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadDashboardData,
          child: CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                floating: true,
                backgroundColor: Theme.of(context).colorScheme.surface,
                elevation: 0,
                title: Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    final profile = authProvider.user?.clinicProfile;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome back,',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withOpacity(0.7),
                              ),
                        ),
                        Text(
                          profile?.clinicName ?? 'Clinic',
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    );
                  },
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () {
                      // TODO: Navigate to notifications
                    },
                  ),
                  Consumer<AuthProvider>(
                    builder: (context, authProvider, child) {
                      final profilePicture =
                          authProvider.user?.clinicProfile?.profilePictureUrl;
                      return Padding(
                        padding: const EdgeInsets.only(right: 16),
                        child: GestureDetector(
                          onTap: () => context.go('/clinic/profile'),
                          child: CircleAvatar(
                            radius: 18,
                            backgroundColor: Theme.of(
                              context,
                            ).colorScheme.primary.withOpacity(0.1),
                            backgroundImage: profilePicture != null
                                ? NetworkImage(profilePicture)
                                : null,
                            child: profilePicture == null
                                ? Icon(
                                    Icons.local_hospital,
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.primary,
                                    size: 20,
                                  )
                                : null,
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),

              // Content
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    if (_isLoading)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(32),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    else ...[
                      // Statistics Cards
                      ClinicStatsCard(stats: _stats),

                      const SizedBox(height: 24),

                      // Quick Actions
                      _buildQuickActions(),

                      const SizedBox(height: 24),

                      // Today's Appointments
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Today's Appointments",
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          TextButton(
                            onPressed: () => context.go('/clinic/appointments'),
                            child: const Text('View All'),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      TodayAppointmentsCard(appointments: _todayAppointments),

                      const SizedBox(height: 24),

                      // Clinic Performance
                      _buildPerformanceCard(),

                      const SizedBox(height: 32),
                    ],
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const ClinicBottomNav(currentIndex: 0),
    );
  }

  Widget _buildQuickActions() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quick Actions',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  icon: Icons.calendar_today,
                  label: 'Appointments',
                  onTap: () => context.go('/clinic/appointments'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionButton(
                  icon: Icons.business,
                  label: 'Profile',
                  onTap: () => context.go('/clinic/profile'),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  icon: Icons.analytics,
                  label: 'Analytics',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Analytics coming soon')),
                    );
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionButton(
                  icon: Icons.settings,
                  label: 'Settings',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Settings coming soon')),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary, size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPerformanceCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).colorScheme.primary.withOpacity(0.1),
            Theme.of(context).colorScheme.secondary.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.trending_up,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Text(
                'Clinic Performance',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildPerformanceMetric(
                'Completion Rate',
                '95%',
                Icons.check_circle,
                Colors.green,
              ),
              _buildPerformanceMetric(
                'Avg Rating',
                '4.8',
                Icons.star,
                Colors.amber,
              ),
              _buildPerformanceMetric(
                'Response Time',
                '< 2h',
                Icons.schedule,
                Colors.blue,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceMetric(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
