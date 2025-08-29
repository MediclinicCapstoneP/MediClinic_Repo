/// Notification Service Implementation
///
/// This file provides notification services for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:supabase_flutter/supabase_flutter.dart (replaced with MockSupabase classes)
///
/// The mock implementations maintain API compatibility for future migration
/// back to real packages when the environment issues are resolved.

// Custom implementations to replace unavailable packages
// import 'package:supabase_flutter/supabase_flutter.dart'; // Replaced with MockSupabase

/// Mock FetchOptions class
class FetchOptions {
  final CountOption? count;

  const FetchOptions({this.count});
}

/// Mock CountOption enum
enum CountOption { exact, planned, estimated }

/// Mock PostgresChangeEvent enum
enum PostgresChangeEvent { insert, update, delete }

/// Mock PostgresChangeFilterType enum
enum PostgresChangeFilterType { eq, neq, gt, gte, lt, lte }

/// Mock PostgresChangeFilter class
class PostgresChangeFilter {
  final PostgresChangeFilterType type;
  final String column;
  final dynamic value;

  const PostgresChangeFilter({
    required this.type,
    required this.column,
    required this.value,
  });
}

/// Mock RealtimePayload class
class RealtimePayload {
  final Map<String, dynamic> newRecord;
  final Map<String, dynamic>? oldRecord;

  const RealtimePayload({required this.newRecord, this.oldRecord});
}

/// Mock RealtimeChannel class
class RealtimeChannel {
  final String name;

  RealtimeChannel(this.name);

  RealtimeChannel onPostgresChanges({
    required PostgresChangeEvent event,
    required String schema,
    required String table,
    required PostgresChangeFilter filter,
    required void Function(RealtimePayload) callback,
  }) {
    print(
      '[MockRealtime] Subscribing to $event on $table where ${filter.column} ${filter.type.name} ${filter.value}',
    );
    // In a real implementation, this would set up the subscription
    return this;
  }

  RealtimeChannel subscribe() {
    print('[MockRealtime] Channel $name subscribed');
    return this;
  }

  void unsubscribe() {
    print('[MockRealtime] Channel $name unsubscribed');
  }
}

/// Mock Postgrest Query Builder for notifications
class MockNotificationQueryBuilder {
  final String tableName;
  final Map<String, dynamic> _filters = {};
  final List<String> _selectColumns = [];
  String? _orderColumn;
  bool _ascending = true;
  int? _limitValue;
  int? _rangeStart;
  int? _rangeEnd;
  bool _countExact = false;
  String? _orCondition;

  MockNotificationQueryBuilder(this.tableName);

  MockNotificationQueryBuilder select([String? columns]) {
    if (columns != null) {
      _selectColumns.clear();
      _selectColumns.addAll(columns.split(',').map((c) => c.trim()));
    }
    return this;
  }

  MockNotificationQueryBuilder selectWithOptions(
    String columns,
    FetchOptions options,
  ) {
    _selectColumns.clear();
    _selectColumns.addAll(columns.split(',').map((c) => c.trim()));
    if (options.count == CountOption.exact) {
      _countExact = true;
    }
    return this;
  }

  MockNotificationQueryBuilder eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  MockNotificationQueryBuilder order(String column, {bool ascending = true}) {
    _orderColumn = column;
    _ascending = ascending;
    return this;
  }

  MockNotificationQueryBuilder limit(int count) {
    _limitValue = count;
    return this;
  }

  MockNotificationQueryBuilder range(int start, int end) {
    _rangeStart = start;
    _rangeEnd = end;
    return this;
  }

  MockNotificationQueryBuilder or(String condition) {
    _orCondition = condition;
    return this;
  }

  Future<List<Map<String, dynamic>>> call() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockNotifications] Query on $tableName with filters: $_filters');

    // Generate mock notification data
    final mockData = _generateMockNotifications();

    // Apply filters
    var filteredData = mockData.where((item) {
      return _filters.entries.every((filter) {
        return item[filter.key] == filter.value;
      });
    }).toList();

    // Apply ordering
    if (_orderColumn != null) {
      filteredData.sort((a, b) {
        final valueA = a[_orderColumn!];
        final valueB = b[_orderColumn!];
        final comparison = valueA.toString().compareTo(valueB.toString());
        return _ascending ? comparison : -comparison;
      });
    }

    // Apply range/limit
    if (_rangeStart != null && _rangeEnd != null) {
      final start = _rangeStart!;
      final end = (_rangeEnd! + 1).clamp(0, filteredData.length);
      filteredData = filteredData.sublist(
        start.clamp(0, filteredData.length),
        end,
      );
    } else if (_limitValue != null) {
      filteredData = filteredData.take(_limitValue!).toList();
    }

    return filteredData;
  }

  Future<Map<String, dynamic>?> maybeSingle() async {
    final results = await call();
    return results.isNotEmpty ? results.first : null;
  }

  Future<Map<String, dynamic>> single() async {
    final results = await call();
    if (results.isEmpty) {
      throw Exception('No results found');
    }
    return results.first;
  }

  List<Map<String, dynamic>> _generateMockNotifications() {
    final now = DateTime.now();

    return [
      {
        'id': 'notification-1',
        'user_id': 'user-1',
        'appointment_id': 'appointment-1',
        'title': 'Appointment Confirmed',
        'message':
            'Your appointment has been confirmed for tomorrow at 10:00 AM',
        'type': 'appointment_confirmed',
        'priority': 'normal',
        'is_read': false,
        'action_url': '/appointments/appointment-1',
        'action_text': 'View Appointment',
        'metadata': {'appointment_time': '10:00'},
        'expires_at': now.add(const Duration(days: 7)).toIso8601String(),
        'created_at': now.subtract(const Duration(hours: 1)).toIso8601String(),
      },
      {
        'id': 'notification-2',
        'user_id': 'user-1',
        'appointment_id': null,
        'title': 'Welcome to IgabayCare',
        'message': 'Thank you for joining our platform',
        'type': 'system',
        'priority': 'low',
        'is_read': true,
        'action_url': null,
        'action_text': null,
        'metadata': null,
        'expires_at': null,
        'created_at': now.subtract(const Duration(days: 1)).toIso8601String(),
      },
    ];
  }

  int get length => _countExact ? _generateMockNotifications().length : 0;
}

/// Mock Postgrest Insert Builder
class MockNotificationInsertBuilder {
  final String tableName;
  final dynamic insertData;

  MockNotificationInsertBuilder(this.tableName, this.insertData);

  MockNotificationQueryBuilder select([String? columns]) {
    return MockNotificationQueryBuilder(tableName);
  }

  Future<Map<String, dynamic>> single() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockNotifications] INSERT into $tableName: $insertData');

    // Return inserted data with generated ID
    final result = Map<String, dynamic>.from(
      insertData as Map<String, dynamic>,
    );
    result['id'] = 'notification-${DateTime.now().millisecondsSinceEpoch}';
    result['created_at'] = DateTime.now().toIso8601String();

    return result;
  }
}

/// Mock Postgrest Update Builder
class MockNotificationUpdateBuilder {
  final String tableName;
  final Map<String, dynamic> updateData;
  final Map<String, dynamic> _filters = {};

  MockNotificationUpdateBuilder(this.tableName, this.updateData);

  MockNotificationUpdateBuilder eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  Future<void> call() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print(
      '[MockNotifications] UPDATE $tableName with filters $_filters: $updateData',
    );
  }
}

/// Mock Postgrest Delete Builder
class MockNotificationDeleteBuilder {
  final String tableName;
  final Map<String, dynamic> _filters = {};

  MockNotificationDeleteBuilder(this.tableName);

  MockNotificationDeleteBuilder eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  Future<void> call() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockNotifications] DELETE from $tableName with filters: $_filters');
  }
}

/// Mock Postgrest Upsert Builder
class MockNotificationUpsertBuilder {
  final String tableName;
  final dynamic upsertData;

  MockNotificationUpsertBuilder(this.tableName, this.upsertData);

  MockNotificationQueryBuilder select([String? columns]) {
    return MockNotificationQueryBuilder(tableName);
  }

  Future<Map<String, dynamic>> single() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockNotifications] UPSERT into $tableName: $upsertData');

    // Return upserted data
    final result = Map<String, dynamic>.from(
      upsertData as Map<String, dynamic>,
    );
    result['id'] =
        result['id'] ?? 'pref-${DateTime.now().millisecondsSinceEpoch}';
    result['updated_at'] = DateTime.now().toIso8601String();

    return result;
  }
}

/// Mock Supabase Client for notifications
class SupabaseClient {
  MockNotificationQueryBuilder from(String table) {
    return MockNotificationQueryBuilder(table);
  }

  MockNotificationInsertBuilder insert(String table, dynamic data) {
    return MockNotificationInsertBuilder(table, data);
  }

  MockNotificationUpdateBuilder update(
    String table,
    Map<String, dynamic> data,
  ) {
    return MockNotificationUpdateBuilder(table, data);
  }

  MockNotificationDeleteBuilder delete(String table) {
    return MockNotificationDeleteBuilder(table);
  }

  MockNotificationUpsertBuilder upsert(String table, dynamic data) {
    return MockNotificationUpsertBuilder(table, data);
  }

  RealtimeChannel channel(String name) {
    return RealtimeChannel(name);
  }
}

/// Mock Supabase singleton
class Supabase {
  static final Supabase _instance = Supabase._internal();
  static Supabase get instance => _instance;

  Supabase._internal();

  final SupabaseClient _client = SupabaseClient();
  SupabaseClient get client => _client;
}

// Notification models
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

  AppNotification({
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

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'appointment_id': appointmentId,
      'title': title,
      'message': message,
      'type': type.toString(),
      'priority': priority.toString(),
      'is_read': isRead,
      'action_url': actionUrl,
      'action_text': actionText,
      'metadata': metadata,
      'expires_at': expiresAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }
}

enum NotificationType {
  appointmentCompleted,
  appointmentReminder,
  appointmentConfirmed,
  appointmentCancelled,
  reviewRequest,
  system,
  medical,
  security;

  static NotificationType fromString(String type) {
    switch (type) {
      case 'appointment_completed':
        return NotificationType.appointmentCompleted;
      case 'appointment_reminder':
        return NotificationType.appointmentReminder;
      case 'appointment_confirmed':
        return NotificationType.appointmentConfirmed;
      case 'appointment_cancelled':
        return NotificationType.appointmentCancelled;
      case 'review_request':
        return NotificationType.reviewRequest;
      case 'system':
        return NotificationType.system;
      case 'medical':
        return NotificationType.medical;
      case 'security':
        return NotificationType.security;
      default:
        return NotificationType.system;
    }
  }

  @override
  String toString() {
    switch (this) {
      case NotificationType.appointmentCompleted:
        return 'appointment_completed';
      case NotificationType.appointmentReminder:
        return 'appointment_reminder';
      case NotificationType.appointmentConfirmed:
        return 'appointment_confirmed';
      case NotificationType.appointmentCancelled:
        return 'appointment_cancelled';
      case NotificationType.reviewRequest:
        return 'review_request';
      case NotificationType.system:
        return 'system';
      case NotificationType.medical:
        return 'medical';
      case NotificationType.security:
        return 'security';
    }
  }
}

enum NotificationPriority {
  low,
  normal,
  high,
  urgent;

  static NotificationPriority fromString(String priority) {
    switch (priority) {
      case 'low':
        return NotificationPriority.low;
      case 'normal':
        return NotificationPriority.normal;
      case 'high':
        return NotificationPriority.high;
      case 'urgent':
        return NotificationPriority.urgent;
      default:
        return NotificationPriority.normal;
    }
  }

  @override
  String toString() {
    return name;
  }
}

// Notification preferences model
class NotificationPreferences {
  final String id;
  final String userId;
  final bool emailAppointmentCompleted;
  final bool emailAppointmentReminder;
  final bool emailAppointmentConfirmed;
  final bool emailReviewRequest;
  final bool pushAppointmentCompleted;
  final bool pushAppointmentReminder;
  final bool pushAppointmentConfirmed;
  final bool pushReviewRequest;
  final bool smsAppointmentCompleted;
  final bool smsAppointmentReminder;
  final bool smsAppointmentConfirmed;
  final DateTime createdAt;
  final DateTime updatedAt;

  NotificationPreferences({
    required this.id,
    required this.userId,
    this.emailAppointmentCompleted = true,
    this.emailAppointmentReminder = true,
    this.emailAppointmentConfirmed = true,
    this.emailReviewRequest = true,
    this.pushAppointmentCompleted = true,
    this.pushAppointmentReminder = true,
    this.pushAppointmentConfirmed = true,
    this.pushReviewRequest = true,
    this.smsAppointmentCompleted = false,
    this.smsAppointmentReminder = false,
    this.smsAppointmentConfirmed = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    return NotificationPreferences(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      emailAppointmentCompleted:
          json['email_appointment_completed'] as bool? ?? true,
      emailAppointmentReminder:
          json['email_appointment_reminder'] as bool? ?? true,
      emailAppointmentConfirmed:
          json['email_appointment_confirmed'] as bool? ?? true,
      emailReviewRequest: json['email_review_request'] as bool? ?? true,
      pushAppointmentCompleted:
          json['push_appointment_completed'] as bool? ?? true,
      pushAppointmentReminder:
          json['push_appointment_reminder'] as bool? ?? true,
      pushAppointmentConfirmed:
          json['push_appointment_confirmed'] as bool? ?? true,
      pushReviewRequest: json['push_review_request'] as bool? ?? true,
      smsAppointmentCompleted:
          json['sms_appointment_completed'] as bool? ?? false,
      smsAppointmentReminder:
          json['sms_appointment_reminder'] as bool? ?? false,
      smsAppointmentConfirmed:
          json['sms_appointment_confirmed'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}

// Notification service
class NotificationService {
  final SupabaseClient _supabase = Supabase.instance.client;

  /// Get all notifications for a user
  Future<List<AppNotification>> getNotifications(
    String userId, {
    bool unreadOnly = false,
    int? limit,
    int? offset,
    NotificationType? type,
  }) async {
    try {
      var query = _supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      // Apply filters
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (type != null) {
        query = query.eq('type', type.toString());
      }

      if (limit != null) {
        query = query.limit(limit);
      }

      if (offset != null) {
        query = query.range(offset, offset + (limit ?? 10) - 1);
      }

      // Filter out expired notifications
      final now = DateTime.now().toIso8601String();
      query = query.or('expires_at.is.null,expires_at.gt.$now');

      final response = await query.call();

      return response.map((data) => AppNotification.fromJson(data)).toList();
    } catch (e) {
      throw Exception('Failed to fetch notifications: ${e.toString()}');
    }
  }

  /// Get unread notification count for a user
  Future<int> getUnreadCount(String userId) async {
    try {
      final query = _supabase
          .from('notifications')
          .selectWithOptions('*', const FetchOptions(count: CountOption.exact))
          .eq('user_id', userId)
          .eq('is_read', false);

      final response = await query.call();
      return response.length;
    } catch (e) {
      throw Exception('Failed to fetch unread count: ${e.toString()}');
    }
  }

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    try {
      await _supabase
          .update('notifications', {'is_read': true})
          .eq('id', notificationId)
          .call();
    } catch (e) {
      throw Exception('Failed to mark notification as read: ${e.toString()}');
    }
  }

  /// Mark all notifications as read for a user
  Future<void> markAllAsRead(String userId) async {
    try {
      await _supabase
          .update('notifications', {'is_read': true})
          .eq('user_id', userId)
          .eq('is_read', false)
          .call();
    } catch (e) {
      throw Exception(
        'Failed to mark all notifications as read: ${e.toString()}',
      );
    }
  }

  /// Create a new notification
  Future<AppNotification> createNotification({
    required String userId,
    String? appointmentId,
    required String title,
    required String message,
    required NotificationType type,
    NotificationPriority priority = NotificationPriority.normal,
    String? actionUrl,
    String? actionText,
    Map<String, dynamic>? metadata,
    DateTime? expiresAt,
  }) async {
    try {
      final data = {
        'user_id': userId,
        'appointment_id': appointmentId,
        'title': title,
        'message': message,
        'type': type.toString(),
        'priority': priority.toString(),
        'action_url': actionUrl,
        'action_text': actionText,
        'metadata': metadata,
        'expires_at': expiresAt?.toIso8601String(),
      };

      final response = await _supabase
          .insert('notifications', data)
          .select()
          .single();

      return AppNotification.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create notification: ${e.toString()}');
    }
  }

  /// Delete notification
  Future<void> deleteNotification(String notificationId) async {
    try {
      await _supabase.delete('notifications').eq('id', notificationId).call();
    } catch (e) {
      throw Exception('Failed to delete notification: ${e.toString()}');
    }
  }

  /// Get notification preferences for a user
  Future<NotificationPreferences?> getNotificationPreferences(
    String userId,
  ) async {
    try {
      final response = await _supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) {
        // Create default preferences if none exist
        return await _createDefaultPreferences(userId);
      }

      return NotificationPreferences.fromJson(response);
    } catch (e) {
      throw Exception(
        'Failed to fetch notification preferences: ${e.toString()}',
      );
    }
  }

  /// Update notification preferences for a user
  Future<NotificationPreferences> updateNotificationPreferences(
    String userId,
    Map<String, bool> preferences,
  ) async {
    try {
      final data = {'user_id': userId, ...preferences};

      final response = await _supabase
          .upsert('notification_preferences', data)
          .select()
          .single();

      return NotificationPreferences.fromJson(response);
    } catch (e) {
      throw Exception(
        'Failed to update notification preferences: ${e.toString()}',
      );
    }
  }

  /// Create default notification preferences
  Future<NotificationPreferences> _createDefaultPreferences(
    String userId,
  ) async {
    try {
      final data = {
        'user_id': userId,
        'email_appointment_completed': true,
        'email_appointment_reminder': true,
        'email_appointment_confirmed': true,
        'email_review_request': true,
        'push_appointment_completed': true,
        'push_appointment_reminder': true,
        'push_appointment_confirmed': true,
        'push_review_request': true,
        'sms_appointment_completed': false,
        'sms_appointment_reminder': false,
        'sms_appointment_confirmed': false,
      };

      final response = await _supabase
          .insert('notification_preferences', data)
          .select()
          .single();

      return NotificationPreferences.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create default preferences: ${e.toString()}');
    }
  }

  /// Subscribe to real-time notifications
  RealtimeChannel subscribeToNotifications(
    String userId,
    Function(AppNotification) onNotification,
  ) {
    final channel = _supabase
        .channel('notifications')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) {
            final notification = AppNotification.fromJson(payload.newRecord);
            onNotification(notification);
          },
        )
        .subscribe();

    return channel;
  }

  /// Check if user should receive a specific type of notification
  Future<bool> shouldReceiveNotification(
    String userId,
    NotificationType notificationType,
    String deliveryMethod, // 'email', 'push', 'sms'
  ) async {
    try {
      final preferences = await getNotificationPreferences(userId);
      if (preferences == null) return false;

      final prefKey = '${deliveryMethod}_${notificationType.toString()}';

      // Map to preference properties
      switch (prefKey) {
        case 'email_appointment_completed':
          return preferences.emailAppointmentCompleted;
        case 'email_appointment_reminder':
          return preferences.emailAppointmentReminder;
        case 'email_appointment_confirmed':
          return preferences.emailAppointmentConfirmed;
        case 'email_review_request':
          return preferences.emailReviewRequest;
        case 'push_appointment_completed':
          return preferences.pushAppointmentCompleted;
        case 'push_appointment_reminder':
          return preferences.pushAppointmentReminder;
        case 'push_appointment_confirmed':
          return preferences.pushAppointmentConfirmed;
        case 'push_review_request':
          return preferences.pushReviewRequest;
        case 'sms_appointment_completed':
          return preferences.smsAppointmentCompleted;
        case 'sms_appointment_reminder':
          return preferences.smsAppointmentReminder;
        case 'sms_appointment_confirmed':
          return preferences.smsAppointmentConfirmed;
        default:
          return false;
      }
    } catch (e) {
      return false;
    }
  }
}
