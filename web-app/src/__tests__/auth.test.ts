/**
 * Auth Logic Tests
 * Tests for the hasRole function logic from AuthContext
 * 
 * Role Hierarchy:
 * g_admin > admin > helper > user
 */

import { describe, it, expect } from 'vitest';
import { UserRole } from '../types/shared';

/**
 * Pure function version of hasRole for testing
 * This mirrors the logic in AuthContext.tsx
 */
function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
    if (!userRole) return false;

    // 1. g_admin has access to EVERYTHING
    if (userRole === 'g_admin') return true;

    // 2. admin has access to everything EXCEPT g_admin
    if (userRole === 'admin') {
        return requiredRole !== 'g_admin';
    }

    // 3. helper has access to helper and user
    if (userRole === 'helper') {
        return requiredRole === 'helper' || requiredRole === 'user';
    }

    // 4. user has access only to user
    return requiredRole === 'user';
}

describe('hasRole', () => {
    describe('g_admin user', () => {
        const userRole: UserRole = 'g_admin';

        it('should have access to g_admin features', () => {
            expect(hasRole(userRole, 'g_admin')).toBe(true);
        });

        it('should have access to admin features', () => {
            expect(hasRole(userRole, 'admin')).toBe(true);
        });

        it('should have access to helper features', () => {
            expect(hasRole(userRole, 'helper')).toBe(true);
        });

        it('should have access to user features', () => {
            expect(hasRole(userRole, 'user')).toBe(true);
        });
    });

    describe('admin user', () => {
        const userRole: UserRole = 'admin';

        it('should NOT have access to g_admin features', () => {
            expect(hasRole(userRole, 'g_admin')).toBe(false);
        });

        it('should have access to admin features', () => {
            expect(hasRole(userRole, 'admin')).toBe(true);
        });

        it('should have access to helper features', () => {
            expect(hasRole(userRole, 'helper')).toBe(true);
        });

        it('should have access to user features', () => {
            expect(hasRole(userRole, 'user')).toBe(true);
        });
    });

    describe('helper user', () => {
        const userRole: UserRole = 'helper';

        it('should NOT have access to g_admin features', () => {
            expect(hasRole(userRole, 'g_admin')).toBe(false);
        });

        it('should NOT have access to admin features', () => {
            expect(hasRole(userRole, 'admin')).toBe(false);
        });

        it('should have access to helper features', () => {
            expect(hasRole(userRole, 'helper')).toBe(true);
        });

        it('should have access to user features', () => {
            expect(hasRole(userRole, 'user')).toBe(true);
        });
    });

    describe('regular user', () => {
        const userRole: UserRole = 'user';

        it('should NOT have access to g_admin features', () => {
            expect(hasRole(userRole, 'g_admin')).toBe(false);
        });

        it('should NOT have access to admin features', () => {
            expect(hasRole(userRole, 'admin')).toBe(false);
        });

        it('should NOT have access to helper features', () => {
            expect(hasRole(userRole, 'helper')).toBe(false);
        });

        it('should have access to user features', () => {
            expect(hasRole(userRole, 'user')).toBe(true);
        });
    });

    describe('no role / undefined', () => {
        it('should NOT have access to any features when role is undefined', () => {
            expect(hasRole(undefined, 'user')).toBe(false);
            expect(hasRole(undefined, 'helper')).toBe(false);
            expect(hasRole(undefined, 'admin')).toBe(false);
            expect(hasRole(undefined, 'g_admin')).toBe(false);
        });
    });
});
