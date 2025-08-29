/// App Theme Configuration
///
/// This file provides theme configuration for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:flutter/material.dart (replaced with custom Material Design classes)
/// - package:google_fonts/google_fonts.dart (replaced with custom font configuration)
///
/// The custom implementations maintain API compatibility for future migration
/// back to real packages when the environment issues are resolved.

// Custom implementations to replace unavailable packages
// import 'package:flutter/material.dart'; // Replaced with custom Material Design
// import 'package:google_fonts/google_fonts.dart'; // Replaced with custom font config

/// Custom Color class
class Color {
  final int value;

  const Color(this.value);

  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);

  Color withOpacity(double opacity) {
    final alpha = (255 * opacity).round();
    return Color((alpha << 24) | (value & 0x00FFFFFF));
  }
}

/// Custom TextStyle class
class TextStyle {
  final double? fontSize;
  final FontWeight? fontWeight;
  final Color? color;
  final String? fontFamily;

  const TextStyle({
    this.fontSize,
    this.fontWeight,
    this.color,
    this.fontFamily,
  });

  TextStyle copyWith({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    String? fontFamily,
  }) {
    return TextStyle(
      fontSize: fontSize ?? this.fontSize,
      fontWeight: fontWeight ?? this.fontWeight,
      color: color ?? this.color,
      fontFamily: fontFamily ?? this.fontFamily,
    );
  }
}

/// Custom FontWeight enum
class FontWeight {
  final int value;

  const FontWeight(this.value);

  static const FontWeight normal = FontWeight(400);
  static const FontWeight w500 = FontWeight(500);
  static const FontWeight w600 = FontWeight(600);
  static const FontWeight bold = FontWeight(700);
}

/// Custom TextTheme class
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

  TextTheme apply({Color? bodyColor, Color? displayColor, String? fontFamily}) {
    return TextTheme(
      displayLarge: displayLarge?.copyWith(
        color: displayColor,
        fontFamily: fontFamily,
      ),
      displayMedium: displayMedium?.copyWith(
        color: displayColor,
        fontFamily: fontFamily,
      ),
      displaySmall: displaySmall?.copyWith(
        color: displayColor,
        fontFamily: fontFamily,
      ),
      headlineLarge: headlineLarge?.copyWith(
        color: bodyColor,
        fontFamily: fontFamily,
      ),
      headlineMedium: headlineMedium?.copyWith(
        color: bodyColor,
        fontFamily: fontFamily,
      ),
      headlineSmall: headlineSmall?.copyWith(
        color: bodyColor,
        fontFamily: fontFamily,
      ),
      titleLarge: titleLarge?.copyWith(
        color: bodyColor,
        fontFamily: fontFamily,
      ),
      titleMedium: titleMedium?.copyWith(
        color: bodyColor,
        fontFamily: fontFamily,
      ),
      titleSmall: titleSmall?.copyWith(
        color: bodyColor,
        fontFamily: fontFamily,
      ),
      bodyLarge: bodyLarge?.copyWith(color: bodyColor, fontFamily: fontFamily),
      bodyMedium: bodyMedium?.copyWith(
        color: bodyColor,
        fontFamily: fontFamily,
      ),
      bodySmall: bodySmall?.copyWith(color: bodyColor, fontFamily: fontFamily),
      labelLarge: labelLarge?.copyWith(
        color: bodyColor,
        fontFamily: fontFamily,
      ),
      labelMedium: labelMedium?.copyWith(
        color: bodyColor,
        fontFamily: fontFamily,
      ),
      labelSmall: labelSmall?.copyWith(
        color: bodyColor,
        fontFamily: fontFamily,
      ),
    );
  }
}

/// Mock Google Fonts class
class GoogleFonts {
  static TextTheme interTextTheme(TextTheme base) {
    // Return the base text theme with Inter font family applied
    return TextTheme(
      displayLarge: base.displayLarge?.copyWith(fontFamily: 'Inter'),
      displayMedium: base.displayMedium?.copyWith(fontFamily: 'Inter'),
      displaySmall: base.displaySmall?.copyWith(fontFamily: 'Inter'),
      headlineLarge: base.headlineLarge?.copyWith(fontFamily: 'Inter'),
      headlineMedium: base.headlineMedium?.copyWith(fontFamily: 'Inter'),
      headlineSmall: base.headlineSmall?.copyWith(fontFamily: 'Inter'),
      titleLarge: base.titleLarge?.copyWith(fontFamily: 'Inter'),
      titleMedium: base.titleMedium?.copyWith(fontFamily: 'Inter'),
      titleSmall: base.titleSmall?.copyWith(fontFamily: 'Inter'),
      bodyLarge: base.bodyLarge?.copyWith(fontFamily: 'Inter'),
      bodyMedium: base.bodyMedium?.copyWith(fontFamily: 'Inter'),
      bodySmall: base.bodySmall?.copyWith(fontFamily: 'Inter'),
      labelLarge: base.labelLarge?.copyWith(fontFamily: 'Inter'),
      labelMedium: base.labelMedium?.copyWith(fontFamily: 'Inter'),
      labelSmall: base.labelSmall?.copyWith(fontFamily: 'Inter'),
    );
  }
}

/// Mock Colors class
class Colors {
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
}

/// Mock Brightness enum
enum Brightness { light, dark }

/// Mock ColorScheme class
class ColorScheme {
  final Brightness brightness;
  final Color primary;
  final Color secondary;
  final Color error;
  final Color background;
  final Color surface;
  final Color onPrimary;
  final Color onSecondary;
  final Color onError;
  final Color onBackground;
  final Color onSurface;

  const ColorScheme.light({
    this.brightness = Brightness.light,
    required this.primary,
    required this.secondary,
    required this.error,
    required this.background,
    required this.surface,
    required this.onPrimary,
    required this.onSecondary,
    required this.onError,
    required this.onBackground,
    required this.onSurface,
  });

  const ColorScheme.dark({
    this.brightness = Brightness.dark,
    required this.primary,
    required this.secondary,
    required this.error,
    required this.background,
    required this.surface,
    required this.onPrimary,
    required this.onSecondary,
    required this.onError,
    required this.onBackground,
    required this.onSurface,
  });
}

/// Mock EdgeInsets class
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

  const EdgeInsets.symmetric({double vertical = 0, double horizontal = 0})
    : left = horizontal,
      top = vertical,
      right = horizontal,
      bottom = vertical;

  const EdgeInsets.only({
    this.left = 0,
    this.top = 0,
    this.right = 0,
    this.bottom = 0,
  });
}

/// Mock BorderRadius class
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

/// Mock BorderSide class
class BorderSide {
  final Color color;
  final double width;

  const BorderSide({this.color = const Color(0xFF000000), this.width = 1.0});
}

/// Mock RoundedRectangleBorder class
class RoundedRectangleBorder {
  final BorderRadius borderRadius;
  final BorderSide side;

  const RoundedRectangleBorder({
    this.borderRadius = const BorderRadius.all(0),
    this.side = const BorderSide(),
  });
}

/// Mock OutlineInputBorder class
class OutlineInputBorder {
  final BorderRadius borderRadius;
  final BorderSide borderSide;

  const OutlineInputBorder({
    this.borderRadius = const BorderRadius.all(4),
    this.borderSide = const BorderSide(),
  });
}

/// Mock ButtonStyle class
class ButtonStyle {
  final Color? backgroundColor;
  final Color? foregroundColor;
  final EdgeInsets? padding;
  final RoundedRectangleBorder? shape;
  final TextStyle? textStyle;
  final BorderSide? side;

  const ButtonStyle({
    this.backgroundColor,
    this.foregroundColor,
    this.padding,
    this.shape,
    this.textStyle,
    this.side,
  });
}

/// Mock ElevatedButton class
class ElevatedButton {
  static ButtonStyle styleFrom({
    Color? backgroundColor,
    Color? foregroundColor,
    EdgeInsets? padding,
    RoundedRectangleBorder? shape,
    TextStyle? textStyle,
  }) {
    return ButtonStyle(
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      padding: padding,
      shape: shape,
      textStyle: textStyle,
    );
  }
}

/// Mock OutlinedButton class
class OutlinedButton {
  static ButtonStyle styleFrom({
    Color? foregroundColor,
    BorderSide? side,
    EdgeInsets? padding,
    RoundedRectangleBorder? shape,
    TextStyle? textStyle,
  }) {
    return ButtonStyle(
      foregroundColor: foregroundColor,
      side: side,
      padding: padding,
      shape: shape,
      textStyle: textStyle,
    );
  }
}

/// Mock TextButton class
class TextButton {
  static ButtonStyle styleFrom({
    Color? foregroundColor,
    EdgeInsets? padding,
    TextStyle? textStyle,
  }) {
    return ButtonStyle(
      foregroundColor: foregroundColor,
      padding: padding,
      textStyle: textStyle,
    );
  }
}

/// Mock Theme classes
class ElevatedButtonThemeData {
  final ButtonStyle? style;

  const ElevatedButtonThemeData({this.style});
}

class OutlinedButtonThemeData {
  final ButtonStyle? style;

  const OutlinedButtonThemeData({this.style});
}

class TextButtonThemeData {
  final ButtonStyle? style;

  const TextButtonThemeData({this.style});
}

class InputDecorationTheme {
  final OutlineInputBorder? border;
  final OutlineInputBorder? enabledBorder;
  final OutlineInputBorder? focusedBorder;
  final OutlineInputBorder? errorBorder;
  final EdgeInsets? contentPadding;
  final bool? filled;
  final Color? fillColor;

  const InputDecorationTheme({
    this.border,
    this.enabledBorder,
    this.focusedBorder,
    this.errorBorder,
    this.contentPadding,
    this.filled,
    this.fillColor,
  });
}

class AppBarTheme {
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? elevation;
  final bool? centerTitle;
  final TextStyle? titleTextStyle;

  const AppBarTheme({
    this.backgroundColor,
    this.foregroundColor,
    this.elevation,
    this.centerTitle,
    this.titleTextStyle,
  });
}

class CardTheme {
  final Color? color;
  final double? elevation;
  final Color? shadowColor;
  final RoundedRectangleBorder? shape;

  const CardTheme({this.color, this.elevation, this.shadowColor, this.shape});
}

/// Mock ThemeData class
class ThemeData {
  final bool useMaterial3;
  final Brightness brightness;
  final ColorScheme colorScheme;
  final TextTheme textTheme;
  final AppBarTheme? appBarTheme;
  final ElevatedButtonThemeData? elevatedButtonTheme;
  final OutlinedButtonThemeData? outlinedButtonTheme;
  final TextButtonThemeData? textButtonTheme;
  final InputDecorationTheme? inputDecorationTheme;
  final CardTheme? cardTheme;
  final Color scaffoldBackgroundColor;

  const ThemeData({
    this.useMaterial3 = false,
    required this.brightness,
    required this.colorScheme,
    required this.textTheme,
    this.appBarTheme,
    this.elevatedButtonTheme,
    this.outlinedButtonTheme,
    this.textButtonTheme,
    this.inputDecorationTheme,
    this.cardTheme,
    required this.scaffoldBackgroundColor,
  });
}

class AppTheme {
  // Colors
  static const Color primaryColor = Color(0xFF2563EB); // Blue-600
  static const Color primaryLight = Color(0xFF3B82F6); // Blue-500
  static const Color primaryDark = Color(0xFF1D4ED8); // Blue-700

  static const Color secondaryColor = Color(0xFF10B981); // Emerald-500
  static const Color errorColor = Color(0xFFEF4444); // Red-500
  static const Color warningColor = Color(0xFFF59E0B); // Amber-500
  static const Color successColor = Color(0xFF10B981); // Emerald-500

  static const Color backgroundColor = Color(0xFFF8FAFC); // Slate-50
  static const Color surfaceColor = Color(0xFFFFFFFF);
  static const Color cardColor = Color(0xFFFFFFFF);

  static const Color textPrimary = Color(0xFF0F172A); // Slate-900
  static const Color textSecondary = Color(0xFF64748B); // Slate-500
  static const Color textTertiary = Color(0xFF94A3B8); // Slate-400

  // Text Styles
  static TextTheme textTheme = GoogleFonts.interTextTheme(
    const TextTheme(
      displayLarge: TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: textPrimary,
      ),
      displayMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: textPrimary,
      ),
      displaySmall: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: textPrimary,
      ),
      headlineLarge: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: textPrimary,
      ),
      headlineMedium: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: textPrimary,
      ),
      headlineSmall: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: textPrimary,
      ),
      titleLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: textPrimary,
      ),
      titleMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: textPrimary,
      ),
      titleSmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: textPrimary,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.normal,
        color: textPrimary,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.normal,
        color: textPrimary,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.normal,
        color: textSecondary,
      ),
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: textPrimary,
      ),
      labelMedium: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: textSecondary,
      ),
      labelSmall: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w500,
        color: textTertiary,
      ),
    ),
  );

  // Light Theme
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: const ColorScheme.light(
      primary: primaryColor,
      secondary: secondaryColor,
      error: errorColor,
      background: backgroundColor,
      surface: surfaceColor,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onError: Colors.white,
      onBackground: textPrimary,
      onSurface: textPrimary,
    ),
    textTheme: textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: surfaceColor,
      foregroundColor: textPrimary,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: textTheme.headlineMedium,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: const BorderSide(color: primaryColor),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: errorColor),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      filled: true,
      fillColor: Colors.white,
    ),
    cardTheme: CardTheme(
      color: cardColor,
      elevation: 2,
      shadowColor: Colors.black.withOpacity(0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    scaffoldBackgroundColor: backgroundColor,
  );

  // Dark Theme
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: primaryLight,
      secondary: secondaryColor,
      error: errorColor,
      background: Color(0xFF0F172A),
      surface: Color(0xFF1E293B),
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onError: Colors.white,
      onBackground: Colors.white,
      onSurface: Colors.white,
    ),
    textTheme: textTheme.apply(
      bodyColor: Colors.white,
      displayColor: Colors.white,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF1E293B),
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
    ),
    scaffoldBackgroundColor: const Color(0xFF0F172A),
  );
}
