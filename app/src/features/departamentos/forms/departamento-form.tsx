"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  departamentoSchema,
  type DepartamentoPayload,
} from "../schemas/departamento-schema";

type DepartamentoFormProps = {
  onSubmit: (values: DepartamentoPayload) => Promise<void>;
};

export function DepartamentoForm({ onSubmit }: DepartamentoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DepartamentoPayload>({
    resolver: zodResolver(departamentoSchema),
    defaultValues: {
      nome: "",
    },
  });

  return (
    <form
      className="departamento-form"
      onSubmit={handleSubmit(async (values) => {
        try {
          await onSubmit(values);
          reset();
        } catch {
          return;
        }
      })}
    >
      <div className="form-field">
        <label htmlFor="nome">Nome</label>
        <input id="nome" type="text" {...register("nome")} />
        {errors.nome ? <p role="alert">{errors.nome.message}</p> : null}
      </div>

      <button type="submit" disabled={isSubmitting}>
        Salvar departamento
      </button>
    </form>
  );
}
