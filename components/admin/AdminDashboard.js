/**
 * Admin Dashboard Component
 * Main administrative interface with real-time updates and system monitoring
 */

import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../lib/admin/middleware';
import { isAdmin } from '../../lib/admin/config';

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const adminAuth = useAdminAuth(user);

  useEffect(() => {
    if (adminAuth.isAdmin) {
      loadDashboardData();
      
      // Set up real-time updates
      const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [adminAuth.isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // TODO: Load real data from Firebase
      const dashboardStats = {
        users: {
          total: 1250,
          active: 892,
          newToday: 23,
          online: 156
        },
        messages: {
          total: 45678,
          today: 1234,
          averagePerDay: 2150
        },
        groups: {
          total: 89,
          active: 67,
          newThisWeek: 5
        },
        storage: {
          used: 2.4, // GB
          limit: 10, // GB
          files: 3456
        },
        system: {
          uptime: '99.9%',
          responseTime: '120ms',
          errors: 3,
          alerts: 1
        }
      };
      
      setStats(dashboardStats);
      setError(null);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!adminAuth.isAdmin) {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>Administrator privileges required to access this dashboard.</p>
      </div>
    );
  }

  if (loading && !stats.users) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">⟳</div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-info">
          <span className="admin-badge">Administrator</span>
          <span className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="dashboard-stats">
        <div className="stat-card users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.users?.total || 0}</h3>
            <p>Total Users</p>
            <small>{stats.users?.active || 0} active, {stats.users?.online || 0} online</small>
          </div>
        </div>
        
        <div className="stat-card messages">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{stats.messages?.total || 0}</h3>
            <p>Messages Sent</p>
            <small>{stats.messages?.today || 0} today</small>
          </div>
        </div>
        
        <div className="stat-card groups">
          <div className="stat-icon">🏘️</div>
          <div className="stat-content">
            <h3>{stats.groups?.total || 0}</h3>
            <p>Groups Created</p>
            <small>{stats.groups?.active || 0} active</small>
          </div>
        </div>
        
        <div className="stat-card storage">
          <div className="stat-icon">💾</div>
          <div className="stat-content">
            <h3>{stats.storage?.used || 0}GB</h3>
            <p>Storage Used</p>
            <small>{stats.storage?.files || 0} files</small>
          </div>
        </div>
      </div>

      {/* System Health Alert */}
      {stats.system?.alerts > 0 && (
        <div className="system-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h4>System Alert</h4>
            <p>{stats.system.alerts} system alert{stats.system.alerts !== 1 ? 's' : ''} require attention</p>
          </div>
          <button className="alert-action">View Alerts</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'users' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={activeTab === 'security' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button 
          className={activeTab === 'system' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('system')}
        >
          System Health
        </button>
        <button 
          className={activeTab === 'analytics' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <DashboardOverview stats={stats} />
        )}
        
        {activeTab === 'users' && (
          <UserManagement user={user} />
        )}
        
        {activeTab === 'security' && (
          <SecurityDashboard user={user} />
        )}
        
        {activeTab === 'system' && (
          <SystemHealth stats={stats} />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsDashboard user={user} />
        )}
      </div>

      {/* TODO: Add real-time notifications */}
      {/* TODO: Add bulk operations interface */}
      {/* TODO: Add configuration management */}
      {/* TODO: Add emergency response tools */}
    </div>
  );
}

/**
 * Dashboard Overview Tab
 */
function DashboardOverview({ stats }) {
  return (
    <div className="dashboard-overview">
      <h2>System Overview</h2>
      
      {/* Recent Activity */}
      <div className="overview-section">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-time">5 min ago</span>
            <span className="activity-text">New user registered: john.doe@example.com</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">12 min ago</span>
            <span className="activity-text">Group created: &quot;React Developers&quot;</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">23 min ago</span>
            <span className="activity-text">File uploaded: presentation.pdf (2.3MB)</span>
          </div>
          {/* TODO: Load real activity data */}
        </div>
      </div>

      {/* System Status */}
      <div className="overview-section">
        <h3>System Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Uptime</span>
            <span className="status-value good">{stats.system?.uptime || '99.9%'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Response Time</span>
            <span className="status-value good">{stats.system?.responseTime || '120ms'}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Active Sessions</span>
            <span className="status-value">{stats.users?.online || 0}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Error Rate</span>
            <span className="status-value warning">0.1%</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="overview-section">
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          <button className="action-button">
            <span className="action-icon">📊</span>
            <span className="action-text">Generate Report</span>
          </button>
          <button className="action-button">
            <span className="action-icon">🚨</span>
            <span className="action-text">Emergency Broadcast</span>
          </button>
          <button className="action-button">
            <span className="action-icon">🔧</span>
            <span className="action-text">System Maintenance</span>
          </button>
          <button className="action-button">
            <span className="action-icon">📋</span>
            <span className="action-text">Audit Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * User Management Tab
 */
function UserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // TODO: Load real user data from Firebase
      const mockUsers = [
        {
          id: '1',
          email: 'oladoyeheritage445@gmail.com',
          displayName: 'Heritage Oladoye',
          status: 'active',
          role: 'super_admin',
          lastSeen: new Date(Date.now() - 300000),
          joinedAt: new Date(Date.now() - 86400000 * 30),
          messageCount: 1250
        },
        {
          id: '2',
          email: 'user1@example.com',
          displayName: 'John Doe',
          status: 'active',
          role: 'user',
          lastSeen: new Date(Date.now() - 900000),
          joinedAt: new Date(Date.now() - 86400000 * 15),
          messageCount: 89
        },
        {
          id: '3',
          email: 'user2@example.com',
          displayName: 'Jane Smith',
          status: 'suspended',
          role: 'user',
          lastSeen: new Date(Date.now() - 86400000 * 3),
          joinedAt: new Date(Date.now() - 86400000 * 45),
          messageCount: 456
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    // TODO: Implement bulk actions
    console.log(`Bulk ${action} for users:`, selectedUsers);
  };

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        
        {/* Search and Filters */}
        <div className="user-controls">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="user-search"
          />
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="user-filter"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedUsers.length} user(s) selected</span>
            <button onClick={() => handleBulkAction('suspend')} className="bulk-btn warning">
              Suspend
            </button>
            <button onClick={() => handleBulkAction('activate')} className="bulk-btn success">
              Activate
            </button>
            <button onClick={() => handleBulkAction('export')} className="bulk-btn">
              Export
            </button>
          </div>
        )}
      </div>

      {/* User List */}
      <div className="user-list">
        <div className="user-list-header">
          <div className="user-checkbox">
            <input 
              type="checkbox" 
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedUsers(filteredUsers.map(u => u.id));
                } else {
                  setSelectedUsers([]);
                }
              }}
            />
          </div>
          <div className="user-info">User</div>
          <div className="user-status">Status</div>
          <div className="user-role">Role</div>
          <div className="user-activity">Last Seen</div>
          <div className="user-actions">Actions</div>
        </div>

        {filteredUsers.map(userItem => (
          <div key={userItem.id} className="user-item">
            <div className="user-checkbox">
              <input 
                type="checkbox" 
                checked={selectedUsers.includes(userItem.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUsers([...selectedUsers, userItem.id]);
                  } else {
                    setSelectedUsers(selectedUsers.filter(id => id !== userItem.id));
                  }
                }}
              />
            </div>
            
            <div className="user-info">
              <div className="user-name">{userItem.displayName || userItem.email}</div>
              <div className="user-email">{userItem.email}</div>
            </div>
            
            <div className={`user-status ${userItem.status}`}>
              {userItem.status}
            </div>
            
            <div className="user-role">
              {userItem.role}
            </div>
            
            <div className="user-activity">
              {userItem.lastSeen.toRelativeString?.() || userItem.lastSeen.toLocaleString()}
            </div>
            
            <div className="user-actions">
              <button className="action-btn">Edit</button>
              <button className="action-btn warning">Suspend</button>
              <button className="action-btn">View</button>
            </div>
          </div>
        ))}
      </div>

      {/* TODO: Add user creation form */}
      {/* TODO: Add user import/export */}
      {/* TODO: Add role management */}
    </div>
  );
}

/**
 * Security Dashboard Tab
 */
function SecurityDashboard({ user }) {
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const loadSecurityData = async () => {
    try {
      // TODO: Load real security data
      const mockAlerts = [
        {
          id: '1',
          type: 'suspicious_login',
          severity: 'medium',
          title: 'Suspicious Login Attempt',
          description: 'Multiple failed login attempts from IP 192.168.1.100',
          timestamp: new Date(Date.now() - 3600000),
          status: 'open'
        },
        {
          id: '2',
          type: 'rate_limit',
          severity: 'low',
          title: 'Rate Limit Exceeded',
          description: 'User exceeded message rate limit',
          timestamp: new Date(Date.now() - 7200000),
          status: 'resolved'
        }
      ];

      const mockAuditLogs = [
        {
          id: '1',
          userId: user.uid,
          action: 'admin_login',
          resource: 'dashboard',
          timestamp: new Date(),
          ip: '127.0.0.1',
          userAgent: navigator.userAgent
        },
        {
          id: '2',
          userId: '2',
          action: 'user_suspended',
          resource: 'users/user123',
          timestamp: new Date(Date.now() - 1800000),
          ip: '192.168.1.50',
          details: { reason: 'policy violation' }
        }
      ];

      setSecurityAlerts(mockAlerts);
      setAuditLogs(mockAuditLogs);
    } catch (error) {
      console.error('Load security data error:', error);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  return (
    <div className="security-dashboard">
      <h2>Security Dashboard</h2>

      {/* Security Overview */}
      <div className="security-overview">
        <div className="security-metric">
          <h3>Open Alerts</h3>
          <div className="metric-value high">{securityAlerts.filter(a => a.status === 'open').length}</div>
        </div>
        <div className="security-metric">
          <h3>Failed Logins (24h)</h3>
          <div className="metric-value">23</div>
        </div>
        <div className="security-metric">
          <h3>Active Sessions</h3>
          <div className="metric-value">156</div>
        </div>
        <div className="security-metric">
          <h3>Encryption Status</h3>
          <div className="metric-value good">Active</div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="security-section">
        <h3>Security Alerts</h3>
        <div className="alert-list">
          {securityAlerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.severity}`}>
              <div className="alert-header">
                <span className="alert-title">{alert.title}</span>
                <span className={`alert-severity ${alert.severity}`}>{alert.severity}</span>
              </div>
              <div className="alert-description">{alert.description}</div>
              <div className="alert-footer">
                <span className="alert-time">{alert.timestamp.toLocaleString()}</span>
                <div className="alert-actions">
                  <button className="alert-action">Investigate</button>
                  <button className="alert-action">Dismiss</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="security-section">
        <h3>Recent Audit Logs</h3>
        <div className="audit-logs">
          {auditLogs.map(log => (
            <div key={log.id} className="audit-item">
              <div className="audit-time">{log.timestamp.toLocaleString()}</div>
              <div className="audit-action">{log.action}</div>
              <div className="audit-resource">{log.resource}</div>
              <div className="audit-user">{log.userId}</div>
              <div className="audit-ip">{log.ip}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TODO: Add security configuration */}
      {/* TODO: Add threat analysis */}
      {/* TODO: Add compliance reporting */}
    </div>
  );
}

/**
 * System Health Tab
 */
function SystemHealth({ stats }) {
  return (
    <div className="system-health">
      <h2>System Health</h2>
      
      {/* TODO: Add real-time metrics charts */}
      {/* TODO: Add performance monitoring */}
      {/* TODO: Add resource usage graphs */}
      {/* TODO: Add error rate tracking */}
      
      <div className="health-placeholder">
        <p>System health monitoring interface will be implemented here.</p>
        <p>Features to include:</p>
        <ul>
          <li>Real-time performance metrics</li>
          <li>Resource usage monitoring</li>
          <li>Error rate tracking</li>
          <li>Database performance</li>
          <li>Network latency</li>
          <li>Storage usage</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Analytics Dashboard Tab
 */
function AnalyticsDashboard({ user }) {
  return (
    <div className="analytics-dashboard">
      <h2>Analytics</h2>
      
      {/* TODO: Add analytics charts and reports */}
      {/* TODO: Add user engagement metrics */}
      {/* TODO: Add message statistics */}
      {/* TODO: Add growth analytics */}
      
      <div className="analytics-placeholder">
        <p>Analytics dashboard will be implemented here.</p>
        <p>Metrics to track:</p>
        <ul>
          <li>User engagement and activity</li>
          <li>Message volume and patterns</li>
          <li>Group creation and activity</li>
          <li>File sharing statistics</li>
          <li>Search usage and effectiveness</li>
          <li>Feature adoption rates</li>
        </ul>
      </div>
    </div>
  );
}