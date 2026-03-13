"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  devolucaoSchema,
  type DevolucaoPayload,
} from "../schemas/emprestimo-schema";

type DevolucaoFormProps = {
  onSubmit: (values: DevolucaoPayload) => Promise<void>;
};

export function DevolucaoForm({ onSubmit }: DevolucaoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DevolucaoPayload>({
    resolver: zodResolver(devolucaoSchema),
    defaultValues: {
      emprestimoId: "",
    },
  });

  return (
    <form
      className="devolucao-form"
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
        <label htmlFor="emprestimoId">Emprestimo</label>
        <input id="emprestimoId" type="text" {...register("emprestimoId")} />
        {errors.emprestimoId ? <p role="alert">{errors.emprestimoId.message}</p> : null}
      </div>

      <button type="submit" disabled={isSubmitting}>
        Registrar devolucao
      </button>
    </form>
  );
}
