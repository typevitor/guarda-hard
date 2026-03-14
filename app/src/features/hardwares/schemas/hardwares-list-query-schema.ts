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

const parseOptionalBoolean = (value: string | undefined): boolean | undefined => {
  if (value === undefined || value === "") {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

export const hardwaresListQuerySchema = z
  .object({
    page: z.union([z.string(), z.array(z.string())]).optional(),
    search: z.union([z.string(), z.array(z.string())]).optional(),
    livre: z.union([z.string(), z.array(z.string())]).optional(),
    funcionando: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .transform(({ page, search, livre, funcionando }) => ({
    page: parsePage(parseSingleParam(page)),
    pageSize: 10 as const,
    search: parseSingleParam(search)?.trim() ?? "",
    livre: parseOptionalBoolean(parseSingleParam(livre)),
    funcionando: parseOptionalBoolean(parseSingleParam(funcionando)),
  }));

export type HardwaresListQuery = z.infer<typeof hardwaresListQuerySchema>;
