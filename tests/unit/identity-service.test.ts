import { describe, expect, it } from "vitest";
import { mapGroupsToRoles } from "@/services/identity-service";
import { AppRole } from "@/types/roles";

describe("mapGroupsToRoles", () => {
  it("concede COMMUNICATOR quando o grupo está presente", () => {
    expect(mapGroupsToRoles(["g-com"], ["g-com"])).toEqual([
      AppRole.COLLABORATOR,
      AppRole.COMMUNICATOR,
    ]);
  });

  it("todo autenticado é colaborador", () => {
    expect(mapGroupsToRoles([], ["g-com"])).toEqual([AppRole.COLLABORATOR]);
  });
});
