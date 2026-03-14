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

const parseOptionalDate = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized;
};

const statusSchema = z.enum(["open", "returned"]);

export const emprestimosListQuerySchema = z
  .object({
    page: z.union([z.string(), z.array(z.string())]).optional(),
    search: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([statusSchema, z.array(statusSchema)]).optional(),
    usuarioId: z.union([z.string(), z.array(z.string())]).optional(),
    hardwareId: z.union([z.string(), z.array(z.string())]).optional(),
    retiradaFrom: z.union([z.string(), z.array(z.string())]).optional(),
    retiradaTo: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .transform(({ page, search, status, usuarioId, hardwareId, retiradaFrom, retiradaTo }) => ({
    page: parsePage(parseSingleParam(page)),
    pageSize: 10 as const,
    search: parseSingleParam(search)?.trim() ?? "",
    status: parseSingleParam(status) === "returned" ? "returned" : "open",
    usuarioId: parseSingleParam(usuarioId)?.trim() ?? "",
    hardwareId: parseSingleParam(hardwareId)?.trim() ?? "",
    retiradaFrom: parseOptionalDate(parseSingleParam(retiradaFrom)),
    retiradaTo: parseOptionalDate(parseSingleParam(retiradaTo)),
  }));

export type EmprestimosListQuery = z.infer<typeof emprestimosListQuerySchema>;
