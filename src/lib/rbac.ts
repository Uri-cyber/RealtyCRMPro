import { JWTPayload } from './auth';

/**
 * Role hierarchy and permissions for the CRM
 * ADMIN > MANAGER > AGENT > SELLER
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'SELLER';

// Role hierarchy - higher number = more permissions
const ROLE_HIERARCHY: Record<UserRole, number> = {
  SELLER: 1,
  AGENT: 2,
  MANAGER: 3,
  ADMIN: 4,
};

// Permission definitions
export type Permission =
  | 'team:read'
  | 'team:invite'
  | 'team:update'
  | 'team:remove'
  | 'tenant:update'
  | 'leads:read_all'
  | 'leads:assign'
  | 'properties:read_all'
  | 'properties:manage_all'
  | 'showings:read_all'
  | 'reports:view'
  | 'reports:export';

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SELLER: [],
  AGENT: ['leads:read_all', 'properties:read_all', 'showings:read_all', 'reports:view'],
  MANAGER: [
    'team:read',
    'team:invite',
    'leads:read_all',
    'leads:assign',
    'properties:read_all',
    'properties:manage_all',
    'showings:read_all',
    'reports:view',
    'reports:export',
  ],
  ADMIN: [
    'team:read',
    'team:invite',
    'team:update',
    'team:remove',
    'tenant:update',
    'leads:read_all',
    'leads:assign',
    'properties:read_all',
    'properties:manage_all',
    'showings:read_all',
    'reports:view',
    'reports:export',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const userRole = role as UserRole;
  if (!ROLE_PERMISSIONS[userRole]) {
    return false;
  }
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

/**
 * Check if a role has minimum required role level
 */
export function hasMinimumRole(userRole: string, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

/**
 * Check if user can manage another user (based on role hierarchy)
 */
export function canManageUser(managerRole: string, targetRole: string): boolean {
  const managerLevel = ROLE_HIERARCHY[managerRole as UserRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole as UserRole] || 0;
  // Can only manage users with lower role level
  return managerLevel > targetLevel;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as UserRole] || [];
}

/**
 * Validate session has required permission
 */
export function requirePermission(session: JWTPayload | null, permission: Permission): boolean {
  if (!session) return false;
  return hasPermission(session.role, permission);
}

/**
 * Validate session has minimum required role
 */
export function requireRole(session: JWTPayload | null, requiredRole: UserRole): boolean {
  if (!session) return false;
  return hasMinimumRole(session.role, requiredRole);
}
