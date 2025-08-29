// Custom Flutter Material Design Implementation
// This replaces Flutter Material, GoRouter, and Provider packages due to package resolution issues

import '../../../core/providers/auth_provider.dart';
import '../../../core/services/appointment_service.dart';
import '../../../core/models/appointment.dart';
import '../widgets/patient_bottom_nav.dart';

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
  final TextStyle? headlineSmall, titleMedium, bodyMedium;
  const TextTheme({this.headlineSmall, this.titleMedium, this.bodyMedium});
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

class BoxDecoration {
  final Color? color;
  final BorderRadius? borderRadius;
  final Border? border;
  const BoxDecoration({this.color, this.borderRadius, this.border});
}

// Theme System
class ColorScheme {
  final Color primary,
      onPrimary,
      surface,
      onSurface,
      outline,
      error,
      errorContainer;
  const ColorScheme({
    required this.primary,
    required this.onPrimary,
    required this.surface,
    required this.onSurface,
    required this.outline,
    required this.error,
    required this.errorContainer,
  });

  static const ColorScheme light = ColorScheme(
    primary: Color(0xFF1976D2),
    onPrimary: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFFFF),
    onSurface: Color(0xFF000000),
    outline: Color(0xFF79747E),
    error: Color(0xFFB00020),
    errorContainer: Color(0xFFFFDAD6),
  );
}

class ThemeData {
  final ColorScheme colorScheme;
  final TextTheme textTheme;
  const ThemeData({required this.colorScheme, required this.textTheme});

  static const ThemeData light = ThemeData(
    colorScheme: ColorScheme.light,
    textTheme: TextTheme(
      headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w400),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
    ),
  );
}

class Theme {
  static ThemeData of(BuildContext context) => ThemeData.light;
}

// Form System
class FormState extends State<StatefulWidget> {
  Widget build(BuildContext context) => Container();
  bool validate() {
    print('[MockForm] Validating form');
    return true;
  }
}

class Form extends StatefulWidget {
  final GlobalKey<FormState>? key;
  final Widget child;
  const Form({this.key, required this.child}) : super(key: key);
  FormState createState() => FormState();
}

class InputDecoration {
  final String? labelText, hintText;
  final Widget? prefixIcon;
  const InputDecoration({this.labelText, this.hintText, this.prefixIcon});
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
  const TextFormField({
    super.key,
    this.controller,
    this.decoration,
    this.maxLines = 1,
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
  const DropdownButtonFormField({
    super.key,
    this.value,
    this.decoration,
    this.items,
    this.onChanged,
  });
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

class Center extends Widget {
  final Widget child;
  const Center({super.key, required this.child});
}

class Wrap extends Widget {
  final List<Widget> children;
  final double spacing, runSpacing;
  const Wrap({
    super.key,
    required this.children,
    this.spacing = 0.0,
    this.runSpacing = 0.0,
  });
}

// Interactive Widgets
class IconButton extends Widget {
  final VoidCallback? onPressed;
  final Widget icon;
  const IconButton({super.key, required this.onPressed, required this.icon});
}

class GestureDetector extends Widget {
  final Widget child;
  final VoidCallback? onTap;
  const GestureDetector({super.key, required this.child, this.onTap});
}

class ElevatedButton extends Widget {
  final VoidCallback? onPressed;
  final Widget child;
  const ElevatedButton({
    super.key,
    required this.onPressed,
    required this.child,
  });
}

class ListTile extends Widget {
  final Widget? leading, title, trailing;
  final VoidCallback? onTap;
  const ListTile({
    super.key,
    this.leading,
    this.title,
    this.trailing,
    this.onTap,
  });
}

class CircularProgressIndicator extends Widget {
  final double strokeWidth;
  const CircularProgressIndicator({super.key, this.strokeWidth = 4.0});
}

// Material Widgets
class Scaffold extends Widget {
  final PreferredSizeWidget? appBar;
  final Widget? body, bottomNavigationBar;
  const Scaffold({super.key, this.appBar, this.body, this.bottomNavigationBar});
}

abstract class PreferredSizeWidget extends Widget {
  Size get preferredSize;
}

class Size {
  final double width, height;
  const Size(this.width, this.height);
  const Size.fromHeight(double height)
    : width = double.infinity,
      height = height;
}

class AppBar extends StatelessWidget implements PreferredSizeWidget {
  final Widget? title, leading;
  const AppBar({super.key, this.title, this.leading});
  Size get preferredSize => const Size.fromHeight(56.0);
  Widget build(BuildContext context) => Container(
    height: 56,
    child: Row(
      children: [if (leading != null) leading!, if (title != null) title!],
    ),
  );
}

class SingleChildScrollView extends Widget {
  final Widget child;
  final EdgeInsets? padding;
  const SingleChildScrollView({super.key, required this.child, this.padding});
}

class SnackBar extends Widget {
  final Widget content;
  final Color? backgroundColor;
  const SnackBar({super.key, required this.content, this.backgroundColor});
}

class ScaffoldMessenger {
  static ScaffoldMessengerState of(BuildContext context) =>
      ScaffoldMessengerState();
}

class ScaffoldMessengerState {
  void showSnackBar(SnackBar snackBar) =>
      print('[MockScaffoldMessenger] Showing snackbar');
}

// Date/Time Widgets
Future<DateTime?> showDatePicker({
  required BuildContext context,
  required DateTime initialDate,
  required DateTime firstDate,
  required DateTime lastDate,
}) async {
  print('[MockDatePicker] Showing date picker');
  return DateTime.now();
}

// Key System
abstract class Key {
  const Key();
}

class GlobalKey<T extends State<StatefulWidget>> extends Key {
  T? _currentState;
  GlobalKey();
  T? get currentState => _currentState;
}

// Mock External Widgets
class PatientBottomNav extends Widget {
  final int currentIndex;
  const PatientBottomNav({super.key, required this.currentIndex});
}

class BookAppointmentScreen extends StatefulWidget {
  final String? clinicId;

  const BookAppointmentScreen({super.key, this.clinicId});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  final _formKey = GlobalKey<FormState>();

  DateTime? _selectedDate;
  String? _selectedTime;
  AppointmentType _selectedType = AppointmentType.consultation;
  final _notesController = TextEditingController();

  List<String> _availableTimeSlots = [];
  bool _isLoading = false;
  bool _isBooking = false;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now().add(const Duration(days: 1));
    _loadAvailableTimeSlots();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadAvailableTimeSlots() async {
    if (_selectedDate == null || widget.clinicId == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final slots = await _appointmentService.getAvailableTimeSlots(
        clinicId: widget.clinicId!,
        date: _selectedDate!,
      );
      setState(() {
        _availableTimeSlots = slots;
        _selectedTime = null; // Reset selected time when date changes
      });
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error loading time slots: $e')));
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Appointment'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Date Selection
              Text(
                'Select Date',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),

              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: Theme.of(
                      context,
                    ).colorScheme.outline.withOpacity(0.3),
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  leading: const Icon(Icons.calendar_today),
                  title: Text(
                    _selectedDate != null
                        ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                        : 'Select a date',
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  onTap: () => _selectDate(),
                ),
              ),

              const SizedBox(height: 24),

              // Time Selection
              Text(
                'Select Time',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),

              if (_isLoading)
                const Center(child: CircularProgressIndicator())
              else if (_availableTimeSlots.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Theme.of(
                      context,
                    ).colorScheme.errorContainer.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.schedule,
                        size: 48,
                        color: Theme.of(context).colorScheme.error,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No available time slots',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Please select a different date',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                )
              else
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: _availableTimeSlots.map((timeSlot) {
                    final isSelected = _selectedTime == timeSlot;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedTime = timeSlot;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.surface,
                          border: Border.all(
                            color: isSelected
                                ? Theme.of(context).colorScheme.primary
                                : Theme.of(
                                    context,
                                  ).colorScheme.outline.withOpacity(0.3),
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _formatTime(timeSlot),
                          style: TextStyle(
                            color: isSelected
                                ? Theme.of(context).colorScheme.onPrimary
                                : Theme.of(context).colorScheme.onSurface,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),

              const SizedBox(height: 24),

              // Appointment Type
              Text(
                'Appointment Type',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<AppointmentType>(
                value: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Type of appointment',
                  prefixIcon: Icon(Icons.medical_services),
                ),
                items: AppointmentType.values.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(type.displayName),
                  );
                }).toList(),
                onChanged: (AppointmentType? value) {
                  if (value != null) {
                    setState(() {
                      _selectedType = value;
                    });
                  }
                },
              ),

              const SizedBox(height: 24),

              // Notes
              Text(
                'Additional Notes (Optional)',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _notesController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Any specific concerns or notes',
                  hintText:
                      'Please describe your symptoms or reason for visit...',
                  prefixIcon: Icon(Icons.note_alt),
                ),
              ),

              const SizedBox(height: 32),

              // Book Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed:
                      (_selectedDate != null &&
                          _selectedTime != null &&
                          !_isBooking)
                      ? _bookAppointment
                      : null,
                  child: _isBooking
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Book Appointment'),
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const PatientBottomNav(currentIndex: 1),
    );
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
      await _loadAvailableTimeSlots();
    }
  }

  String _formatTime(String timeSlot) {
    // Convert 24-hour format to 12-hour format
    final parts = timeSlot.split(':');
    final hour = int.parse(parts[0]);
    final minute = parts[1];

    if (hour == 0) {
      return '12:$minute AM';
    } else if (hour < 12) {
      return '$hour:$minute AM';
    } else if (hour == 12) {
      return '12:$minute PM';
    } else {
      return '${hour - 12}:$minute PM';
    }
  }

  Future<void> _bookAppointment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null ||
        _selectedTime == null ||
        widget.clinicId == null)
      return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final patientId = authProvider.user?.patientProfile?.id;

    if (patientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete your profile first')),
      );
      return;
    }

    setState(() {
      _isBooking = true;
    });

    try {
      await _appointmentService.createAppointment(
        patientId: patientId,
        clinicId: widget.clinicId!,
        appointmentDate: _selectedDate!,
        appointmentTime: _selectedTime!,
        appointmentType: _selectedType,
        patientNotes: _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Appointment booked successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        context.go('/patient/appointments');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error booking appointment: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isBooking = false;
        });
      }
    }
  }
}
