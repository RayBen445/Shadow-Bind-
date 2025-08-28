/**
 * Notification Service Worker for Shadow-Bind
 * Handles push notifications, background sync, and notification management
 */

const SW_VERSION = '1.0.0';
const CACHE_NAME = `shadow-bind-notifications-v${SW_VERSION}`;

// Import notification service configuration (if available)
const NOTIFICATIONS_CONFIG = {
  CATEGORIES: {
    MESSAGE: 'message',
    GROUP_INVITE: 'group_invite',
    MENTION: 'mention',
    FILE_SHARE: 'file_share',
    SYSTEM: 'system',
    SECURITY: 'security'
  },
  DEFAULT_OPTIONS: {
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    silent: false
  }
};

/**
 * Install event - Set up service worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing notification service worker v' + SW_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/icon-192x192.png',
        '/badge-72x72.png'
      ]).catch((error) => {
        console.warn('[SW] Cache addAll failed:', error);
      });
    })
  );
  
  // Force immediate activation
  self.skipWaiting();
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating notification service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('shadow-bind-notifications-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

/**
 * Push event - Handle incoming push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) {
    console.warn('[SW] Push event has no data');
    return;
  }
  
  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('[SW] Failed to parse push data:', error);
    return;
  }
  
  event.waitUntil(
    handlePushNotification(notificationData)
  );
});

/**
 * Handle push notification data
 * @param {Object} data - Notification data
 */
async function handlePushNotification(data) {
  try {
    const {
      title,
      body,
      category = NOTIFICATIONS_CONFIG.CATEGORIES.MESSAGE,
      icon = NOTIFICATIONS_CONFIG.DEFAULT_OPTIONS.icon,
      badge = NOTIFICATIONS_CONFIG.DEFAULT_OPTIONS.badge,
      data: notificationData = {},
      actions = [],
      image,
      tag,
      requireInteraction = false,
      silent = false,
      vibrate = NOTIFICATIONS_CONFIG.DEFAULT_OPTIONS.vibrate
    } = data;
    
    // Check if notification should be shown based on user preferences
    const shouldShow = await shouldShowNotification(category, notificationData);
    if (!shouldShow) {
      return;
    }
    
    // Prepare notification options
    const options = {
      body,
      icon,
      badge,
      data: {
        ...notificationData,
        category,
        timestamp: Date.now(),
        swVersion: SW_VERSION
      },
      actions: actions.slice(0, 2), // Maximum 2 actions on most platforms
      image,
      tag: tag || `${category}_${Date.now()}`,
      requireInteraction,
      silent,
      vibrate,
      renotify: category === NOTIFICATIONS_CONFIG.CATEGORIES.SECURITY
    };
    
    // Show notification
    await self.registration.showNotification(title, options);
    
    // Update notification badge
    updateNotificationBadge();
    
    // Log notification analytics
    logNotificationAnalytics({
      category,
      title,
      timestamp: Date.now(),
      shown: true
    });
    
  } catch (error) {
    console.error('[SW] Handle push notification error:', error);
  }
}

/**
 * Notification click event - Handle user interaction
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.data);
  
  const notification = event.notification;
  const data = notification.data || {};
  
  // Close notification
  notification.close();
  
  // Handle action clicks
  if (event.action) {
    event.waitUntil(
      handleNotificationAction(event.action, data)
    );
    return;
  }
  
  // Default click behavior - open/focus app
  event.waitUntil(
    handleNotificationClick(data)
  );
});

/**
 * Handle notification click to open app
 * @param {Object} data - Notification data
 */
async function handleNotificationClick(data) {
  try {
    const { category, groupId, chatId, messageId, url } = data;
    
    // Determine target URL
    let targetUrl = '/';
    
    if (url) {
      targetUrl = url;
    } else {
      switch (category) {
        case NOTIFICATIONS_CONFIG.CATEGORIES.MESSAGE:
          if (groupId) {
            targetUrl = `/groups/${groupId}`;
          } else if (chatId) {
            targetUrl = `/chat/${chatId}`;
          }
          break;
          
        case NOTIFICATIONS_CONFIG.CATEGORIES.GROUP_INVITE:
          targetUrl = `/groups/${groupId}`;
          break;
          
        case NOTIFICATIONS_CONFIG.CATEGORIES.MENTION:
          targetUrl = `/groups/${groupId}?message=${messageId}`;
          break;
          
        case NOTIFICATIONS_CONFIG.CATEGORIES.SECURITY:
          targetUrl = '/admin/security';
          break;
          
        default:
          targetUrl = '/notifications';
      }
    }
    
    // Get all clients (open windows/tabs)
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    
    // Check if app is already open
    for (const client of clients) {
      if (client.url.includes(self.location.origin)) {
        // Focus existing window and navigate
        await client.focus();
        client.postMessage({
          type: 'NOTIFICATION_CLICK',
          url: targetUrl,
          data
        });
        return;
      }
    }
    
    // Open new window
    await self.clients.openWindow(targetUrl);
    
  } catch (error) {
    console.error('[SW] Handle notification click error:', error);
  }
}

/**
 * Handle notification action buttons
 * @param {string} action - Action ID
 * @param {Object} data - Notification data
 */
async function handleNotificationAction(action, data) {
  try {
    console.log(`[SW] Notification action: ${action}`, data);
    
    switch (action) {
      case 'reply':
        // Open reply interface
        await self.clients.openWindow(`/chat/${data.chatId || data.groupId}?reply=true`);
        break;
        
      case 'mark_read':
        // Mark message as read (background operation)
        await markMessageAsRead(data.messageId);
        break;
        
      case 'dismiss':
        // Just close the notification (already closed)
        break;
        
      case 'view_group':
        await self.clients.openWindow(`/groups/${data.groupId}`);
        break;
        
      case 'accept_invite':
        // Accept group invitation
        await acceptGroupInvite(data.groupId, data.inviteId);
        break;
        
      default:
        console.warn('[SW] Unknown notification action:', action);
    }
    
  } catch (error) {
    console.error('[SW] Handle notification action error:', error);
  }
}

/**
 * Message event - Handle messages from main app
 */
self.addEventListener('message', (event) => {
  const { type, ...data } = event.data;
  
  console.log('[SW] Message received:', type);
  
  switch (type) {
    case 'SHOW_NOTIFICATION':
      handlePushNotification(data.notification);
      break;
      
    case 'CLEAR_NOTIFICATIONS':
      clearAllNotifications();
      break;
      
    case 'UPDATE_BADGE':
      updateNotificationBadge(data.count);
      break;
      
    case 'SYNC_NOTIFICATIONS':
      syncNotifications();
      break;
      
    default:
      console.warn('[SW] Unknown message type:', type);
  }
});

/**
 * Background sync event - Handle notification synchronization
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

/**
 * Check if notification should be shown based on preferences
 * @param {string} category - Notification category
 * @param {Object} data - Notification data
 * @returns {Promise<boolean>} - Should show notification
 */
async function shouldShowNotification(category, data) {
  try {
    // TODO: Check user preferences from IndexedDB or make API call
    // For now, show all notifications
    return true;
  } catch (error) {
    console.error('[SW] Check notification preferences error:', error);
    return true; // Default to showing notifications
  }
}

/**
 * Update notification badge
 * @param {number} count - Notification count
 */
function updateNotificationBadge(count) {
  try {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(count || 0);
    }
  } catch (error) {
    console.error('[SW] Update badge error:', error);
  }
}

/**
 * Clear all notifications
 */
async function clearAllNotifications() {
  try {
    const notifications = await self.registration.getNotifications();
    notifications.forEach(notification => notification.close());
    
    updateNotificationBadge(0);
    
    console.log('[SW] All notifications cleared');
  } catch (error) {
    console.error('[SW] Clear notifications error:', error);
  }
}

/**
 * Sync notifications with server
 */
async function syncNotifications() {
  try {
    console.log('[SW] Syncing notifications...');
    
    // TODO: Implement notification sync with server
    // This could involve:
    // 1. Fetching missed notifications
    // 2. Updating notification status
    // 3. Clearing old notifications
    
    console.log('[SW] Notification sync completed');
  } catch (error) {
    console.error('[SW] Notification sync error:', error);
  }
}

/**
 * Mark message as read (background operation)
 * @param {string} messageId - Message ID
 */
async function markMessageAsRead(messageId) {
  try {
    // TODO: Make API call to mark message as read
    console.log('[SW] Marked message as read:', messageId);
  } catch (error) {
    console.error('[SW] Mark as read error:', error);
  }
}

/**
 * Accept group invitation
 * @param {string} groupId - Group ID
 * @param {string} inviteId - Invitation ID
 */
async function acceptGroupInvite(groupId, inviteId) {
  try {
    // TODO: Make API call to accept group invitation
    console.log('[SW] Accepted group invite:', { groupId, inviteId });
  } catch (error) {
    console.error('[SW] Accept invite error:', error);
  }
}

/**
 * Log notification analytics
 * @param {Object} analytics - Analytics data
 */
function logNotificationAnalytics(analytics) {
  try {
    // TODO: Send analytics to server or store locally
    console.log('[SW] Notification analytics:', analytics);
  } catch (error) {
    console.error('[SW] Analytics logging error:', error);
  }
}

/**
 * Fetch event - Handle network requests (optional caching)
 */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests to notification-related resources
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // Cache notification icons and badges
  if (url.pathname.includes('icon-') || url.pathname.includes('badge-')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      }).catch(() => {
        return fetch(event.request);
      })
    );
  }
});

console.log('[SW] Notification service worker loaded v' + SW_VERSION);