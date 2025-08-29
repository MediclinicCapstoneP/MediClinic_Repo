// Custom Flutter Material Design Implementation
// This replaces Flutter Material package due to package resolution issues

import '../../../core/models/appointment.dart';

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
  static const Color green = Color(0xFF4CAF50);
  static const Color red = Color(0xFFF44336);
  static const Color orange = Color(0xFFFF9800);
  static const Color purple = Color(0xFF9C27B0);
  static const Color grey = Color(0xFF9E9E9E);
  static const Color amber = Color(0xFFFFC107);
}

// Icon System
class IconData {
  final int codePoint;
  const IconData(this.codePoint);
}

class Icons {
  static const IconData today = IconData(0xe8df);
  static const IconData calendar_month = IconData(0xe1d0);
  static const IconData check_circle = IconData(0xe86c);
  static const IconData cancel = IconData(0xe5c9);
  static const IconData calendar_today_outlined = IconData(0xe1ec);
  static const IconData check = IconData(0xe5ca);
  static const IconData check_circle_outline = IconData(0xe86d);
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
  final TextStyle? titleLarge,
      titleMedium,
      headlineSmall,
      bodyMedium,
      bodySmall;
  const TextTheme({
    this.titleLarge,
    this.titleMedium,
    this.headlineSmall,
    this.bodyMedium,
    this.bodySmall,
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

// Theme System
class ColorScheme {
  final Color primary, onPrimary, surface, onSurface, error;
  const ColorScheme({
    required this.primary,
    required this.onPrimary,
    required this.surface,
    required this.onSurface,
    required this.error,
  });

  static const ColorScheme light = ColorScheme(
    primary: Color(0xFF1976D2),
    onPrimary: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFFFF),
    onSurface: Color(0xFF000000),
    error: Color(0xFFB00020),
  );
}

class ThemeData {
  final ColorScheme colorScheme;
  final TextTheme textTheme;
  const ThemeData({required this.colorScheme, required this.textTheme});

  static const ThemeData light = ThemeData(
    colorScheme: ColorScheme.light,
    textTheme: TextTheme(
      titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w400),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
      headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w400),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400),
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
  const Text(this.data, {super.key, this.style});
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

// Interactive Widgets
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

  const TextButton.icon({
    super.key,
    required this.onPressed,
    required Widget icon,
    required Widget label,
    this.style,
  }) : child = const _IconLabel();

  static ButtonStyle styleFrom({Color? foregroundColor}) =>
      ButtonStyle(foregroundColor: foregroundColor);
}

class _IconLabel extends Widget {
  const _IconLabel();
}

class ButtonStyle {
  final Color? foregroundColor;
  const ButtonStyle({this.foregroundColor});
}

// List Widgets
class ScrollPhysics {
  const ScrollPhysics();
}

class NeverScrollableScrollPhysics extends ScrollPhysics {
  const NeverScrollableScrollPhysics();
}

class ListView extends Widget {
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final int? itemCount;
  final IndexedWidgetBuilder? itemBuilder;
  final List<Widget>? children;

  const ListView({
    super.key,
    this.shrinkWrap = false,
    this.physics,
    this.children,
  }) : itemCount = null,
       itemBuilder = null;

  const ListView.builder({
    super.key,
    this.shrinkWrap = false,
    this.physics,
    required this.itemCount,
    required this.itemBuilder,
  }) : children = null;
}

class ListTile extends Widget {
  final Widget? leading, title, subtitle, trailing;
  final VoidCallback? onTap;
  const ListTile({
    super.key,
    this.leading,
    this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
  });
}

class CircleAvatar extends Widget {
  final Color? backgroundColor;
  final Widget? child;
  final double radius;
  const CircleAvatar({
    super.key,
    this.backgroundColor,
    this.child,
    this.radius = 20.0,
  });
}

class Chip extends Widget {
  final Widget label;
  final Color? backgroundColor;
  const Chip({super.key, required this.label, this.backgroundColor});
}

class Padding extends Widget {
  final EdgeInsets padding;
  final Widget child;
  const Padding({super.key, required this.padding, required this.child});
}

class Card extends Widget {
  final Widget? child;
  final Color? color;
  final double? elevation;
  const Card({super.key, this.child, this.color, this.elevation});
}

// Key System
abstract class Key {
  const Key();
}

// Clinic Stats Card Widget
class ClinicStatsCard extends StatelessWidget {
  final Map<String, int> stats;

  const ClinicStatsCard({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
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
            'Statistics',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  context,
                  'Today',
                  stats['today'] ?? 0,
                  Icons.today,
                  Colors.blue,
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  context,
                  'Total',
                  stats['total'] ?? 0,
                  Icons.calendar_month,
                  Colors.green,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  context,
                  'Completed',
                  stats['completed'] ?? 0,
                  Icons.check_circle,
                  Colors.green,
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  context,
                  'Cancelled',
                  stats['cancelled'] ?? 0,
                  Icons.cancel,
                  Colors.red,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context,
    String label,
    int value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value.toString(),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

// Today Appointments Card Widget
class TodayAppointmentsCard extends StatelessWidget {
  final List<Appointment> appointments;

  const TodayAppointmentsCard({super.key, required this.appointments});

  @override
  Widget build(BuildContext context) {
    if (appointments.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(
              Icons.calendar_today_outlined,
              size: 48,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No appointments today',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            Text(
              'Enjoy your free day!',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: ListView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: appointments.length,
        itemBuilder: (context, index) {
          final appointment = appointments[index];
          return ListTile(
            leading: CircleAvatar(
              backgroundColor: Theme.of(
                context,
              ).colorScheme.primary.withOpacity(0.1),
              child: Text(
                appointment.appointmentTime.substring(0, 5),
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
            title: Text(appointment.patient?.firstName ?? 'Patient'),
            subtitle: Text(appointment.appointmentType.displayName),
            trailing: Chip(
              label: Text(appointment.status.displayName),
              backgroundColor: Theme.of(
                context,
              ).colorScheme.primary.withOpacity(0.1),
            ),
          );
        },
      ),
    );
  }
}

// Clinic Appointment Card Widget
class ClinicAppointmentCard extends StatelessWidget {
  final Appointment appointment;
  final bool showActions;
  final VoidCallback? onConfirm;
  final VoidCallback? onComplete;
  final VoidCallback? onCancel;

  const ClinicAppointmentCard({
    super.key,
    required this.appointment,
    this.showActions = false,
    this.onConfirm,
    this.onComplete,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: Theme.of(
                    context,
                  ).colorScheme.primary.withOpacity(0.1),
                  child: Text(
                    appointment.appointmentTime.substring(0, 5),
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${appointment.patient?.firstName ?? ''} ${appointment.patient?.lastName ?? 'Patient'}',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        appointment.appointmentType.displayName,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
                Chip(
                  label: Text(appointment.status.displayName),
                  backgroundColor: _getStatusColor(
                    appointment.status,
                  ).withOpacity(0.1),
                ),
              ],
            ),

            if (appointment.patientNotes?.isNotEmpty == true) ...[
              const SizedBox(height: 8),
              Text(
                'Notes: ${appointment.patientNotes}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],

            if (showActions && appointment.canBeCancelled) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  if (appointment.status == AppointmentStatus.scheduled &&
                      onConfirm != null)
                    TextButton.icon(
                      onPressed: onConfirm,
                      icon: const Icon(Icons.check),
                      label: const Text('Confirm'),
                    ),
                  if (appointment.status == AppointmentStatus.confirmed &&
                      onComplete != null)
                    TextButton.icon(
                      onPressed: onComplete,
                      icon: const Icon(Icons.check_circle),
                      label: const Text('Complete'),
                    ),
                  const Spacer(),
                  if (onCancel != null)
                    TextButton.icon(
                      onPressed: onCancel,
                      icon: const Icon(Icons.cancel),
                      label: const Text('Cancel'),
                      style: TextButton.styleFrom(
                        foregroundColor: Theme.of(context).colorScheme.error,
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.scheduled:
        return Colors.orange;
      case AppointmentStatus.confirmed:
        return Colors.blue;
      case AppointmentStatus.completed:
        return Colors.green;
      case AppointmentStatus.cancelled:
        return Colors.red;
      case AppointmentStatus.inProgress:
        return Colors.purple;
      case AppointmentStatus.noShow:
        return Colors.grey;
      case AppointmentStatus.rescheduled:
        return Colors.amber;
    }
  }
}
