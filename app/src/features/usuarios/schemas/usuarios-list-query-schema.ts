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

export const usuariosListQuerySchema = z
  .object({
    page: z.union([z.string(), z.array(z.string())]).optional(),
    search: z.union([z.string(), z.array(z.string())]).optional(),
    departamentoId: z.union([z.string(), z.array(z.string())]).optional(),
    ativo: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .transform(({ page, search, departamentoId, ativo }) => ({
    page: parsePage(parseSingleParam(page)),
    pageSize: 10 as const,
    search: parseSingleParam(search)?.trim() ?? "",
    departamentoId: parseSingleParam(departamentoId)?.trim() ?? "",
    ativo: parseOptionalBoolean(parseSingleParam(ativo)),
  }));

export type UsuariosListQuery = z.infer<typeof usuariosListQuerySchema>;
