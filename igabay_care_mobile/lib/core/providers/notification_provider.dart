/// Notification provider that manages notification state
/// Simplified version without complex dependencies

import 'dart:async';
import '../models/notification.dart';

/// Simple callback type for listeners
typedef VoidCallback = void Function();

/// Simple debug print function
void debugPrint(String message) {
  print('[NotificationProvider] $message');
}

/// Simple notification result class
class NotificationResult {
  final List<AppNotification> notifications;
  final String? error;

  const NotificationResult({required this.notifications, this.error});
}

/// Simple count result class
class CountResult {
  final int count;
  final String? error;

  const CountResult({required this.count, this.error});
}

/// Simple boolean result class
class BooleanResult {
  final bool success;
  final String? error;

  const BooleanResult({required this.success, this.error});
}

/// Notification provider that manages notification state and operations
/// Equivalent to the React useNotifications hook
class NotificationProvider {
  List<AppNotification> _notifications = [];
  int _unreadCount = 0;
  bool _loading = false;
  String? _error;

  // Listener management
  final List<VoidCallback> _listeners = [];

  // Configuration options
  final bool autoRefresh;
  final Duration refreshInterval;
  final int limit;

  NotificationProvider({
    this.autoRefresh = true,
    this.refreshInterval = const Duration(seconds: 30),
    this.limit = 50,
  });

  // Listener management methods
  void addListener(VoidCallback listener) {
    _listeners.add(listener);
  }

  void removeListener(VoidCallback listener) {
    _listeners.remove(listener);
  }

  void notifyListeners() {
    for (final listener in _listeners) {
      try {
        listener();
      } catch (e) {
        debugPrint('Error in listener: $e');
      }
    }
  }

  void dispose() {
    _listeners.clear();
  }

  // Getters
  List<AppNotification> get notifications => List.unmodifiable(_notifications);
  int get unreadCount => _unreadCount;
  bool get loading => _loading;
  String? get error => _error;
  bool get hasUnread => _unreadCount > 0;

  List<AppNotification> get unreadNotifications =>
      _notifications.where((n) => !n.isRead).toList();

  /// Initialize notifications for a user
  Future<void> initialize(String userId) async {
    await fetchNotifications(userId);
  }

  /// Fetch notifications (simplified mock implementation)
  Future<void> fetchNotifications(String userId) async {
    if (userId.isEmpty) return;

    _setLoading(true);
    _setError(null);

    try {
      // Mock implementation - replace with actual service call
      await Future.delayed(const Duration(milliseconds: 500));

      // For now, create some mock notifications
      _notifications = _createMockNotifications(userId);
      _unreadCount = _notifications.where((n) => !n.isRead).length;

      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      _setError('Failed to fetch notifications');
    } finally {
      _setLoading(false);
    }
  }

  /// Mark a notification as read

  Future<void> markAsRead(String notificationId) async {
    try {
      // Find and update the notification
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1 && !_notifications[index].isRead) {
        _notifications[index] = _notifications[index].copyWith(isRead: true);
        _unreadCount = (_unreadCount - 1).clamp(0, double.infinity).toInt();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
      _setError('Failed to mark notification as read');
    }
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead(String userId) async {
    try {
      _notifications = _notifications
          .map((n) => n.copyWith(isRead: true))
          .toList();
      _unreadCount = 0;
      notifyListeners();
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
      _setError('Failed to mark all notifications as read');
    }
  }

  /// Dismiss (delete) a notification
  Future<void> dismiss(String notificationId) async {
    try {
      final dismissedNotification = _notifications.firstWhere(
        (n) => n.id == notificationId,
      );

      _notifications.removeWhere((n) => n.id == notificationId);

      if (!dismissedNotification.isRead) {
        _unreadCount = (_unreadCount - 1).clamp(0, double.infinity).toInt();
      }

      notifyListeners();
    } catch (e) {
      debugPrint('Error dismissing notification: $e');
      _setError('Failed to dismiss notification');
    }
  }

  /// Refresh notifications
  Future<void> refresh(String userId) async {
    await fetchNotifications(userId);
  }

  /// Get notifications by type
  List<AppNotification> getNotificationsByType(NotificationType type) {
    return _notifications.where((n) => n.type == type).toList();
  }

  /// Get notifications by priority
  List<AppNotification> getNotificationsByPriority(
    NotificationPriority priority,
  ) {
    return _notifications.where((n) => n.priority == priority).toList();
  }

  /// Get urgent notifications
  List<AppNotification> get urgentNotifications =>
      getNotificationsByPriority(NotificationPriority.urgent);

  /// Clear all notifications
  void clearAll() {
    _notifications.clear();
    _unreadCount = 0;
    _error = null;
    notifyListeners();
  }

  /// Set loading state
  void _setLoading(bool value) {
    if (_loading != value) {
      _loading = value;
      notifyListeners();
    }
  }

  /// Set error state
  void _setError(String? error) {
    if (_error != error) {
      _error = error;
      notifyListeners();
    }
  }

  /// Create mock notifications for testing
  List<AppNotification> _createMockNotifications(String userId) {
    final now = DateTime.now();

    return [
      AppNotification(
        id: '1',
        userId: userId,
        title: 'Appointment Reminder',
        message: 'Your appointment is scheduled for tomorrow at 2:00 PM',
        type: NotificationType.appointmentReminder,
        priority: NotificationPriority.high,
        isRead: false,
        createdAt: now.subtract(const Duration(hours: 1)),
      ),
      AppNotification(
        id: '2',
        userId: userId,
        title: 'Appointment Confirmed',
        message: 'Your appointment has been confirmed',
        type: NotificationType.appointmentConfirmed,
        priority: NotificationPriority.normal,
        isRead: true,
        createdAt: now.subtract(const Duration(hours: 6)),
      ),
      AppNotification(
        id: '3',
        userId: userId,
        title: 'Review Request',
        message: 'Please rate your recent visit',
        type: NotificationType.reviewRequest,
        priority: NotificationPriority.low,
        isRead: false,
        createdAt: now.subtract(const Duration(days: 1)),
      ),
    ];
  }
}
