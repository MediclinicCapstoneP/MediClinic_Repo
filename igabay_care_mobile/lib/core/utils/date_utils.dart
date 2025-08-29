/// Date and time utility functions for consistent formatting
/// across the application
///
/// This file provides date utilities for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:intl/intl.dart (replaced with CustomDateFormat class)
///
/// The custom implementations maintain API compatibility for future migration
/// back to real packages when the environment issues are resolved.

// Custom implementations to replace unavailable packages
// import 'package:intl/intl.dart'; // Replaced with CustomDateFormat

/// Custom DateFormat replacement for intl package
class DateFormat {
  final String pattern;

  DateFormat(this.pattern);

  /// Format a DateTime according to the pattern
  String format(DateTime dateTime) {
    return _formatDateTime(dateTime, pattern);
  }

  /// Parse a string into DateTime according to the pattern
  DateTime parse(String input) {
    return _parseDateTime(input, pattern);
  }

  /// Custom DateTime formatting implementation
  String _formatDateTime(DateTime dateTime, String pattern) {
    String result = pattern;

    // Year patterns
    result = result.replaceAll(
      'yyyy',
      dateTime.year.toString().padLeft(4, '0'),
    );
    result = result.replaceAll(
      'yy',
      (dateTime.year % 100).toString().padLeft(2, '0'),
    );

    // Month patterns
    result = result.replaceAll('MMMM', _getMonthName(dateTime.month));
    result = result.replaceAll('MMM', _getMonthAbbreviation(dateTime.month));
    result = result.replaceAll('MM', dateTime.month.toString().padLeft(2, '0'));
    result = result.replaceAll('M', dateTime.month.toString());

    // Day patterns
    result = result.replaceAll('EEEE', _getDayName(dateTime.weekday));
    result = result.replaceAll('EEE', _getDayAbbreviation(dateTime.weekday));
    result = result.replaceAll('dd', dateTime.day.toString().padLeft(2, '0'));
    result = result.replaceAll('d', dateTime.day.toString());

    // Hour patterns (24-hour)
    result = result.replaceAll('HH', dateTime.hour.toString().padLeft(2, '0'));
    result = result.replaceAll('H', dateTime.hour.toString());

    // Hour patterns (12-hour)
    final hour12 = dateTime.hour == 0
        ? 12
        : dateTime.hour > 12
        ? dateTime.hour - 12
        : dateTime.hour;
    result = result.replaceAll('hh', hour12.toString().padLeft(2, '0'));
    result = result.replaceAll('h', hour12.toString());

    // Minute patterns
    result = result.replaceAll(
      'mm',
      dateTime.minute.toString().padLeft(2, '0'),
    );
    result = result.replaceAll('m', dateTime.minute.toString());

    // Second patterns
    result = result.replaceAll(
      'ss',
      dateTime.second.toString().padLeft(2, '0'),
    );
    result = result.replaceAll('s', dateTime.second.toString());

    // AM/PM patterns
    result = result.replaceAll('a', dateTime.hour < 12 ? 'AM' : 'PM');

    return result;
  }

  /// Custom DateTime parsing implementation
  DateTime _parseDateTime(String input, String pattern) {
    // Simple parsing for basic patterns - extend as needed
    try {
      if (pattern == 'yyyy-MM-dd') {
        final parts = input.split('-');
        return DateTime(
          int.parse(parts[0]),
          int.parse(parts[1]),
          int.parse(parts[2]),
        );
      } else if (pattern == 'MM/dd/yyyy') {
        final parts = input.split('/');
        return DateTime(
          int.parse(parts[2]),
          int.parse(parts[0]),
          int.parse(parts[1]),
        );
      } else if (pattern == 'dd/MM/yyyy') {
        final parts = input.split('/');
        return DateTime(
          int.parse(parts[2]),
          int.parse(parts[1]),
          int.parse(parts[0]),
        );
      } else if (pattern.contains('MMM')) {
        // Handle abbreviated month names
        return _parseWithMonthName(input, pattern);
      }

      // Fallback to DateTime.parse for ISO formats
      return DateTime.parse(input);
    } catch (e) {
      throw FormatException('Invalid date format: $input');
    }
  }

  /// Parse dates with month names
  DateTime _parseWithMonthName(String input, String pattern) {
    final monthAbbr = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    for (int i = 0; i < monthAbbr.length; i++) {
      if (input.contains(monthAbbr[i])) {
        // Extract year and day - simple implementation
        final parts = input.split(' ');
        if (parts.length >= 3) {
          final day = int.parse(parts[1].replaceAll(',', ''));
          final year = int.parse(parts[2]);
          return DateTime(year, i + 1, day);
        }
      }
    }

    throw FormatException('Could not parse date with month name: $input');
  }

  /// Get full month name
  String _getMonthName(int month) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  }

  /// Get abbreviated month name
  String _getMonthAbbreviation(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month - 1];
  }

  /// Get full day name
  String _getDayName(int weekday) {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return days[weekday - 1];
  }

  /// Get abbreviated day name
  String _getDayAbbreviation(int weekday) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[weekday - 1];
  }
}

class DateUtils {
  /// Date formatters
  static final _dateFormatter = DateFormat('yyyy-MM-dd');
  static final _timeFormatter = DateFormat('HH:mm');
  static final _dateTimeFormatter = DateFormat('yyyy-MM-dd HH:mm');
  static final _displayDateFormatter = DateFormat('MMM dd, yyyy');
  static final _displayTimeFormatter = DateFormat('h:mm a');
  static final _displayDateTimeFormatter = DateFormat('MMM dd, yyyy h:mm a');
  static final _shortDateFormatter = DateFormat('MM/dd/yyyy');
  static final _fullDateFormatter = DateFormat('EEEE, MMMM dd, yyyy');
  static final _monthYearFormatter = DateFormat('MMMM yyyy');
  static final _dayMonthFormatter = DateFormat('dd MMM');

  /// Format date for API (ISO format)
  static String formatDateForApi(DateTime date) {
    return _dateFormatter.format(date);
  }

  /// Format time for API (HH:mm format)
  static String formatTimeForApi(DateTime time) {
    return _timeFormatter.format(time);
  }

  /// Format datetime for API (ISO format)
  static String formatDateTimeForApi(DateTime dateTime) {
    return _dateTimeFormatter.format(dateTime);
  }

  /// Format date for display (e.g., "Jan 15, 2024")
  static String formatDateForDisplay(DateTime date) {
    return _displayDateFormatter.format(date);
  }

  /// Format time for display (e.g., "2:30 PM")
  static String formatTimeForDisplay(DateTime time) {
    return _displayTimeFormatter.format(time);
  }

  /// Format datetime for display (e.g., "Jan 15, 2024 2:30 PM")
  static String formatDateTimeForDisplay(DateTime dateTime) {
    return _displayDateTimeFormatter.format(dateTime);
  }

  /// Format date as short format (e.g., "01/15/2024")
  static String formatShortDate(DateTime date) {
    return _shortDateFormatter.format(date);
  }

  /// Format date as full format (e.g., "Monday, January 15, 2024")
  static String formatFullDate(DateTime date) {
    return _fullDateFormatter.format(date);
  }

  /// Format month and year (e.g., "January 2024")
  static String formatMonthYear(DateTime date) {
    return _monthYearFormatter.format(date);
  }

  /// Format day and month (e.g., "15 Jan")
  static String formatDayMonth(DateTime date) {
    return _dayMonthFormatter.format(date);
  }

  /// Get relative time (e.g., "2 hours ago", "Tomorrow")
  static String getRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.isNegative) {
      // Future date
      final futureDiff = dateTime.difference(now);

      if (futureDiff.inMinutes < 60) {
        return 'In ${futureDiff.inMinutes} minutes';
      } else if (futureDiff.inHours < 24) {
        return 'In ${futureDiff.inHours} hours';
      } else if (futureDiff.inDays == 1) {
        return 'Tomorrow';
      } else if (futureDiff.inDays < 7) {
        return 'In ${futureDiff.inDays} days';
      } else {
        return formatDateForDisplay(dateTime);
      }
    } else {
      // Past date
      if (difference.inMinutes < 1) {
        return 'Just now';
      } else if (difference.inMinutes < 60) {
        return '${difference.inMinutes} minutes ago';
      } else if (difference.inHours < 24) {
        return '${difference.inHours} hours ago';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} days ago';
      } else {
        return formatDateForDisplay(dateTime);
      }
    }
  }

  /// Check if date is today
  static bool isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  /// Check if date is tomorrow
  static bool isTomorrow(DateTime date) {
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    return date.year == tomorrow.year &&
        date.month == tomorrow.month &&
        date.day == tomorrow.day;
  }

  /// Check if date is yesterday
  static bool isYesterday(DateTime date) {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return date.year == yesterday.year &&
        date.month == yesterday.month &&
        date.day == yesterday.day;
  }

  /// Check if date is in current week
  static bool isCurrentWeek(DateTime date) {
    final now = DateTime.now();
    final startOfWeek = now.subtract(Duration(days: now.weekday - 1));
    final endOfWeek = startOfWeek.add(const Duration(days: 6));

    return date.isAfter(startOfWeek.subtract(const Duration(days: 1))) &&
        date.isBefore(endOfWeek.add(const Duration(days: 1)));
  }

  /// Check if date is in current month
  static bool isCurrentMonth(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && date.month == now.month;
  }

  /// Get age from date of birth
  static int getAge(DateTime dateOfBirth) {
    final now = DateTime.now();
    int age = now.year - dateOfBirth.year;

    if (now.month < dateOfBirth.month ||
        (now.month == dateOfBirth.month && now.day < dateOfBirth.day)) {
      age--;
    }

    return age;
  }

  /// Get days until date
  static int getDaysUntil(DateTime date) {
    final now = DateTime.now();
    final startOfToday = DateTime(now.year, now.month, now.day);
    final startOfTargetDay = DateTime(date.year, date.month, date.day);

    return startOfTargetDay.difference(startOfToday).inDays;
  }

  /// Parse date from string (handles various formats)
  static DateTime? parseDate(String dateString) {
    try {
      // Try ISO format first
      return DateTime.parse(dateString);
    } catch (e) {
      // Try other common formats
      final formats = [
        'yyyy-MM-dd',
        'MM/dd/yyyy',
        'dd/MM/yyyy',
        'MMM dd, yyyy',
        'MMMM dd, yyyy',
      ];

      for (final format in formats) {
        try {
          return DateFormat(format).parse(dateString);
        } catch (e) {
          // Continue to next format
        }
      }
    }

    return null;
  }

  /// Get time slots for a day (every 30 minutes)
  static List<String> getTimeSlots({
    String startTime = '09:00',
    String endTime = '17:00',
    int intervalMinutes = 30,
  }) {
    final slots = <String>[];

    final startTimeParts = startTime.split(':');
    final endTimeParts = endTime.split(':');

    final start = DateTime(
      2024,
      1,
      1,
      int.parse(startTimeParts[0]),
      int.parse(startTimeParts[1]),
    );
    final end = DateTime(
      2024,
      1,
      1,
      int.parse(endTimeParts[0]),
      int.parse(endTimeParts[1]),
    );

    DateTime current = start;

    while (current.isBefore(end)) {
      slots.add(formatTimeForDisplay(current));
      current = current.add(Duration(minutes: intervalMinutes));
    }

    return slots;
  }

  /// Get working days between two dates (excluding weekends)
  static int getWorkingDaysBetween(DateTime start, DateTime end) {
    int workingDays = 0;
    DateTime current = start;

    while (current.isBefore(end) || current.isAtSameMomentAs(end)) {
      if (current.weekday != DateTime.saturday &&
          current.weekday != DateTime.sunday) {
        workingDays++;
      }
      current = current.add(const Duration(days: 1));
    }

    return workingDays;
  }

  /// Check if time is in business hours
  static bool isBusinessHours(
    DateTime dateTime, {
    int startHour = 9,
    int endHour = 17,
  }) {
    final hour = dateTime.hour;
    return hour >= startHour &&
        hour < endHour &&
        dateTime.weekday != DateTime.saturday &&
        dateTime.weekday != DateTime.sunday;
  }

  /// Get next business day
  static DateTime getNextBusinessDay(DateTime date) {
    DateTime nextDay = date.add(const Duration(days: 1));

    while (nextDay.weekday == DateTime.saturday ||
        nextDay.weekday == DateTime.sunday) {
      nextDay = nextDay.add(const Duration(days: 1));
    }

    return nextDay;
  }

  /// Format duration (e.g., "2h 30m")
  static String formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);

    if (hours > 0 && minutes > 0) {
      return '${hours}h ${minutes}m';
    } else if (hours > 0) {
      return '${hours}h';
    } else {
      return '${minutes}m';
    }
  }

  /// Get date range for a week
  static DateRange getWeekRange(DateTime date) {
    final startOfWeek = date.subtract(Duration(days: date.weekday - 1));
    final endOfWeek = startOfWeek.add(const Duration(days: 6));

    return DateRange(start: startOfWeek, end: endOfWeek);
  }

  /// Get date range for a month
  static DateRange getMonthRange(DateTime date) {
    final startOfMonth = DateTime(date.year, date.month, 1);
    final endOfMonth = DateTime(date.year, date.month + 1, 0);

    return DateRange(start: startOfMonth, end: endOfMonth);
  }
}

/// Date range class
class DateRange {
  final DateTime start;
  final DateTime end;

  const DateRange({required this.start, required this.end});

  /// Check if date is in range
  bool contains(DateTime date) {
    return date.isAfter(start.subtract(const Duration(days: 1))) &&
        date.isBefore(end.add(const Duration(days: 1)));
  }

  /// Get duration of the range
  Duration get duration => end.difference(start);

  /// Get number of days in range
  int get days => duration.inDays + 1;
}
