/**
 * Notifications Service for Shadow-Bind
 * Handles push notifications, service worker management, and notification sync
 */

import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Notifications configuration
 */
export const NOTIFICATIONS_CONFIG = {
  // VAPID configuration (TODO: Replace with actual keys)
  VAPID_KEYS: {
    public: 'your-vapid-public-key-here',
    private: 'your-vapid-private-key-here'
  },
  
  // Notification categories
  CATEGORIES: {
    MESSAGE: 'message',
    GROUP_INVITE: 'group_invite',
    MENTION: 'mention',
    FILE_SHARE: 'file_share',
    SYSTEM: 'system',
    SECURITY: 'security'
  },
  
  // Priority levels
  PRIORITY: {
    HIGH: 'high',
    NORMAL: 'normal',
    LOW: 'low'
  },
  
  // Batch settings
  BATCH_SIZE: 10,
  BATCH_DELAY: 5000, // 5 seconds
  
  // Default notification options
  DEFAULT_OPTIONS: {
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    silent: false
  }
};

/**
 * Notifications Service Class
 */
export class NotificationsService {
  constructor() {
    this.isInitialized = false;
    this.subscription = null;
    this.batchQueue = [];
    this.batchTimer = null;
    this.notificationHistory = [];
    this.preferences = null;
  }

  /**
   * Initialize notification service
   * @returns {Promise<boolean>} - Success status
   */
  async initialize() {
    try {
      // Check if notifications are supported
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.warn('Notifications not supported in this browser');
        return false;
      }

      // Register service worker
      await this.registerServiceWorker();
      
      // Load user preferences
      await this.loadPreferences();
      
      // Request notification permission if needed
      const permission = await this.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        await this.subscribeToPush();
      }

      this.isInitialized = true;
      console.log('🔔 Notifications service initialized');
      
      return true;
    } catch (error) {
      console.error('Notification initialization error:', error);
      return false;
    }
  }

  /**
   * Register service worker for notifications
   * @returns {Promise<ServiceWorkerRegistration>}
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw-notifications.js');
      console.log('📡 Notification service worker registered');
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Request notification permission
   * @returns {Promise<string>} - Permission status
   */
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      console.log(`🔔 Notification permission: ${permission}`);
      return permission;
    } catch (error) {
      console.error('Permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   * @returns {Promise<PushSubscription>}
   */
  async subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        throw new Error('Service worker not registered');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(NOTIFICATIONS_CONFIG.VAPID_KEYS.public)
      });

      this.subscription = subscription;

      // Save subscription to server
      await this.saveSubscription(subscription);
      
      console.log('📱 Push subscription created');
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  /**
   * Send notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<boolean>} - Success status
   */
  async sendNotification(notificationData) {
    try {
      const {
        title,
        body,
        category = NOTIFICATIONS_CONFIG.CATEGORIES.MESSAGE,
        priority = NOTIFICATIONS_CONFIG.PRIORITY.NORMAL,
        data = {},
        actions = [],
        image = null,
        userId = null
      } = notificationData;

      // Check user preferences
      if (!(await this.shouldSendNotification(category, priority, userId))) {
        return false;
      }

      // Create notification object
      const notification = {
        title,
        body,
        category,
        priority,
        data,
        actions,
        image,
        userId,
        timestamp: Date.now(),
        id: this.generateNotificationId(),
        options: {
          ...NOTIFICATIONS_CONFIG.DEFAULT_OPTIONS,
          body,
          data: {
            ...data,
            category,
            priority,
            timestamp: Date.now()
          },
          actions,
          image,
          tag: `${category}_${userId || 'system'}`,
          renotify: priority === NOTIFICATIONS_CONFIG.PRIORITY.HIGH
        }
      };

      // Handle notification based on priority
      if (priority === NOTIFICATIONS_CONFIG.PRIORITY.HIGH) {
        await this.sendImmediateNotification(notification);
      } else {
        await this.addToBatch(notification);
      }

      // Save to history
      this.notificationHistory.push(notification);
      await this.saveNotificationHistory(notification);

      return true;
    } catch (error) {
      console.error('Send notification error:', error);
      return false;
    }
  }

  /**
   * Send immediate notification
   * @param {Object} notification - Notification object
   * @returns {Promise<void>}
   */
  async sendImmediateNotification(notification) {
    try {
      // Send via service worker if available
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && registration.active) {
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          notification
        });
      } else {
        // Fallback to direct notification
        await this.showDirectNotification(notification);
      }
    } catch (error) {
      console.error('Immediate notification error:', error);
      // Fallback to direct notification
      await this.showDirectNotification(notification);
    }
  }

  /**
   * Show direct notification
   * @param {Object} notification - Notification object
   * @returns {Promise<void>}
   */
  async showDirectNotification(notification) {
    if (Notification.permission === 'granted') {
      const notif = new Notification(notification.title, notification.options);
      
      // Handle notification click
      notif.onclick = () => {
        this.handleNotificationClick(notification);
        notif.close();
      };
    }
  }

  /**
   * Add notification to batch queue
   * @param {Object} notification - Notification object
   * @returns {Promise<void>}
   */
  async addToBatch(notification) {
    this.batchQueue.push(notification);
    
    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, NOTIFICATIONS_CONFIG.BATCH_DELAY);
    }
    
    // Process batch if it reaches max size
    if (this.batchQueue.length >= NOTIFICATIONS_CONFIG.BATCH_SIZE) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
      await this.processBatch();
    }
  }

  /**
   * Process batched notifications
   * @returns {Promise<void>}
   */
  async processBatch() {
    if (this.batchQueue.length === 0) {
      return;
    }

    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimer = null;

    try {
      // Group notifications by category
      const grouped = this.groupNotifications(batch);
      
      // Send grouped notifications
      for (const [category, notifications] of grouped) {
        await this.sendGroupedNotification(category, notifications);
      }
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }

  /**
   * Group notifications by category
   * @param {Array} notifications - Notifications to group
   * @returns {Map} - Grouped notifications
   */
  groupNotifications(notifications) {
    const grouped = new Map();
    
    notifications.forEach(notification => {
      const category = notification.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category).push(notification);
    });
    
    return grouped;
  }

  /**
   * Send grouped notification
   * @param {string} category - Notification category
   * @param {Array} notifications - Notifications in group
   * @returns {Promise<void>}
   */
  async sendGroupedNotification(category, notifications) {
    const count = notifications.length;
    
    if (count === 1) {
      await this.sendImmediateNotification(notifications[0]);
      return;
    }

    // Create summary notification
    const summaryNotification = {
      title: this.getCategoryTitle(category),
      body: `${count} new ${category} notifications`,
      category,
      priority: NOTIFICATIONS_CONFIG.PRIORITY.NORMAL,
      data: {
        type: 'summary',
        category,
        count,
        notifications: notifications.map(n => n.id)
      },
      options: {
        ...NOTIFICATIONS_CONFIG.DEFAULT_OPTIONS,
        body: `${count} new ${category} notifications`,
        tag: `${category}_summary`,
        data: {
          type: 'summary',
          category,
          notifications: notifications.map(n => n.id)
        }
      }
    };

    await this.sendImmediateNotification(summaryNotification);
  }

  /**
   * Handle notification click
   * @param {Object} notification - Clicked notification
   * @returns {void}
   */
  handleNotificationClick(notification) {
    // Focus window
    if (window.focus) {
      window.focus();
    }
    
    // Navigate to relevant page based on category
    const { category, data } = notification;
    
    switch (category) {
      case NOTIFICATIONS_CONFIG.CATEGORIES.MESSAGE:
        if (data.groupId) {
          window.location.href = `/groups/${data.groupId}`;
        } else if (data.chatId) {
          window.location.href = `/chat/${data.chatId}`;
        }
        break;
        
      case NOTIFICATIONS_CONFIG.CATEGORIES.GROUP_INVITE:
        window.location.href = `/groups/${data.groupId}`;
        break;
        
      case NOTIFICATIONS_CONFIG.CATEGORIES.MENTION:
        window.location.href = `/groups/${data.groupId}?message=${data.messageId}`;
        break;
        
      default:
        window.location.href = '/notifications';
    }
    
    // Mark notification as read
    this.markAsRead(notification.id);
  }

  /**
   * Schedule notification
   * @param {Object} notificationData - Notification data
   * @param {Date} scheduleTime - When to send
   * @returns {Promise<string>} - Scheduled notification ID
   */
  async scheduleNotification(notificationData, scheduleTime) {
    try {
      const scheduledNotification = {
        ...notificationData,
        scheduledFor: scheduleTime.toISOString(),
        status: 'scheduled',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'scheduledNotifications'), scheduledNotification);
      console.log(`📅 Notification scheduled for ${scheduleTime}`);
      
      return docRef.id;
    } catch (error) {
      console.error('Schedule notification error:', error);
      throw error;
    }
  }

  /**
   * Get notification history
   * @param {number} limit - Number of notifications to get
   * @returns {Promise<Array>} - Notification history
   */
  async getNotificationHistory(limit = 50) {
    try {
      // TODO: Implement server-side history retrieval
      // For now, return in-memory history
      return this.notificationHistory.slice(-limit);
    } catch (error) {
      console.error('Get notification history error:', error);
      return [];
    }
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - New preferences
   * @returns {Promise<boolean>} - Success status
   */
  async updatePreferences(preferences) {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      
      // TODO: Save to server
      console.log('⚙️ Notification preferences updated');
      
      return true;
    } catch (error) {
      console.error('Update preferences error:', error);
      return false;
    }
  }

  /**
   * Clear all notifications
   * @returns {Promise<boolean>} - Success status
   */
  async clearAllNotifications() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        const notifications = await registration.getNotifications();
        notifications.forEach(notification => notification.close());
      }
      
      console.log('🧹 All notifications cleared');
      return true;
    } catch (error) {
      console.error('Clear notifications error:', error);
      return false;
    }
  }

  // Private helper methods

  /**
   * Check if notification should be sent based on preferences
   * @param {string} category - Notification category
   * @param {string} priority - Notification priority
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Should send
   */
  async shouldSendNotification(category, priority, userId) {
    if (!this.preferences) {
      return true; // Default to sending if no preferences
    }
    
    // Check if category is enabled
    if (this.preferences.categories && !this.preferences.categories[category]) {
      return false;
    }
    
    // Check do not disturb
    if (this.preferences.doNotDisturb && this.isDoNotDisturbTime()) {
      return priority === NOTIFICATIONS_CONFIG.PRIORITY.HIGH;
    }
    
    return true;
  }

  /**
   * Check if current time is in do not disturb period
   * @returns {boolean} - Is DND time
   */
  isDoNotDisturbTime() {
    if (!this.preferences?.doNotDisturbSchedule) {
      return false;
    }
    
    const now = new Date();
    const hour = now.getHours();
    const { start, end } = this.preferences.doNotDisturbSchedule;
    
    if (start <= end) {
      return hour >= start && hour < end;
    } else {
      return hour >= start || hour < end;
    }
  }

  /**
   * Generate unique notification ID
   * @returns {string} - Notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get category display title
   * @param {string} category - Category
   * @returns {string} - Display title
   */
  getCategoryTitle(category) {
    const titles = {
      [NOTIFICATIONS_CONFIG.CATEGORIES.MESSAGE]: 'New Messages',
      [NOTIFICATIONS_CONFIG.CATEGORIES.GROUP_INVITE]: 'Group Invitations',
      [NOTIFICATIONS_CONFIG.CATEGORIES.MENTION]: 'Mentions',
      [NOTIFICATIONS_CONFIG.CATEGORIES.FILE_SHARE]: 'File Shares',
      [NOTIFICATIONS_CONFIG.CATEGORIES.SYSTEM]: 'System Notifications',
      [NOTIFICATIONS_CONFIG.CATEGORIES.SECURITY]: 'Security Alerts'
    };
    
    return titles[category] || 'Notifications';
  }

  /**
   * Convert VAPID key to Uint8Array
   * @param {string} base64String - Base64 VAPID key
   * @returns {Uint8Array} - Uint8Array key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Save subscription to server
   * @param {PushSubscription} subscription - Push subscription
   * @returns {Promise<void>}
   */
  async saveSubscription(subscription) {
    try {
      // TODO: Save to Firestore
      console.log('💾 Push subscription saved (placeholder)');
    } catch (error) {
      console.error('Save subscription error:', error);
    }
  }

  /**
   * Load user preferences
   * @returns {Promise<void>}
   */
  async loadPreferences() {
    try {
      // TODO: Load from Firestore
      this.preferences = {
        categories: {
          [NOTIFICATIONS_CONFIG.CATEGORIES.MESSAGE]: true,
          [NOTIFICATIONS_CONFIG.CATEGORIES.GROUP_INVITE]: true,
          [NOTIFICATIONS_CONFIG.CATEGORIES.MENTION]: true,
          [NOTIFICATIONS_CONFIG.CATEGORIES.FILE_SHARE]: true,
          [NOTIFICATIONS_CONFIG.CATEGORIES.SYSTEM]: true,
          [NOTIFICATIONS_CONFIG.CATEGORIES.SECURITY]: true
        },
        doNotDisturb: false,
        doNotDisturbSchedule: {
          start: 22, // 10 PM
          end: 8     // 8 AM
        }
      };
    } catch (error) {
      console.error('Load preferences error:', error);
    }
  }

  /**
   * Save notification to history
   * @param {Object} notification - Notification to save
   * @returns {Promise<void>}
   */
  async saveNotificationHistory(notification) {
    try {
      // TODO: Save to Firestore
      console.log('💾 Notification saved to history (placeholder)');
    } catch (error) {
      console.error('Save notification history error:', error);
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async markAsRead(notificationId) {
    try {
      // TODO: Update in Firestore
      console.log(`✅ Notification ${notificationId} marked as read (placeholder)`);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }
}

// Global notifications service instance
export const notificationsService = new NotificationsService();

/**
 * Initialize notifications for the application
 * @returns {Promise<boolean>} - Success status
 */
export async function initializeNotifications() {
  return notificationsService.initialize();
}

/**
 * Send notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<boolean>} - Success status
 */
export async function sendNotification(notificationData) {
  return notificationsService.sendNotification(notificationData);
}

/**
 * Schedule notification
 * @param {Object} notificationData - Notification data
 * @param {Date} scheduleTime - When to send
 * @returns {Promise<string>} - Scheduled notification ID
 */
export async function scheduleNotification(notificationData, scheduleTime) {
  return notificationsService.scheduleNotification(notificationData, scheduleTime);
}

/**
 * Update notification preferences
 * @param {Object} preferences - New preferences
 * @returns {Promise<boolean>} - Success status
 */
export async function updateNotificationPreferences(preferences) {
  return notificationsService.updatePreferences(preferences);
}