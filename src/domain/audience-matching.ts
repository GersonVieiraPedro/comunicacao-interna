import {
  AudienceTargetType,
  AudienceType,
  type AudienceTargetInput,
} from "@/types/audience";

export type AudienceUserFields = {
  id: string;
  active: boolean;
  contractStatus: string | null;
  contractType: string | null;
  economicGroup: string | null;
  cnpj: string | null;
  healthPlan: string | null;
  reimbursementCard: string | null;
  clientOrgId: string | null;
  roles?: string[];
};

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

function matchesTarget(user: AudienceUserFields, target: AudienceTargetInput): boolean {
  const expected = target.targetValue.trim();
  if (!expected) return false;

  switch (target.targetType) {
    case AudienceTargetType.CONTRACT_STATUS:
      return norm(user.contractStatus) === norm(expected);
    case AudienceTargetType.CONTRACT_TYPE:
      return norm(user.contractType) === norm(expected);
    case AudienceTargetType.ECONOMIC_GROUP:
      return norm(user.economicGroup) === norm(expected);
    case AudienceTargetType.CNPJ:
      return user.cnpj?.replace(/\D/g, "") === expected.replace(/\D/g, "");
    case AudienceTargetType.HEALTH_PLAN:
      return norm(user.healthPlan) === norm(expected);
    case AudienceTargetType.REIMBURSEMENT_CARD:
      return norm(user.reimbursementCard) === norm(expected);
    case AudienceTargetType.USER_ID:
      return user.id === expected;
    case AudienceTargetType.ROLE:
      return (user.roles ?? []).some((role) => norm(role) === norm(expected));
    default:
      return false;
  }
}

/** AND entre todos os targets; FILTERED sem targets = ninguém. */
export function userMatchesAudience(
  user: AudienceUserFields,
  audienceType: string,
  targets: AudienceTargetInput[],
): boolean {
  if (audienceType === AudienceType.ALL) {
    return user.active;
  }
  if (audienceType !== AudienceType.FILTERED) return false;
  if (!targets.length) return false;
  if (!user.active && !targets.some((t) => t.targetType === AudienceTargetType.USER_ID)) {
    // FILTERED pode incluir inativos via CONTRACT_STATUS=INACTIVE
  }
  return targets.every((target) => matchesTarget(user, target));
}

/** Cliente vê ALL ou FILTERED que case CNPJ / grupo / clientOrgId. */
export function communicationVisibleToClient(
  audienceType: string,
  targets: AudienceTargetInput[],
  client: Pick<AudienceUserFields, "cnpj" | "economicGroup" | "clientOrgId">,
): boolean {
  if (audienceType === AudienceType.ALL) return true;
  if (audienceType !== AudienceType.FILTERED) return false;
  return targets.some((target) => {
    if (target.targetType === AudienceTargetType.CNPJ && client.cnpj) {
      return client.cnpj.replace(/\D/g, "") === target.targetValue.replace(/\D/g, "");
    }
    if (target.targetType === AudienceTargetType.ECONOMIC_GROUP && client.economicGroup) {
      return norm(client.economicGroup) === norm(target.targetValue);
    }
    if (client.clientOrgId && target.targetValue === client.clientOrgId) {
      return (
        target.targetType === AudienceTargetType.CNPJ ||
        target.targetType === AudienceTargetType.ECONOMIC_GROUP ||
        target.targetType === AudienceTargetType.USER_ID
      );
    }
    return false;
  });
}

export function buildAudienceWhereFromTargets(
  targets: Array<{ targetType: string; targetValue: string }>,
): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  for (const target of targets) {
    const value = target.targetValue.trim();
    if (!value) continue;
    switch (target.targetType) {
      case AudienceTargetType.CONTRACT_STATUS:
        where.contractStatus = value;
        break;
      case AudienceTargetType.CONTRACT_TYPE:
        where.contractType = value;
        break;
      case AudienceTargetType.ECONOMIC_GROUP:
        where.economicGroup = value;
        break;
      case AudienceTargetType.CNPJ:
        where.cnpj = value;
        break;
      case AudienceTargetType.HEALTH_PLAN:
        where.healthPlan = value;
        break;
      case AudienceTargetType.REIMBURSEMENT_CARD:
        where.reimbursementCard = value;
        break;
      case AudienceTargetType.USER_ID:
        where.id = value;
        break;
      case AudienceTargetType.ROLE:
        where.roles = { some: { role: value } };
        break;
      default:
        break;
    }
  }
  return where;
}
