/**
 * Admin Middleware for Shadow-Bind
 * Provides authentication and authorization utilities for admin features
 */

import { isAdmin, hasPermission, getUserRole } from './config';

/**
 * Higher-order component to protect admin routes
 * @param {React.Component} WrappedComponent - Component to protect
 * @param {string} requiredPermission - Required permission (optional)
 */
export function withAdminAuth(WrappedComponent, requiredPermission = null) {
  return function AdminProtectedComponent(props) {
    const { user, ...otherProps } = props;
    
    // Check if user is admin
    if (!isAdmin(user)) {
      return (
        <div className="admin-access-denied">
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
          <p>Contact the system administrator if you believe this is an error.</p>
        </div>
      );
    }
    
    // Check specific permission if required
    if (requiredPermission && !hasPermission(user, requiredPermission)) {
      return (
        <div className="admin-permission-denied">
          <h2>Insufficient Permissions</h2>
          <p>You don&apos;t have the required permissions to access this feature.</p>
          <p>Required permission: {requiredPermission}</p>
          <p>Your role: {getUserRole(user)}</p>
        </div>
      );
    }
    
    return <WrappedComponent user={user} {...otherProps} />;
  };
}

/**
 * API route middleware to check admin access
 * @param {function} handler - API route handler
 * @param {string} requiredPermission - Required permission (optional)
 */
export function withApiAdminAuth(handler, requiredPermission = null) {
  return async function adminProtectedHandler(req, res) {
    try {
      // TODO: Extract user from request (Firebase Admin SDK)
      // For now, this is a placeholder structure
      const user = req.user; // Assuming user is attached to request
      
      if (!isAdmin(user)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Administrator privileges required'
        });
      }
      
      if (requiredPermission && !hasPermission(user, requiredPermission)) {
        return res.status(403).json({
          error: 'Insufficient Permissions',
          message: `Required permission: ${requiredPermission}`
        });
      }
      
      return handler(req, res);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication check failed'
      });
    }
  };
}

/**
 * Hook to check if current user is admin
 * @param {Object} user - Firebase user object
 * @returns {Object} - Admin status and utilities
 */
export function useAdminAuth(user) {
  const userIsAdmin = isAdmin(user);
  const userRole = getUserRole(user);
  
  return {
    isAdmin: userIsAdmin,
    role: userRole,
    hasPermission: (permission) => hasPermission(user, permission),
    canAccess: (permission) => userIsAdmin && (permission ? hasPermission(user, permission) : true)
  };
}