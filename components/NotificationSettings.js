import { useState } from 'react';
import pushNotificationService from '../lib/pushNotifications';

/**
 * Push Notification Settings Component
 * 
 * TODO: Complete implementation
 * - Add notification testing functionality
 * - Implement notification history viewer
 * - Add notification scheduling interface
 * - Implement notification templates
 * - Add quiet hours configuration
 * - Implement notification grouping settings
 * - Add notification sound selection
 * - Implement notification preview
 */

export default function NotificationSettings() {
  const [status, setStatus] = useState(pushNotificationService.getStatus());
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    messages: true,
    mentions: true,
    groupActivity: true,
    fileShares: true,
    systemUpdates: false,
    sound: true,
    vibration: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  const handleEnableNotifications = async () => {
    setLoading(true);
    
    try {
      // Initialize service
      const initialized = await pushNotificationService.initialize();
      if (!initialized) {
        alert('Push notifications are not supported in this browser');
        return;
      }

      // Request permission
      await pushNotificationService.requestPermission();
      
      // Subscribe
      await pushNotificationService.subscribe();
      
      setStatus(pushNotificationService.getStatus());
      
      // Show test notification
      await pushNotificationService.showNotification('Notifications Enabled!', {
        body: 'You will now receive push notifications from Shadow Bind.',
        icon: '/icons/icon-192x192.png'
      });
      
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      alert(`Failed to enable notifications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    
    try {
      await pushNotificationService.unsubscribe();
      setStatus(pushNotificationService.getStatus());
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      alert(`Failed to disable notifications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.showNotification('Test Notification', {
        body: 'This is a test notification from Shadow Bind!',
        tag: 'test-notification'
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert('Failed to send test notification');
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    // TODO: Save to user preferences
  };

  const handleQuietHoursChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }));
  };

  if (!status.supported) {
    return (
      <div className="notification-settings">
        <h3>🔔 Push Notifications</h3>
        <div className="notification-unsupported">
          <p>❌ Push notifications are not supported in this browser.</p>
          <p>Please use a modern browser that supports web push notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h3>🔔 Push Notifications</h3>
      
      <div className="notification-status">
        <div className={`status-indicator ${status.subscribed ? 'enabled' : 'disabled'}`}>
          {status.subscribed ? '✅ Enabled' : '❌ Disabled'}
        </div>
        <p>Permission: {status.permission}</p>
      </div>

      <div className="notification-controls">
        {!status.subscribed ? (
          <button 
            onClick={handleEnableNotifications}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        ) : (
          <div className="enabled-controls">
            <button 
              onClick={handleDisableNotifications}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? 'Disabling...' : 'Disable Notifications'}
            </button>
            <button 
              onClick={handleTestNotification}
              className="btn btn-outline"
            >
              Send Test
            </button>
          </div>
        )}
      </div>

      {status.subscribed && (
        <div className="notification-preferences">
          <h4>Notification Preferences</h4>
          
          <div className="preference-group">
            <h5>What to notify about:</h5>
            
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.messages}
                onChange={(e) => handlePreferenceChange('messages', e.target.checked)}
              />
              <span>💬 New Messages</span>
            </label>
            
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.mentions}
                onChange={(e) => handlePreferenceChange('mentions', e.target.checked)}
              />
              <span>@️⃣ Mentions</span>
            </label>
            
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.groupActivity}
                onChange={(e) => handlePreferenceChange('groupActivity', e.target.checked)}
              />
              <span>👥 Group Activity</span>
            </label>
            
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.fileShares}
                onChange={(e) => handlePreferenceChange('fileShares', e.target.checked)}
              />
              <span>📎 File Shares</span>
            </label>
            
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.systemUpdates}
                onChange={(e) => handlePreferenceChange('systemUpdates', e.target.checked)}
              />
              <span>⚙️ System Updates</span>
            </label>
          </div>

          <div className="preference-group">
            <h5>Notification Style:</h5>
            
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.sound}
                onChange={(e) => handlePreferenceChange('sound', e.target.checked)}
              />
              <span>🔊 Play Sound</span>
            </label>
            
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.vibration}
                onChange={(e) => handlePreferenceChange('vibration', e.target.checked)}
              />
              <span>📳 Vibration</span>
            </label>
          </div>

          <div className="preference-group">
            <h5>Quiet Hours:</h5>
            
            <label className="preference-item">
              <input
                type="checkbox"
                checked={preferences.quietHours.enabled}
                onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
              />
              <span>🌙 Enable Quiet Hours</span>
            </label>
            
            {preferences.quietHours.enabled && (
              <div className="quiet-hours-config">
                <label>
                  Start:
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                    className="time-input"
                  />
                </label>
                <label>
                  End:
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                    className="time-input"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="notification-info">
        <h5>About Push Notifications</h5>
        <p>
          Push notifications will work even when the Shadow Bind tab is closed. 
          You can customize which types of notifications you receive and when.
        </p>
        {/* TODO: Add links to notification management guide */}
      </div>
    </div>
  );
}