/**
 * Authentication Module
 * 
 * Central export point for all authentication-related utilities
 * 
 * Requirements: 11.1, 11.2, 11.4
 */

// NextAuth configuration is in lib/authConfig.ts
// Import it directly from there if needed: import { authOptions } from '@/lib/authConfig';

// Server-side session management
export {
  getCurrentSession,
  requireAuth,
  requireRole,
  requireAnyRole,
  isAdmin,
  hasRole,
} from './session';

// API middleware for authentication
export {
  verifyAuth,
  withAuth,
  withRole,
  withAnyRole,
  withAdmin,
  getAuthContext,
  type AuthContext,
  type AuthenticatedHandler,
  type RoleBasedHandler,
} from './api-middleware';

// Client-side hooks
export {
  useSession,
  useUser,
  useIsAuthenticated,
  useHasRole,
  useIsAdmin,
  useIsContentCreator,
  useIsSEOSpecialist,
  useHasAnyRole,
} from './hooks';

// Password utilities
export { hashPassword, verifyPassword } from '@/lib/utils/password';

// Authentication service utilities
export { canLogin } from './authService';

// Permission utilities
export {
  toPermissionUser,
  canPerformAction,
  requirePermission,
  getAssetFilter,
  checkAllPermissions,
} from './permissions';
