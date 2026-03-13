"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const departamentoFormSchema = z.object({
  nome: z.string().trim().min(1, "Nome e obrigatorio"),
});

export type DepartamentoFormValues = z.infer<typeof departamentoFormSchema>;

type DepartamentoFormProps = {
  onSubmit: (values: DepartamentoFormValues) => void | Promise<void>;
};

export function DepartamentoForm({ onSubmit }: DepartamentoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DepartamentoFormValues>({
    resolver: zodResolver(departamentoFormSchema),
    defaultValues: {
      nome: "",
    },
  });

  return (
    <form
      className="departamento-form"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
        reset();
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
