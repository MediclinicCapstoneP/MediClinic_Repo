/// Notification types enum
enum NotificationType {
  appointmentCompleted('appointment_completed'),
  appointmentReminder('appointment_reminder'),
  appointmentConfirmed('appointment_confirmed'),
  appointmentCancelled('appointment_cancelled'),
  reviewRequest('review_request'),
  system('system'),
  medical('medical'),
  security('security');

  const NotificationType(this.value);
  final String value;

  static NotificationType fromString(String value) {
    return NotificationType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => NotificationType.system,
    );
  }
}

/// Notification priority enum
enum NotificationPriority {
  low('low'),
  normal('normal'),
  high('high'),
  urgent('urgent');

  const NotificationPriority(this.value);
  final String value;

  static NotificationPriority fromString(String value) {
    return NotificationPriority.values.firstWhere(
      (e) => e.value == value,
      orElse: () => NotificationPriority.normal,
    );
  }
}

/// Main notification model
class AppNotification {
  final String id;
  final String userId;
  final String? appointmentId;
  final String title;
  final String message;
  final NotificationType type;
  final NotificationPriority priority;
  final bool isRead;
  final String? actionUrl;
  final String? actionText;
  final Map<String, dynamic>? metadata;
  final DateTime? expiresAt;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.userId,
    this.appointmentId,
    required this.title,
    required this.message,
    required this.type,
    this.priority = NotificationPriority.normal,
    this.isRead = false,
    this.actionUrl,
    this.actionText,
    this.metadata,
    this.expiresAt,
    required this.createdAt,
  });

  /// Create from JSON
  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      appointmentId: json['appointment_id'] as String?,
      title: json['title'] as String,
      message: json['message'] as String,
      type: NotificationType.fromString(json['type'] as String),
      priority: NotificationPriority.fromString(
        json['priority'] as String? ?? 'normal',
      ),
      isRead: json['is_read'] as bool? ?? false,
      actionUrl: json['action_url'] as String?,
      actionText: json['action_text'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'appointment_id': appointmentId,
      'title': title,
      'message': message,
      'type': type.value,
      'priority': priority.value,
      'is_read': isRead,
      'action_url': actionUrl,
      'action_text': actionText,
      'metadata': metadata,
      'expires_at': expiresAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }

  /// Copy with new values
  AppNotification copyWith({
    String? id,
    String? userId,
    String? appointmentId,
    String? title,
    String? message,
    NotificationType? type,
    NotificationPriority? priority,
    bool? isRead,
    String? actionUrl,
    String? actionText,
    Map<String, dynamic>? metadata,
    DateTime? expiresAt,
    DateTime? createdAt,
  }) {
    return AppNotification(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      appointmentId: appointmentId ?? this.appointmentId,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      priority: priority ?? this.priority,
      isRead: isRead ?? this.isRead,
      actionUrl: actionUrl ?? this.actionUrl,
      actionText: actionText ?? this.actionText,
      metadata: metadata ?? this.metadata,
      expiresAt: expiresAt ?? this.expiresAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Check if notification is expired
  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);

  /// Check if notification is urgent
  bool get isUrgent => priority == NotificationPriority.urgent;

  /// Check if notification is high priority
  bool get isHighPriority => priority == NotificationPriority.high || isUrgent;

  /// Get display text for notification type
  String get typeDisplayText {
    switch (type) {
      case NotificationType.appointmentCompleted:
        return 'Appointment Completed';
      case NotificationType.appointmentReminder:
        return 'Appointment Reminder';
      case NotificationType.appointmentConfirmed:
        return 'Appointment Confirmed';
      case NotificationType.appointmentCancelled:
        return 'Appointment Cancelled';
      case NotificationType.reviewRequest:
        return 'Review Request';
      case NotificationType.system:
        return 'System';
      case NotificationType.medical:
        return 'Medical';
      case NotificationType.security:
        return 'Security';
    }
  }

  /// Get display text for notification priority
  String get priorityDisplayText {
    switch (priority) {
      case NotificationPriority.low:
        return 'Low';
      case NotificationPriority.normal:
        return 'Normal';
      case NotificationPriority.high:
        return 'High';
      case NotificationPriority.urgent:
        return 'Urgent';
    }
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is AppNotification && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

/// Parameters for creating a notification
class CreateNotificationParams {
  final String userId;
  final String? appointmentId;
  final String title;
  final String message;
  final NotificationType type;
  final NotificationPriority priority;
  final String? actionUrl;
  final String? actionText;
  final Map<String, dynamic>? metadata;
  final DateTime? expiresAt;

  const CreateNotificationParams({
    required this.userId,
    this.appointmentId,
    required this.title,
    required this.message,
    required this.type,
    this.priority = NotificationPriority.normal,
    this.actionUrl,
    this.actionText,
    this.metadata,
    this.expiresAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'appointment_id': appointmentId,
      'title': title,
      'message': message,
      'type': type.value,
      'priority': priority.value,
      'action_url': actionUrl,
      'action_text': actionText,
      'metadata': metadata,
      'expires_at': expiresAt?.toIso8601String(),
    };
  }
}
