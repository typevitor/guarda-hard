import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const relatorioFiltrosSchema = z
  .object({
    status: z.enum(["", "disponivel", "emprestado", "defeituoso"]),
    periodoInicio: z
      .string()
      .trim()
      .refine((value) => value.length === 0 || DATE_PATTERN.test(value), {
        message: "Data inicial invalida",
      }),
    periodoFim: z
      .string()
      .trim()
      .refine((value) => value.length === 0 || DATE_PATTERN.test(value), {
        message: "Data final invalida",
      }),
    usuario: z.string().trim(),
    hardware: z.string().trim(),
  })
  .refine(
    (value) => {
      if (!value.periodoInicio || !value.periodoFim) {
        return true;
      }

      return value.periodoInicio <= value.periodoFim;
    },
    {
      message: "Periodo inicial deve ser anterior ao final",
      path: ["periodoFim"],
    },
  );

export type RelatorioFiltrosPayload = z.infer<typeof relatorioFiltrosSchema>;

export const relatorioFiltrosDefaultValues: RelatorioFiltrosPayload = {
  status: "",
  periodoInicio: "",
  periodoFim: "",
  usuario: "",
  hardware: "",
};

export function buildRelatorioQueryString(values: RelatorioFiltrosPayload): string {
  const parsed = relatorioFiltrosSchema.parse(values);
  const query = new URLSearchParams();

  if (parsed.status) {
    query.set("status", parsed.status);
  }

  if (parsed.periodoInicio) {
    query.set("periodoInicio", parsed.periodoInicio);
  }

  if (parsed.periodoFim) {
    query.set("periodoFim", parsed.periodoFim);
  }

  if (parsed.usuario) {
    query.set("usuario", parsed.usuario);
  }

  if (parsed.hardware) {
    query.set("hardware", parsed.hardware);
  }

  return query.toString();
}
