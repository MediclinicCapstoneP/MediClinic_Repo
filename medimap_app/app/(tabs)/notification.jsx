import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function NotificationScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    // Mock notifications - in production, fetch from your notification service
    const mockNotifications = [
      {
        id: '1',
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: 'Your appointment at Bogo Clinical Laboratory has been confirmed for tomorrow at 10:00 AM.',
        timestamp: new Date(Date.now() - 60000 * 30), // 30 minutes ago
        read: false,
        icon: 'checkmark-circle',
        color: '#4CAF50'
      },
      {
        id: '2',
        type: 'appointment_reminder',
        title: 'Appointment Reminder',
        message: 'Don\'t forget your appointment at iCare Medical Center tomorrow at 2:00 PM.',
        timestamp: new Date(Date.now() - 60000 * 60 * 2), // 2 hours ago
        read: false,
        icon: 'time',
        color: '#FF9800'
      },
      {
        id: '3',
        type: 'payment_success',
        title: 'Payment Successful',
        message: 'Your payment of ₱500 for consultation has been processed successfully.',
        timestamp: new Date(Date.now() - 60000 * 60 * 24), // 1 day ago
        read: true,
        icon: 'card',
        color: '#2196F3'
      },
      {
        id: '4',
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: 'Your appointment at St. Gabriel Clinic has been cancelled. Refund will be processed within 3-5 business days.',
        timestamp: new Date(Date.now() - 60000 * 60 * 24 * 2), // 2 days ago
        read: true,
        icon: 'close-circle',
        color: '#F44336'
      }
    ];

    setNotifications(mockNotifications);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadNotifications();
      setRefreshing(false);
    }, 1000);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={item.icon} 
              size={24} 
              color={item.color}
            />
          </View>
          <View style={styles.notificationText}>
            <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
              {item.title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={3}>
              {item.message}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="notifications" size={20} color="#1a4fb4" />
          <Text style={styles.unreadText}>
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No notifications</Text>
          <Text style={styles.emptyStateSubtitle}>
            You'll see appointment updates and important messages here
          </Text>
        </View>
      )}

      {/* Floating AI Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllRead: {
    color: '#1a4fb4',
    fontSize: 14,
    fontWeight: '600',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#bbdefb',
  },
  unreadText: {
    marginLeft: 10,
    color: '#1a4fb4',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#1a4fb4',
    backgroundColor: '#fafbff',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  notificationHeader: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#1a4fb4',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a4fb4',
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1a4fb4',
    borderRadius: 35,
    padding: 15,
    elevation: 5,
  },
});
