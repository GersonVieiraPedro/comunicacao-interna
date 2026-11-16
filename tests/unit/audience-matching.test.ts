import { describe, expect, it } from "vitest";
import {
  communicationVisibleToClient,
  userMatchesAudience,
} from "@/domain/audience-matching";
import { AudienceTargetType, AudienceType } from "@/types/audience";
import { resolveEffectiveRole, AppRole } from "@/types/roles";

const baseUser = {
  id: "u1",
  active: true,
  contractStatus: "ACTIVE",
  contractType: "TEMPORARY",
  economicGroup: "Grupo Alpha",
  cnpj: "11.222.333/0001-81",
  healthPlan: "Plano A",
  reimbursementCard: "Cartao X",
  clientOrgId: "org-alpha",
  roles: ["COLLABORATOR"],
};

describe("audience matching", () => {
  it("ALL matches active users", () => {
    expect(userMatchesAudience(baseUser, AudienceType.ALL, [])).toBe(true);
    expect(userMatchesAudience({ ...baseUser, active: false }, AudienceType.ALL, [])).toBe(false);
  });

  it("FILTERED requires AND of targets", () => {
    const targets = [
      { targetType: AudienceTargetType.CONTRACT_TYPE, targetValue: "TEMPORARY" },
      { targetType: AudienceTargetType.ECONOMIC_GROUP, targetValue: "Grupo Alpha" },
    ];
    expect(userMatchesAudience(baseUser, AudienceType.FILTERED, targets)).toBe(true);
    expect(
      userMatchesAudience(
        { ...baseUser, economicGroup: "Outro" },
        AudienceType.FILTERED,
        targets,
      ),
    ).toBe(false);
  });

  it("client visibility uses CNPJ / group", () => {
    expect(
      communicationVisibleToClient(
        AudienceType.FILTERED,
        [{ targetType: AudienceTargetType.CNPJ, targetValue: "11222333000181" }],
        baseUser,
      ),
    ).toBe(true);
  });
});

describe("resolveEffectiveRole", () => {
  it("forces candidate without active contract", () => {
    expect(
      resolveEffectiveRole({
        roles: [AppRole.COLLABORATOR],
        contractStatus: "NONE",
      }),
    ).toBe(AppRole.CANDIDATE);
  });

  it("keeps METARH even without contract", () => {
    expect(
      resolveEffectiveRole({
        roles: [AppRole.METARH],
        contractStatus: null,
      }),
    ).toBe(AppRole.METARH);
  });
});
