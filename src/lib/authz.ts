import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import type { AppRole } from "@/types/roles";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
};

export function requireUser(user: SessionUser | undefined): SessionUser {
  if (!user) throw new UnauthorizedError();
  return user;
}

export function requireRole(user: SessionUser | undefined, roles: AppRole[]): SessionUser {
  const current = requireUser(user);
  if (!roles.some((role) => current.roles.includes(role))) {
    throw new ForbiddenError();
  }
  return current;
}

export function hasRole(user: SessionUser | undefined, role: AppRole): boolean {
  return Boolean(user?.roles.includes(role));
}

export function requireCommunicator(user: SessionUser | undefined): SessionUser {
  return requireRole(user, ["COMMUNICATOR"]);
}
