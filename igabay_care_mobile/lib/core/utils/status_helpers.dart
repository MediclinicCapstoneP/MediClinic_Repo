/// Status helper utilities for consistent status display and management
/// across the application
///
/// This file provides status utilities for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:flutter/material.dart (replaced with custom Material Design components)
///
/// The custom implementations maintain API compatibility for future migration
/// back to real packages when the environment issues are resolved.

// Custom implementations to replace unavailable packages
// import 'package:flutter/material.dart'; // Replaced with custom Material components

import '../models/appointment.dart';

/// Custom Color class to replace Flutter Material Color
class Color {
  final int value;

  const Color(this.value);

  /// Create color from ARGB values
  const Color.fromARGB(int a, int r, int g, int b)
    : value = (a << 24) | (r << 16) | (g << 8) | b;

  /// Create color from RGB values (full opacity)
  Color.fromRGBO(int r, int g, int b, double opacity)
    : value = ((opacity * 255).round() << 24) | (r << 16) | (g << 8) | b;

  /// Returns a new color with the given opacity
  Color withOpacity(double opacity) {
    return Color.fromARGB(
      (opacity * 255).round(),
      (value >> 16) & 0xFF,
      (value >> 8) & 0xFF,
      value & 0xFF,
    );
  }

  /// Subscript operator to get color variations
  Color? operator [](int index) {
    switch (index) {
      case 50:
        return withOpacity(0.1);
      case 100:
        return withOpacity(0.2);
      case 200:
        return withOpacity(0.3);
      case 300:
        return withOpacity(0.4);
      case 400:
        return withOpacity(0.5);
      case 500:
        return this;
      case 600:
        return withOpacity(0.7);
      case 700:
        return withOpacity(0.8);
      case 800:
        return withOpacity(0.9);
      case 900:
        return withOpacity(1.0);
      default:
        return null;
    }
  }
}

/// Custom Colors class to replace Flutter Material Colors
class Colors {
  static const Color blue = Color(0xFF2196F3);
  static const Color green = Color(0xFF4CAF50);
  static const Color orange = Color(0xFFFF9800);
  static const Color grey = Color(0xFF9E9E9E);
  static const Color red = Color(0xFFF44336);
  static const Color deepOrange = Color(0xFFFF5722);
  static const Color purple = Color(0xFF9C27B0);
}

/// Custom IconData class to replace Flutter Material IconData
class IconData {
  final int codePoint;
  final String? fontFamily;

  const IconData(this.codePoint, {this.fontFamily});

  @override
  String toString() =>
      'IconData(U+${codePoint.toRadixString(16).padLeft(5, '0').toUpperCase()})';
}

/// Custom Icons class to replace Flutter Material Icons
class Icons {
  // Status icons
  static const IconData schedule = IconData(0xe8b5);
  static const IconData check_circle = IconData(0xe86c);
  static const IconData timelapse = IconData(0xe8ce);
  static const IconData done = IconData(0xe876);
  static const IconData cancel = IconData(0xe5c9);
  static const IconData person_off = IconData(0xe510);
  static const IconData update = IconData(0xe923);

  // Type icons
  static const IconData chat = IconData(0xe0b7);
  static const IconData repeat = IconData(0xe040);
  static const IconData emergency = IconData(0xe1eb);
  static const IconData health_and_safety = IconData(0xe1d5);
  static const IconData medical_services = IconData(0xf0dc);
  static const IconData medical_information = IconData(0xf0da);
  static const IconData local_hospital = IconData(0xe548);
  static const IconData science = IconData(0xea4b);
  static const IconData camera_alt = IconData(0xe412);
  static const IconData vaccines = IconData(0xe138);
  static const IconData accessibility = IconData(0xe84e);
  static const IconData psychology = IconData(0xea4a);
  static const IconData emoji_emotions = IconData(0xea22);
  static const IconData visibility = IconData(0xe8f4);
  static const IconData more_horiz = IconData(0xe5d3);

  // Priority icons
  static const IconData keyboard_arrow_down = IconData(0xe313);
  static const IconData remove = IconData(0xe15b);
  static const IconData keyboard_arrow_up = IconData(0xe316);
  static const IconData priority_high = IconData(0xe645);
}

/// Custom EdgeInsets class for padding and margins
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

/// Custom BorderRadius class
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

  const BorderRadius.only({
    this.topLeft = 0,
    this.topRight = 0,
    this.bottomLeft = 0,
    this.bottomRight = 0,
  });
}

/// Custom Border class
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

  static Border all({
    Color color = const Color(0xFF000000),
    double width = 1.0,
  }) {
    final side = BorderSide(color: color, width: width);
    return Border(top: side, right: side, bottom: side, left: side);
  }
}

/// Custom BorderSide class
class BorderSide {
  final Color color;
  final double width;

  const BorderSide({this.color = const Color(0xFF000000), this.width = 1.0});

  static const BorderSide none = BorderSide(
    width: 0.0,
    color: Color(0x00000000),
  );
}

/// Custom BoxDecoration class
class BoxDecoration {
  final Color? color;
  final BorderRadius? borderRadius;
  final Border? border;

  const BoxDecoration({this.color, this.borderRadius, this.border});
}

/// Custom TextStyle class
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
}

/// Custom FontWeight enum
enum FontWeight {
  w100,
  w200,
  w300,
  w400, // normal
  w500, // medium
  w600,
  w700, // bold
  w800,
  w900;

  static const FontWeight normal = FontWeight.w400;
  static const FontWeight bold = FontWeight.w700;
}

/// Custom MainAxisSize enum
enum MainAxisSize { min, max }

/// Custom Widget base class
abstract class Widget {
  const Widget();
}

/// Custom Container widget
class Container extends Widget {
  final EdgeInsets? padding;
  final BoxDecoration? decoration;
  final Widget? child;
  final double? width;
  final double? height;

  const Container({
    this.padding,
    this.decoration,
    this.child,
    this.width,
    this.height,
  });
}

/// Custom Row widget
class Row extends Widget {
  final List<Widget> children;
  final MainAxisSize mainAxisSize;

  const Row({required this.children, this.mainAxisSize = MainAxisSize.max});
}

/// Custom Icon widget
class Icon extends Widget {
  final IconData icon;
  final double? size;
  final Color? color;

  const Icon(this.icon, {this.size, this.color});
}

/// Custom SizedBox widget
class SizedBox extends Widget {
  final double? width;
  final double? height;
  final Widget? child;

  const SizedBox({this.width, this.height, this.child});
}

/// Custom Text widget
class Text extends Widget {
  final String data;
  final TextStyle? style;

  const Text(this.data, {this.style});
}

/// Status helper class for appointments
class StatusHelpers {
  /// Get display text for appointment status
  static String getAppointmentStatusText(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.scheduled:
        return 'Scheduled';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.inProgress:
        return 'In Progress';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.noShow:
        return 'No Show';
      case AppointmentStatus.rescheduled:
        return 'Rescheduled';
    }
  }

  /// Get color for appointment status
  static Color getAppointmentStatusColor(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.scheduled:
        return Colors.blue;
      case AppointmentStatus.confirmed:
        return Colors.green;
      case AppointmentStatus.inProgress:
        return Colors.orange;
      case AppointmentStatus.completed:
        return Colors.grey;
      case AppointmentStatus.cancelled:
        return Colors.red;
      case AppointmentStatus.noShow:
        return Colors.deepOrange;
      case AppointmentStatus.rescheduled:
        return Colors.purple;
    }
  }

  /// Get icon for appointment status
  static IconData getAppointmentStatusIcon(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.scheduled:
        return Icons.schedule;
      case AppointmentStatus.confirmed:
        return Icons.check_circle;
      case AppointmentStatus.inProgress:
        return Icons.timelapse;
      case AppointmentStatus.completed:
        return Icons.done;
      case AppointmentStatus.cancelled:
        return Icons.cancel;
      case AppointmentStatus.noShow:
        return Icons.person_off;
      case AppointmentStatus.rescheduled:
        return Icons.update;
    }
  }

  /// Get display text for appointment type
  static String getAppointmentTypeText(AppointmentType type) {
    switch (type) {
      case AppointmentType.consultation:
        return 'Consultation';
      case AppointmentType.followUp:
        return 'Follow-up';
      case AppointmentType.emergency:
        return 'Emergency';
      case AppointmentType.routineCheckup:
        return 'Routine Checkup';
      case AppointmentType.specialistVisit:
        return 'Specialist Visit';
      case AppointmentType.procedure:
        return 'Procedure';
      case AppointmentType.surgery:
        return 'Surgery';
      case AppointmentType.labTest:
        return 'Lab Test';
      case AppointmentType.imaging:
        return 'Imaging';
      case AppointmentType.vaccination:
        return 'Vaccination';
      case AppointmentType.physicalTherapy:
        return 'Physical Therapy';
      case AppointmentType.mentalHealth:
        return 'Mental Health';
      case AppointmentType.dental:
        return 'Dental';
      case AppointmentType.vision:
        return 'Vision';
      case AppointmentType.other:
        return 'Other';
    }
  }

  /// Get icon for appointment type
  static IconData getAppointmentTypeIcon(AppointmentType type) {
    switch (type) {
      case AppointmentType.consultation:
        return Icons.chat;
      case AppointmentType.followUp:
        return Icons.repeat;
      case AppointmentType.emergency:
        return Icons.emergency;
      case AppointmentType.routineCheckup:
        return Icons.health_and_safety;
      case AppointmentType.specialistVisit:
        return Icons.medical_services;
      case AppointmentType.procedure:
        return Icons.medical_information;
      case AppointmentType.surgery:
        return Icons.local_hospital;
      case AppointmentType.labTest:
        return Icons.science;
      case AppointmentType.imaging:
        return Icons.camera_alt;
      case AppointmentType.vaccination:
        return Icons.vaccines;
      case AppointmentType.physicalTherapy:
        return Icons.accessibility;
      case AppointmentType.mentalHealth:
        return Icons.psychology;
      case AppointmentType.dental:
        return Icons.emoji_emotions;
      case AppointmentType.vision:
        return Icons.visibility;
      case AppointmentType.other:
        return Icons.more_horiz;
    }
  }

  /// Get display text for appointment priority
  static String getAppointmentPriorityText(AppointmentPriority priority) {
    switch (priority) {
      case AppointmentPriority.low:
        return 'Low';
      case AppointmentPriority.normal:
        return 'Normal';
      case AppointmentPriority.high:
        return 'High';
      case AppointmentPriority.urgent:
        return 'Urgent';
    }
  }

  /// Get color for appointment priority
  static Color getAppointmentPriorityColor(AppointmentPriority priority) {
    switch (priority) {
      case AppointmentPriority.low:
        return Colors.grey;
      case AppointmentPriority.normal:
        return Colors.blue;
      case AppointmentPriority.high:
        return Colors.orange;
      case AppointmentPriority.urgent:
        return Colors.red;
    }
  }

  /// Get icon for appointment priority
  static IconData getAppointmentPriorityIcon(AppointmentPriority priority) {
    switch (priority) {
      case AppointmentPriority.low:
        return Icons.keyboard_arrow_down;
      case AppointmentPriority.normal:
        return Icons.remove;
      case AppointmentPriority.high:
        return Icons.keyboard_arrow_up;
      case AppointmentPriority.urgent:
        return Icons.priority_high;
    }
  }

  /// Check if appointment can be cancelled
  static bool canCancelAppointment(AppointmentStatus status) {
    return status == AppointmentStatus.scheduled ||
        status == AppointmentStatus.confirmed;
  }

  /// Check if appointment can be rescheduled
  static bool canRescheduleAppointment(AppointmentStatus status) {
    return status == AppointmentStatus.scheduled ||
        status == AppointmentStatus.confirmed;
  }

  /// Check if appointment can be completed
  static bool canCompleteAppointment(AppointmentStatus status) {
    return status == AppointmentStatus.confirmed ||
        status == AppointmentStatus.inProgress;
  }

  /// Check if appointment can be started
  static bool canStartAppointment(AppointmentStatus status) {
    return status == AppointmentStatus.confirmed;
  }

  /// Check if appointment is active (in progress or confirmed for today)
  static bool isActiveAppointment(
    AppointmentStatus status,
    DateTime appointmentDate,
  ) {
    if (status == AppointmentStatus.inProgress) {
      return true;
    }

    if (status == AppointmentStatus.confirmed) {
      final now = DateTime.now();
      return appointmentDate.year == now.year &&
          appointmentDate.month == now.month &&
          appointmentDate.day == now.day;
    }

    return false;
  }

  /// Get next possible statuses for an appointment
  static List<AppointmentStatus> getNextPossibleStatuses(
    AppointmentStatus currentStatus,
  ) {
    switch (currentStatus) {
      case AppointmentStatus.scheduled:
        return [
          AppointmentStatus.confirmed,
          AppointmentStatus.cancelled,
          AppointmentStatus.rescheduled,
        ];
      case AppointmentStatus.confirmed:
        return [
          AppointmentStatus.inProgress,
          AppointmentStatus.completed,
          AppointmentStatus.cancelled,
          AppointmentStatus.noShow,
          AppointmentStatus.rescheduled,
        ];
      case AppointmentStatus.inProgress:
        return [AppointmentStatus.completed, AppointmentStatus.cancelled];
      case AppointmentStatus.completed:
      case AppointmentStatus.cancelled:
      case AppointmentStatus.noShow:
        return []; // Final states
      case AppointmentStatus.rescheduled:
        return [AppointmentStatus.scheduled, AppointmentStatus.cancelled];
    }
  }

  /// Get status badge widget
  static Widget getStatusBadge(AppointmentStatus status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: getAppointmentStatusColor(status).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: getAppointmentStatusColor(status).withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            getAppointmentStatusIcon(status),
            size: 14,
            color: getAppointmentStatusColor(status),
          ),
          const SizedBox(width: 4),
          Text(
            getAppointmentStatusText(status),
            style: TextStyle(
              color: getAppointmentStatusColor(status),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  /// Get priority badge widget
  static Widget getPriorityBadge(AppointmentPriority priority) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: getAppointmentPriorityColor(priority).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: getAppointmentPriorityColor(priority).withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            getAppointmentPriorityIcon(priority),
            size: 12,
            color: getAppointmentPriorityColor(priority),
          ),
          const SizedBox(width: 2),
          Text(
            getAppointmentPriorityText(priority),
            style: TextStyle(
              color: getAppointmentPriorityColor(priority),
              fontSize: 10,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  /// Get type badge widget
  static Widget getTypeBadge(AppointmentType type) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(getAppointmentTypeIcon(type), size: 14, color: Colors.grey[700]),
          const SizedBox(width: 4),
          Text(
            getAppointmentTypeText(type),
            style: TextStyle(
              color: Colors.grey[700],
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  /// Check if status indicates appointment is past
  static bool isAppointmentPast(AppointmentStatus status) {
    return status == AppointmentStatus.completed ||
        status == AppointmentStatus.cancelled ||
        status == AppointmentStatus.noShow;
  }

  /// Check if status indicates appointment is upcoming
  static bool isAppointmentUpcoming(AppointmentStatus status) {
    return status == AppointmentStatus.scheduled ||
        status == AppointmentStatus.confirmed;
  }

  /// Get status severity (for sorting/filtering)
  static int getStatusSeverity(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.inProgress:
        return 4;
      case AppointmentStatus.confirmed:
        return 3;
      case AppointmentStatus.scheduled:
        return 2;
      case AppointmentStatus.rescheduled:
        return 1;
      case AppointmentStatus.completed:
      case AppointmentStatus.cancelled:
      case AppointmentStatus.noShow:
        return 0;
    }
  }

  /// Get priority severity (for sorting/filtering)
  static int getPrioritySeverity(AppointmentPriority priority) {
    switch (priority) {
      case AppointmentPriority.urgent:
        return 4;
      case AppointmentPriority.high:
        return 3;
      case AppointmentPriority.normal:
        return 2;
      case AppointmentPriority.low:
        return 1;
    }
  }
}
