/**
 * Admin Configuration for Shadow-Bind
 * Manages admin users, roles, and permissions
 */

// Admin configuration
export const ADMIN_CONFIG = {
  // Primary admin email as specified in requirements
  SUPER_ADMIN_EMAIL: 'oladoyeheritage445@gmail.com',
  
  // Admin roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    USER: 'user'
  },
  
  // Permissions by role
  PERMISSIONS: {
    super_admin: [
      'user_management',
      'system_configuration',
      'security_monitoring',
      'audit_logs',
      'emergency_actions',
      'bulk_operations',
      'report_generation'
    ],
    admin: [
      'user_management',
      'security_monitoring',
      'audit_logs',
      'bulk_operations',
      'report_generation'
    ],
    moderator: [
      'group_moderation',
      'content_moderation',
      'user_warnings'
    ],
    user: []
  }
};

/**
 * Check if a user is an admin
 * @param {Object} user - Firebase user object
 * @returns {boolean} - True if user is admin
 */
export function isAdmin(user) {
  if (!user) return false;
  
  // Check if user is super admin
  if (user.email === ADMIN_CONFIG.SUPER_ADMIN_EMAIL) {
    return true;
  }
  
  // TODO: Check custom claims or Firestore admin collection
  // For now, only super admin is recognized
  return false;
}

/**
 * Get user role
 * @param {Object} user - Firebase user object
 * @returns {string} - User role
 */
export function getUserRole(user) {
  if (!user) return ADMIN_CONFIG.ROLES.USER;
  
  if (user.email === ADMIN_CONFIG.SUPER_ADMIN_EMAIL) {
    return ADMIN_CONFIG.ROLES.SUPER_ADMIN;
  }
  
  // TODO: Implement role checking from Firestore
  return ADMIN_CONFIG.ROLES.USER;
}

/**
 * Check if user has specific permission
 * @param {Object} user - Firebase user object
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
export function hasPermission(user, permission) {
  const role = getUserRole(user);
  const permissions = ADMIN_CONFIG.PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a user
 * @param {Object} user - Firebase user object
 * @returns {Array} - Array of permissions
 */
export function getUserPermissions(user) {
  const role = getUserRole(user);
  return ADMIN_CONFIG.PERMISSIONS[role] || [];
}