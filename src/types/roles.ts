export const AppRole = {
  METARH: "METARH",
  CLIENT: "CLIENT",
  COLLABORATOR: "COLLABORATOR",
  CANDIDATE: "CANDIDATE",
  /** @deprecated legado — normalizar para METARH */
  COMMUNICATOR: "COMMUNICATOR",
} as const;

export type AppRole = (typeof AppRole)[keyof typeof AppRole];

const CANONICAL_ROLES = new Set<string>([
  AppRole.METARH,
  AppRole.CLIENT,
  AppRole.COLLABORATOR,
  AppRole.CANDIDATE,
]);

export function isAppRole(value: string): value is AppRole {
  return CANONICAL_ROLES.has(value) || value === AppRole.COMMUNICATOR;
}

/** Converte COMMUNICATOR legado e remove duplicatas. */
export function canonicalizeRoles(roles: string[]): AppRole[] {
  const set = new Set<AppRole>();
  for (const role of roles) {
    if (role === AppRole.COMMUNICATOR || role === AppRole.METARH) {
      set.add(AppRole.METARH);
      continue;
    }
    if (CANONICAL_ROLES.has(role)) set.add(role as AppRole);
  }
  return [...set];
}

export function hasMetarhRole(roles: AppRole[]): boolean {
  const normalized = canonicalizeRoles(roles);
  return normalized.includes(AppRole.METARH);
}

/** @deprecated use hasMetarhRole */
export function hasCommunicatorRole(roles: AppRole[]): boolean {
  return hasMetarhRole(roles);
}

export function hasClientRole(roles: AppRole[]): boolean {
  return canonicalizeRoles(roles).includes(AppRole.CLIENT);
}

export function hasCollaboratorRole(roles: AppRole[]): boolean {
  return canonicalizeRoles(roles).includes(AppRole.COLLABORATOR);
}

export function hasCandidateRole(roles: AppRole[]): boolean {
  return canonicalizeRoles(roles).includes(AppRole.CANDIDATE);
}

export const ContractStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  NONE: "NONE",
} as const;

export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export const ContractType = {
  TEMPORARY: "TEMPORARY",
  THIRD_PARTY: "THIRD_PARTY",
} as const;

export type ContractType = (typeof ContractType)[keyof typeof ContractType];

/**
 * Perfil efetivo de UI/consumo.
 * METARH e CLIENT explícitos prevalecem; sem contrato ativo → CANDIDATE.
 */
export function resolveEffectiveRole(input: {
  roles: AppRole[];
  contractStatus?: string | null;
}): AppRole {
  const roles = canonicalizeRoles(input.roles);
  if (roles.includes(AppRole.METARH)) return AppRole.METARH;
  if (roles.includes(AppRole.CLIENT)) return AppRole.CLIENT;

  const status = input.contractStatus?.trim().toUpperCase() || ContractStatus.NONE;
  if (status !== ContractStatus.ACTIVE) return AppRole.CANDIDATE;

  if (roles.includes(AppRole.COLLABORATOR)) return AppRole.COLLABORATOR;
  if (roles.includes(AppRole.CANDIDATE)) return AppRole.CANDIDATE;
  return AppRole.CANDIDATE;
}
