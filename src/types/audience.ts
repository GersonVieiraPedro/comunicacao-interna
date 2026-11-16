export const AudienceType = {
  ALL: "ALL",
  FILTERED: "FILTERED",
} as const;

export type AudienceType = (typeof AudienceType)[keyof typeof AudienceType];

export const AudienceTargetType = {
  CONTRACT_STATUS: "CONTRACT_STATUS",
  CONTRACT_TYPE: "CONTRACT_TYPE",
  ECONOMIC_GROUP: "ECONOMIC_GROUP",
  CNPJ: "CNPJ",
  HEALTH_PLAN: "HEALTH_PLAN",
  REIMBURSEMENT_CARD: "REIMBURSEMENT_CARD",
  USER_ID: "USER_ID",
  ROLE: "ROLE",
} as const;

export type AudienceTargetType = (typeof AudienceTargetType)[keyof typeof AudienceTargetType];

export type AudienceTargetInput = {
  targetType: AudienceTargetType | string;
  targetValue: string;
};

export function isAudienceType(value: string): value is AudienceType {
  return value === AudienceType.ALL || value === AudienceType.FILTERED;
}

export function isAudienceTargetType(value: string): value is AudienceTargetType {
  return Object.values(AudienceTargetType).includes(value as AudienceTargetType);
}
