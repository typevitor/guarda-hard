"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  buildRelatorioQueryString,
  relatorioFiltrosDefaultValues,
  relatorioFiltrosSchema,
  type RelatorioFiltrosPayload,
} from "../schemas/relatorio-filtros-schema";

type RelatorioFiltrosFormProps = {
  onSubmit: (values: RelatorioFiltrosPayload, queryString: string) => Promise<void>;
};

export function RelatorioFiltrosForm({ onSubmit }: RelatorioFiltrosFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RelatorioFiltrosPayload>({
    resolver: zodResolver(relatorioFiltrosSchema),
    defaultValues: relatorioFiltrosDefaultValues,
  });

  return (
    <form
      className="relatorio-filtros-form"
      onSubmit={handleSubmit(async (values) => {
        const queryString = buildRelatorioQueryString(values);
        await onSubmit(values, queryString);
      })}
    >
      <div className="form-grid two-columns">
        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select id="status" {...register("status")}>
            <option value="">Todos</option>
            <option value="disponivel">Disponivel</option>
            <option value="emprestado">Emprestado</option>
            <option value="defeituoso">Defeituoso</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="usuario">Usuario</label>
          <input id="usuario" type="text" {...register("usuario")} />
        </div>

        <div className="form-field">
          <label htmlFor="hardware">Hardware</label>
          <input id="hardware" type="text" {...register("hardware")} />
        </div>

        <div className="form-field">
          <label htmlFor="periodoInicio">Periodo inicial</label>
          <input id="periodoInicio" type="date" {...register("periodoInicio")} />
          {errors.periodoInicio ? <p role="alert">{errors.periodoInicio.message}</p> : null}
        </div>

        <div className="form-field">
          <label htmlFor="periodoFim">Periodo final</label>
          <input id="periodoFim" type="date" {...register("periodoFim")} />
          {errors.periodoFim ? <p role="alert">{errors.periodoFim.message}</p> : null}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting}>
        Aplicar filtros
      </button>
    </form>
  );
}
