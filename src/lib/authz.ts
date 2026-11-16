import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import {
  AppRole,
  canonicalizeRoles,
  hasMetarhRole,
  type AppRole as Role,
} from "@/types/roles";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  contractStatus?: string | null;
  effectiveRole?: Role;
};

export function requireUser(user: SessionUser | undefined): SessionUser {
  if (!user?.id?.trim()) throw new UnauthorizedError();
  return user;
}

export function requireRole(user: SessionUser | undefined, roles: Role[]): SessionUser {
  const current = requireUser(user);
  const normalized = canonicalizeRoles(current.roles);
  if (!roles.some((role) => normalized.includes(role))) {
    throw new ForbiddenError();
  }
  return current;
}

export function hasRole(user: SessionUser | undefined, role: Role): boolean {
  if (!user) return false;
  return canonicalizeRoles(user.roles).includes(role);
}

export function requireMetarh(user: SessionUser | undefined): SessionUser {
  return requireRole(user, [AppRole.METARH]);
}

/** @deprecated use requireMetarh */
export function requireCommunicator(user: SessionUser | undefined): SessionUser {
  return requireMetarh(user);
}

export function isMetarhUser(user: SessionUser | undefined): boolean {
  return hasMetarhRole(user?.roles ?? []);
}
