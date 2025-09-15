import { NotificationService } from '../services/notificationService';
import RealTimeNotificationService from '../services/realTimeNotificationService';
import { 
  Notification, 
  NotificationPreferences, 
  NOTIFICATION_TYPES, 
  NOTIFICATION_PRIORITIES 
} from '../types/notifications';

export interface ValidationResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

export interface ValidationSuite {
  name: string;
  results: ValidationResult[];
  passed: boolean;
  duration: number;
}

export class NotificationValidator {
  private testUserId: string;
  private testUserType: 'patient' | 'clinic' | 'doctor';

  constructor(userId: string, userType: 'patient' | 'clinic' | 'doctor' = 'patient') {
    this.testUserId = userId;
    this.testUserType = userType;
  }

  /**
   * Run all validation tests
   */
  async runFullValidation(): Promise<ValidationSuite> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    // Test service availability
    results.push(...await this.testServiceAvailability());

    // Test notification CRUD operations
    results.push(...await this.testNotificationCRUD());

    // Test real-time functionality
    results.push(...await this.testRealTimeFeatures());

    // Test type definitions and constants
    results.push(...await this.testTypeDefinitions());

    // Test error handling
    results.push(...await this.testErrorHandling());

    const duration = Date.now() - startTime;
    const passed = results.every(r => r.passed);

    return {
      name: 'Full Notification System Validation',
      results,
      passed,
      duration
    };
  }

  /**
   * Test service availability
   */
  private async testServiceAvailability(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Test NotificationService
    try {
      const serviceExists = typeof NotificationService !== 'undefined';
      results.push({
        name: 'NotificationService Available',
        passed: serviceExists,
        message: serviceExists ? 'Service is available' : 'Service is not available'
      });

      if (serviceExists) {
        const methods = ['createNotification', 'getNotifications', 'markAsRead', 'deleteNotification'];
        methods.forEach(method => {
          const methodExists = typeof (NotificationService as any)[method] === 'function';
          results.push({
            name: `NotificationService.${method}`,
            passed: methodExists,
            message: methodExists ? `Method ${method} exists` : `Method ${method} missing`
          });
        });
      }
    } catch (error) {
      results.push({
        name: 'NotificationService Available',
        passed: false,
        message: `Error checking service: ${error}`
      });
    }

    // Test RealTimeNotificationService
    try {
      const realTimeServiceExists = typeof RealTimeNotificationService !== 'undefined';
      results.push({
        name: 'RealTimeNotificationService Available',
        passed: realTimeServiceExists,
        message: realTimeServiceExists ? 'Real-time service is available' : 'Real-time service is not available'
      });

      if (realTimeServiceExists) {
        const support = RealTimeNotificationService.isSupported();
        results.push({
          name: 'Real-time Support Check',
          passed: support.realTime,
          message: `Real-time support: ${support.realTime}`,
          details: support
        });
      }
    } catch (error) {
      results.push({
        name: 'RealTimeNotificationService Available',
        passed: false,
        message: `Error checking real-time service: ${error}`
      });
    }

    return results;
  }

  /**
   * Test notification CRUD operations
   */
  private async testNotificationCRUD(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    let createdNotificationId: string | null = null;

    // Test creating a notification
    try {
      const createResult = await NotificationService.createNotification({
        user_id: this.testUserId,
        user_type: this.testUserType,
        type: 'system',
        title: 'Validation Test Notification',
        message: 'This is a test notification for validation',
        priority: 'normal'
      });

      if (createResult.error) {
        results.push({
          name: 'Create Notification',
          passed: false,
          message: `Failed to create notification: ${createResult.error}`
        });
      } else {
        createdNotificationId = createResult.data?.id || null;
        results.push({
          name: 'Create Notification',
          passed: true,
          message: 'Successfully created test notification',
          details: { id: createdNotificationId }
        });
      }
    } catch (error) {
      results.push({
        name: 'Create Notification',
        passed: false,
        message: `Error creating notification: ${error}`
      });
    }

    // Test fetching notifications
    try {
      const fetchResult = await NotificationService.getNotifications(this.testUserId);
      
      if (fetchResult.error) {
        results.push({
          name: 'Fetch Notifications',
          passed: false,
          message: `Failed to fetch notifications: ${fetchResult.error}`
        });
      } else {
        const notifications = fetchResult.data || [];
        results.push({
          name: 'Fetch Notifications',
          passed: true,
          message: `Successfully fetched ${notifications.length} notifications`,
          details: { count: notifications.length }
        });

        // Check if our test notification is in the list
        if (createdNotificationId) {
          const testNotification = notifications.find(n => n.id === createdNotificationId);
          results.push({
            name: 'Find Created Notification',
            passed: !!testNotification,
            message: testNotification ? 'Found created notification in list' : 'Created notification not found in list'
          });
        }
      }
    } catch (error) {
      results.push({
        name: 'Fetch Notifications',
        passed: false,
        message: `Error fetching notifications: ${error}`
      });
    }

    // Test marking as read
    if (createdNotificationId) {
      try {
        const markReadResult = await NotificationService.markAsRead(createdNotificationId);
        
        results.push({
          name: 'Mark As Read',
          passed: !markReadResult.error,
          message: markReadResult.error ? `Failed to mark as read: ${markReadResult.error}` : 'Successfully marked notification as read'
        });
      } catch (error) {
        results.push({
          name: 'Mark As Read',
          passed: false,
          message: `Error marking as read: ${error}`
        });
      }
    }

    // Test deleting notification (cleanup)
    if (createdNotificationId) {
      try {
        const deleteResult = await NotificationService.deleteNotification(createdNotificationId);
        
        results.push({
          name: 'Delete Notification',
          passed: !deleteResult.error,
          message: deleteResult.error ? `Failed to delete notification: ${deleteResult.error}` : 'Successfully deleted test notification'
        });
      } catch (error) {
        results.push({
          name: 'Delete Notification',
          passed: false,
          message: `Error deleting notification: ${error}`
        });
      }
    }

    return results;
  }

  /**
   * Test real-time functionality
   */
  private async testRealTimeFeatures(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Test support detection
    try {
      const support = RealTimeNotificationService.isSupported();
      
      results.push({
        name: 'Real-time Support Detection',
        passed: true,
        message: 'Support detection working',
        details: support
      });

      results.push({
        name: 'Real-time Capability',
        passed: support.realTime,
        message: support.realTime ? 'Real-time is supported' : 'Real-time is not supported'
      });

      results.push({
        name: 'Audio Support',
        passed: support.audio,
        message: support.audio ? 'Audio is supported' : 'Audio is not supported'
      });
    } catch (error) {
      results.push({
        name: 'Real-time Support Detection',
        passed: false,
        message: `Error checking real-time support: ${error}`
      });
    }

    // Test permission status
    try {
      const permissions = RealTimeNotificationService.getPermissionStatus();
      
      results.push({
        name: 'Permission Status Check',
        passed: true,
        message: 'Permission status check working',
        details: permissions
      });
    } catch (error) {
      results.push({
        name: 'Permission Status Check',
        passed: false,
        message: `Error checking permissions: ${error}`
      });
    }

    // Test subscription management
    try {
      const subscriptionStatus = RealTimeNotificationService.getSubscriptionStatus();
      
      results.push({
        name: 'Subscription Status',
        passed: true,
        message: `Subscription status working (${subscriptionStatus.count} active)`,
        details: subscriptionStatus
      });
    } catch (error) {
      results.push({
        name: 'Subscription Status',
        passed: false,
        message: `Error checking subscription status: ${error}`
      });
    }

    return results;
  }

  /**
   * Test type definitions and constants
   */
  private async testTypeDefinitions(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Test NOTIFICATION_TYPES
    try {
      const typeKeys = Object.keys(NOTIFICATION_TYPES);
      results.push({
        name: 'Notification Types Defined',
        passed: typeKeys.length > 0,
        message: `${typeKeys.length} notification types defined`,
        details: typeKeys
      });

      // Check specific types
      const expectedTypes = ['appointment', 'review', 'system', 'medical', 'payment'];
      expectedTypes.forEach(type => {
        const hasType = typeKeys.some(key => NOTIFICATION_TYPES[key as keyof typeof NOTIFICATION_TYPES] === type);
        results.push({
          name: `Type '${type}' Available`,
          passed: hasType,
          message: hasType ? `Type '${type}' is defined` : `Type '${type}' is missing`
        });
      });
    } catch (error) {
      results.push({
        name: 'Notification Types Defined',
        passed: false,
        message: `Error checking notification types: ${error}`
      });
    }

    // Test NOTIFICATION_PRIORITIES
    try {
      const priorityKeys = Object.keys(NOTIFICATION_PRIORITIES);
      results.push({
        name: 'Notification Priorities Defined',
        passed: priorityKeys.length > 0,
        message: `${priorityKeys.length} notification priorities defined`,
        details: priorityKeys
      });

      // Check specific priorities
      const expectedPriorities = ['low', 'normal', 'high', 'urgent'];
      expectedPriorities.forEach(priority => {
        const hasPriority = priorityKeys.some(key => NOTIFICATION_PRIORITIES[key as keyof typeof NOTIFICATION_PRIORITIES] === priority);
        results.push({
          name: `Priority '${priority}' Available`,
          passed: hasPriority,
          message: hasPriority ? `Priority '${priority}' is defined` : `Priority '${priority}' is missing`
        });
      });
    } catch (error) {
      results.push({
        name: 'Notification Priorities Defined',
        passed: false,
        message: `Error checking notification priorities: ${error}`
      });
    }

    return results;
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Test invalid user ID
    try {
      const result = await NotificationService.getNotifications('invalid-user-id-123');
      
      // Should handle gracefully (either return empty array or proper error)
      results.push({
        name: 'Invalid User ID Handling',
        passed: true, // Any response is acceptable as long as it doesn't crash
        message: result.error ? `Properly returned error: ${result.error}` : `Returned ${result.data?.length || 0} notifications`
      });
    } catch (error) {
      results.push({
        name: 'Invalid User ID Handling',
        passed: false,
        message: `Unhandled error with invalid user ID: ${error}`
      });
    }

    // Test invalid notification creation
    try {
      const result = await NotificationService.createNotification({
        user_id: '', // Invalid empty user ID
        user_type: this.testUserType,
        type: 'invalid-type' as any,
        title: '',
        message: '',
        priority: 'invalid-priority' as any
      });

      results.push({
        name: 'Invalid Notification Data Handling',
        passed: !!result.error, // Should return an error
        message: result.error ? `Properly rejected invalid data: ${result.error}` : 'Should have rejected invalid data but did not'
      });
    } catch (error) {
      results.push({
        name: 'Invalid Notification Data Handling',
        passed: true, // Exception is also acceptable
        message: `Properly threw exception for invalid data: ${error}`
      });
    }

    return results;
  }

  /**
   * Run a quick validation (subset of tests)
   */
  async runQuickValidation(): Promise<ValidationSuite> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    // Quick service availability check
    results.push(...await this.testServiceAvailability());

    // Quick type definitions check
    results.push(...await this.testTypeDefinitions());

    const duration = Date.now() - startTime;
    const passed = results.every(r => r.passed);

    return {
      name: 'Quick Notification System Validation',
      results,
      passed,
      duration
    };
  }
}

export default NotificationValidator;