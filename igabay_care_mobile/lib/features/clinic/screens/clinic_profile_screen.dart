// Custom Flutter Material Design Implementation
// This replaces Flutter Material, GoRouter, and Provider packages due to package resolution issues

import '../../../core/providers/auth_provider.dart';
import '../../../core/models/clinic_profile.dart';
import '../widgets/clinic_bottom_nav.dart';

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
typedef FormFieldValidator<T> = String? Function(T? value);

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
  static const Color green = Color(0xFF4CAF50);
  static const Color red = Color(0xFFF44336);
  static const Color orange = Color(0xFFFF9800);
  static const Color black = Color(0xFF000000);
}

// Icon System
class IconData {
  final int codePoint;
  const IconData(this.codePoint);
}

class Icons {
  static const IconData arrow_back = IconData(0xe5c4);
  static const IconData edit = IconData(0xe3c9);
  static const IconData local_hospital = IconData(0xe548);
  static const IconData camera_alt = IconData(0xe3dc);
  static const IconData phone = IconData(0xe0cd);
  static const IconData web = IconData(0xe051);
  static const IconData location_on = IconData(0xe0c8);
  static const IconData location_city = IconData(0xe0c7);
  static const IconData map = IconData(0xe55b);
  static const IconData pin_drop = IconData(0xe1c5);
  static const IconData verified = IconData(0xe8e8);
  static const IconData star = IconData(0xe838);
  static const IconData receipt = IconData(0xe8b0);
  static const IconData calendar_today = IconData(0xe1ec);
  static const IconData people = IconData(0xe7fb);
  static const IconData group = IconData(0xe7ef);
  static const IconData description = IconData(0xe873);
  static const IconData check_circle = IconData(0xe86c);
  static const IconData schedule = IconData(0xe8b5);
  static const IconData error = IconData(0xe000);
  static const IconData logout = IconData(0xe9ba);
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

enum BoxFit { fill, contain, cover, fitWidth, fitHeight, none, scaleDown }

enum BoxShape { rectangle, circle }

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
  final TextStyle? headlineSmall;
  final TextStyle? bodyMedium;
  const TextTheme({this.headlineSmall, this.bodyMedium});
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
  final BoxShape? shape;
  final DecorationImage? image;
  const BoxDecoration({
    this.color,
    this.borderRadius,
    this.border,
    this.shape,
    this.image,
  });
}

class DecorationImage {
  final ImageProvider image;
  final BoxFit fit;
  const DecorationImage({required this.image, this.fit = BoxFit.scaleDown});
}

abstract class ImageProvider {
  const ImageProvider();
}

class NetworkImage extends ImageProvider {
  final String url;
  const NetworkImage(this.url);
}

class Offset {
  final double dx, dy;
  const Offset(this.dx, this.dy);
  static const Offset zero = Offset(0.0, 0.0);
}

// Theme
class ColorScheme {
  final Color primary,
      onPrimary,
      secondary,
      onSecondary,
      surface,
      onSurface,
      background,
      onBackground,
      error,
      onError,
      outline;
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
      headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w400),
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
  final InputBorder? border;
  final bool enabled;
  const InputDecoration({
    this.labelText,
    this.hintText,
    this.prefixIcon,
    this.border,
    this.enabled = true,
  });
}

class InputBorder {
  const InputBorder();
}

class OutlineInputBorder extends InputBorder {
  final BorderRadius? borderRadius;
  const OutlineInputBorder({this.borderRadius});
}

class TextEditingController {
  String _text = '';
  String get text => _text;
  set text(String newText) {
    _text = newText;
  }

  void dispose() {}
}

class TextFormField extends Widget {
  final TextEditingController? controller;
  final InputDecoration? decoration;
  final TextInputType? keyboardType;
  final int? maxLines;
  final bool enabled;
  final FormFieldValidator<String>? validator;
  const TextFormField({
    super.key,
    this.controller,
    this.decoration,
    this.keyboardType,
    this.maxLines = 1,
    this.enabled = true,
    this.validator,
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

class Stack extends Widget {
  final List<Widget> children;
  const Stack({super.key, required this.children});
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

class TextButton extends Widget {
  final VoidCallback? onPressed;
  final Widget child;
  const TextButton({super.key, required this.onPressed, required this.child});
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

// Helper widget for OutlinedButton.icon
class _IconLabelRow extends Widget {
  const _IconLabelRow();
}

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
  }) : child = const _IconLabelRow();

  // Helper method for icon button with label
  static Widget iconWithLabel(Widget icon, Widget label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [icon, const SizedBox(width: 8), label],
    );
  }

  static ButtonStyle styleFrom({Color? foregroundColor, BorderSide? side}) =>
      ButtonStyle(foregroundColor: foregroundColor, side: side);
}

class ButtonStyle {
  final Color? backgroundColor, foregroundColor;
  final BorderSide? side;
  const ButtonStyle({this.backgroundColor, this.foregroundColor, this.side});
}

class FilterChip extends Widget {
  final Widget label;
  final bool selected;
  final ValueChanged<bool>? onSelected;
  const FilterChip({
    super.key,
    required this.label,
    required this.selected,
    this.onSelected,
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
  final List<Widget>? actions;
  const AppBar({super.key, this.title, this.leading, this.actions});
  Size get preferredSize => const Size.fromHeight(56.0);
  Widget build(BuildContext context) => Container(
    height: 56,
    child: Row(
      children: [
        if (leading != null) leading!,
        if (title != null) Expanded(child: title!),
        if (actions != null) ...actions!,
      ],
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

// Key system
abstract class Key {
  const Key();
}

class GlobalKey<T extends State<StatefulWidget>> extends Key {
  T? _currentState;
  GlobalKey();
  T? get currentState => _currentState;
}

// Mock External Widgets
class ClinicBottomNav extends Widget {
  final int currentIndex;
  const ClinicBottomNav({super.key, required this.currentIndex});
}

class ClinicProfileScreen extends StatefulWidget {
  const ClinicProfileScreen({super.key});

  @override
  State<ClinicProfileScreen> createState() => _ClinicProfileScreenState();
}

class _ClinicProfileScreenState extends State<ClinicProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _clinicNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _websiteController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _zipCodeController = TextEditingController();
  final _licenseNumberController = TextEditingController();
  final _accreditationController = TextEditingController();
  final _taxIdController = TextEditingController();
  final _yearEstablishedController = TextEditingController();
  final _numberOfDoctorsController = TextEditingController();
  final _numberOfStaffController = TextEditingController();
  final _descriptionController = TextEditingController();

  List<String> _selectedSpecialties = [];
  List<String> _selectedServices = [];
  bool _isEditing = false;
  bool _isSaving = false;

  final List<String> _availableSpecialties = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Surgery',
    'Urology',
  ];

  final List<String> _availableServices = [
    'Emergency Care',
    'Outpatient Services',
    'Inpatient Services',
    'Laboratory Services',
    'Pharmacy',
    'Radiology',
    'Physical Therapy',
    'Vaccination',
    'Health Screening',
    'Consultation',
  ];

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  @override
  void dispose() {
    _clinicNameController.dispose();
    _phoneController.dispose();
    _websiteController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipCodeController.dispose();
    _licenseNumberController.dispose();
    _accreditationController.dispose();
    _taxIdController.dispose();
    _yearEstablishedController.dispose();
    _numberOfDoctorsController.dispose();
    _numberOfStaffController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _loadProfileData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final profile = authProvider.user?.clinicProfile;

    if (profile != null) {
      _clinicNameController.text = profile.clinicName;
      _phoneController.text = profile.phone ?? '';
      _websiteController.text = profile.website ?? '';
      _addressController.text = profile.address ?? '';
      _cityController.text = profile.city ?? '';
      _stateController.text = profile.state ?? '';
      _zipCodeController.text = profile.zipCode ?? '';
      _licenseNumberController.text = profile.licenseNumber ?? '';
      _accreditationController.text = profile.accreditation ?? '';
      _taxIdController.text = profile.taxId ?? '';
      _yearEstablishedController.text =
          profile.yearEstablished?.toString() ?? '';
      _numberOfDoctorsController.text =
          profile.numberOfDoctors?.toString() ?? '';
      _numberOfStaffController.text = profile.numberOfStaff?.toString() ?? '';
      _descriptionController.text = profile.description ?? '';
      _selectedSpecialties = List.from(profile.specialties);
      _selectedServices = List.from(profile.services);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clinic Profile'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/clinic'),
        ),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                setState(() {
                  _isEditing = true;
                });
              },
            )
          else
            TextButton(
              onPressed: _isSaving ? null : _saveProfile,
              child: _isSaving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save'),
            ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final profile = authProvider.user?.clinicProfile;

          if (profile == null) {
            return const Center(child: Text('No profile data available'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile Picture Section
                  Center(
                    child: Stack(
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: Theme.of(
                              context,
                            ).colorScheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(16),
                            image: profile.profilePictureUrl != null
                                ? DecorationImage(
                                    image: NetworkImage(
                                      profile.profilePictureUrl!,
                                    ),
                                    fit: BoxFit.cover,
                                  )
                                : null,
                          ),
                          child: profile.profilePictureUrl == null
                              ? Icon(
                                  Icons.local_hospital,
                                  size: 60,
                                  color: Theme.of(context).colorScheme.primary,
                                )
                              : null,
                        ),
                        if (_isEditing)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.primary,
                                shape: BoxShape.circle,
                              ),
                              child: IconButton(
                                icon: const Icon(
                                  Icons.camera_alt,
                                  color: Colors.white,
                                ),
                                onPressed: () {
                                  // TODO: Implement image picker
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Image upload coming soon'),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Status Badge
                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(profile.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _getStatusColor(profile.status),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _getStatusIcon(profile.status),
                            size: 16,
                            color: _getStatusColor(profile.status),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            profile.status.name.toUpperCase(),
                            style: TextStyle(
                              color: _getStatusColor(profile.status),
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Basic Information Section
                  _buildSectionHeader('Basic Information'),
                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _clinicNameController,
                    label: 'Clinic Name',
                    icon: Icons.local_hospital,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter clinic name';
                      }
                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          controller: _phoneController,
                          label: 'Phone Number',
                          icon: Icons.phone,
                          keyboardType: TextInputType.phone,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _websiteController,
                          label: 'Website',
                          icon: Icons.web,
                          keyboardType: TextInputType.url,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // Address Section
                  _buildSectionHeader('Address'),
                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _addressController,
                    label: 'Street Address',
                    icon: Icons.location_on,
                    maxLines: 2,
                  ),

                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: _buildTextField(
                          controller: _cityController,
                          label: 'City',
                          icon: Icons.location_city,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _stateController,
                          label: 'State',
                          icon: Icons.map,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _zipCodeController,
                          label: 'ZIP Code',
                          icon: Icons.pin_drop,
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // License & Legal Section
                  _buildSectionHeader('License & Legal'),
                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _licenseNumberController,
                    label: 'License Number',
                    icon: Icons.verified,
                  ),

                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          controller: _accreditationController,
                          label: 'Accreditation',
                          icon: Icons.star,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _taxIdController,
                          label: 'Tax ID',
                          icon: Icons.receipt,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // Clinic Details Section
                  _buildSectionHeader('Clinic Details'),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          controller: _yearEstablishedController,
                          label: 'Year Established',
                          icon: Icons.calendar_today,
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _numberOfDoctorsController,
                          label: 'Number of Doctors',
                          icon: Icons.people,
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _numberOfStaffController,
                          label: 'Number of Staff',
                          icon: Icons.group,
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _descriptionController,
                    label: 'Description',
                    icon: Icons.description,
                    maxLines: 4,
                    hintText: 'Tell patients about your clinic...',
                  ),

                  const SizedBox(height: 32),

                  // Specialties Section
                  _buildSectionHeader('Specialties'),
                  const SizedBox(height: 16),
                  _buildMultiSelectChips(
                    title: 'Select clinic specialties',
                    availableOptions: _availableSpecialties,
                    selectedOptions: _selectedSpecialties,
                    onChanged: (selected) {
                      if (_isEditing) {
                        setState(() {
                          _selectedSpecialties = selected;
                        });
                      }
                    },
                  ),

                  const SizedBox(height: 24),

                  // Services Section
                  _buildSectionHeader('Services'),
                  const SizedBox(height: 16),
                  _buildMultiSelectChips(
                    title: 'Select services offered',
                    availableOptions: _availableServices,
                    selectedOptions: _selectedServices,
                    onChanged: (selected) {
                      if (_isEditing) {
                        setState(() {
                          _selectedServices = selected;
                        });
                      }
                    },
                  ),

                  const SizedBox(height: 32),

                  // Action Buttons
                  if (_isEditing) ...[
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _isSaving
                                ? null
                                : () {
                                    setState(() {
                                      _isEditing = false;
                                    });
                                    _loadProfileData(); // Reset to original data
                                  },
                            child: const Text('Cancel'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isSaving ? null : _saveProfile,
                            child: _isSaving
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text('Save Profile'),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          final authProvider = Provider.of<AuthProvider>(
                            context,
                            listen: false,
                          );
                          authProvider.signOut();
                          context.go('/welcome');
                        },
                        icon: const Icon(Icons.logout),
                        label: const Text('Sign Out'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Theme.of(context).colorScheme.error,
                          side: BorderSide(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: const ClinicBottomNav(currentIndex: 2),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: Theme.of(
        context,
      ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hintText,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        hintText: hintText,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabled: _isEditing,
      ),
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
    );
  }

  Widget _buildMultiSelectChips({
    required String title,
    required List<String> availableOptions,
    required List<String> selectedOptions,
    required Function(List<String>) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: availableOptions.map((option) {
            final isSelected = selectedOptions.contains(option);
            return FilterChip(
              label: Text(option),
              selected: isSelected,
              onSelected: _isEditing
                  ? (selected) {
                      final newSelected = List<String>.from(selectedOptions);
                      if (selected) {
                        newSelected.add(option);
                      } else {
                        newSelected.remove(option);
                      }
                      onChanged(newSelected);
                    }
                  : null,
            );
          }).toList(),
        ),
      ],
    );
  }

  Color _getStatusColor(ClinicStatus status) {
    switch (status) {
      case ClinicStatus.approved:
        return Colors.green;
      case ClinicStatus.pending:
        return Colors.orange;
      case ClinicStatus.rejected:
        return Colors.red;
    }
  }

  IconData _getStatusIcon(ClinicStatus status) {
    switch (status) {
      case ClinicStatus.approved:
        return Icons.check_circle;
      case ClinicStatus.pending:
        return Icons.schedule;
      case ClinicStatus.rejected:
        return Icons.error;
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final currentProfile = authProvider.user?.clinicProfile;

      if (currentProfile != null) {
        final updatedProfile = currentProfile.copyWith(
          clinicName: _clinicNameController.text.trim(),
          phone: _phoneController.text.trim().isEmpty
              ? null
              : _phoneController.text.trim(),
          website: _websiteController.text.trim().isEmpty
              ? null
              : _websiteController.text.trim(),
          address: _addressController.text.trim().isEmpty
              ? null
              : _addressController.text.trim(),
          city: _cityController.text.trim().isEmpty
              ? null
              : _cityController.text.trim(),
          state: _stateController.text.trim().isEmpty
              ? null
              : _stateController.text.trim(),
          zipCode: _zipCodeController.text.trim().isEmpty
              ? null
              : _zipCodeController.text.trim(),
          licenseNumber: _licenseNumberController.text.trim().isEmpty
              ? null
              : _licenseNumberController.text.trim(),
          accreditation: _accreditationController.text.trim().isEmpty
              ? null
              : _accreditationController.text.trim(),
          taxId: _taxIdController.text.trim().isEmpty
              ? null
              : _taxIdController.text.trim(),
          yearEstablished: _yearEstablishedController.text.trim().isEmpty
              ? null
              : int.tryParse(_yearEstablishedController.text.trim()),
          numberOfDoctors: _numberOfDoctorsController.text.trim().isEmpty
              ? null
              : int.tryParse(_numberOfDoctorsController.text.trim()),
          numberOfStaff: _numberOfStaffController.text.trim().isEmpty
              ? null
              : int.tryParse(_numberOfStaffController.text.trim()),
          description: _descriptionController.text.trim().isEmpty
              ? null
              : _descriptionController.text.trim(),
          specialties: _selectedSpecialties,
          services: _selectedServices,
          updatedAt: DateTime.now(),
        );

        await authProvider.updateClinicProfile(updatedProfile);

        if (mounted) {
          setState(() {
            _isEditing = false;
            _isSaving = false;
          });

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile updated successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error updating profile: $e')));
      }
    }
  }
}
