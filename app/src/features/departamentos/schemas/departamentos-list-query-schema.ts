import { z } from "zod";

const parseSingleParam = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const parsePage = (value: string | undefined): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
};

export const departamentosListQuerySchema = z
  .object({
    page: z.union([z.string(), z.array(z.string())]).optional(),
    search: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .transform(({ page, search }) => {
    const normalizedSearch = parseSingleParam(search)?.trim() ?? "";

    return {
      page: parsePage(parseSingleParam(page)),
      pageSize: 10 as const,
      search: normalizedSearch,
    };
  });

export type DepartamentosListQuery = z.infer<typeof departamentosListQuerySchema>;
