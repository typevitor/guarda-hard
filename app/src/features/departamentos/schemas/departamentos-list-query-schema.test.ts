import { describe, expect, it } from "vitest";

import { departamentosListQuerySchema } from "./departamentos-list-query-schema";

describe("departamentosListQuerySchema", () => {
  it("normalizes missing and invalid query values", () => {
    expect(
      departamentosListQuerySchema.parse({
        page: "0",
        search: "   ",
      }),
    ).toEqual({
      page: 1,
      pageSize: 10,
      search: "",
    });
  });

  it("uses first value when query params are arrays", () => {
    expect(
      departamentosListQuerySchema.parse({
        page: ["3", "9"],
        search: ["  suporte  ", "ignored"],
      }),
    ).toEqual({
      page: 3,
      pageSize: 10,
      search: "suporte",
    });
  });
});
