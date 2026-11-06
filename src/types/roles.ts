export const AppRole = {
  COLLABORATOR: "COLLABORATOR",
  COMMUNICATOR: "COMMUNICATOR",
} as const;

export type AppRole = (typeof AppRole)[keyof typeof AppRole];

export function isAppRole(value: string): value is AppRole {
  return value === AppRole.COLLABORATOR || value === AppRole.COMMUNICATOR;
}

export function hasCommunicatorRole(roles: AppRole[]): boolean {
  return roles?.includes(AppRole.COMMUNICATOR);
}
