import { describe, expect, it } from "vitest";
import { paginationSchema } from "@/validations/common";

describe("paginationSchema", () => {
  it("aplica defaults", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("rejeita pageSize acima do limite", () => {
    expect(() => paginationSchema.parse({ pageSize: 500 })).toThrow();
  });
});
