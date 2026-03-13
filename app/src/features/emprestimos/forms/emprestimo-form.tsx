"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  emprestimoSchema,
  type EmprestimoPayload,
} from "../schemas/emprestimo-schema";

type EmprestimoFormProps = {
  onSubmit: (values: EmprestimoPayload) => Promise<void>;
};

export function EmprestimoForm({ onSubmit }: EmprestimoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmprestimoPayload>({
    resolver: zodResolver(emprestimoSchema),
    defaultValues: {
      usuarioId: "",
      hardwareId: "",
    },
  });

  return (
    <form
      className="emprestimo-form"
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
        <label htmlFor="usuarioId">Usuario</label>
        <input id="usuarioId" type="text" {...register("usuarioId")} />
        {errors.usuarioId ? <p role="alert">{errors.usuarioId.message}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="hardwareId">Hardware</label>
        <input id="hardwareId" type="text" {...register("hardwareId")} />
        {errors.hardwareId ? <p role="alert">{errors.hardwareId.message}</p> : null}
      </div>

      <button type="submit" disabled={isSubmitting}>
        Registrar emprestimo
      </button>
    </form>
  );
}
