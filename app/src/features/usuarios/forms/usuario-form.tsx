"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { DepartamentoOption } from "@/features/departamentos/server/departamentos-options-api";

import { usuarioSchema, type UsuarioPayload } from "../schemas/usuario-schema";

type UsuarioFormProps = {
  onSubmit: (values: UsuarioPayload) => Promise<void>;
  departamentoOptions: DepartamentoOption[];
  departamentoDisabled?: boolean;
};

export function UsuarioForm({
  onSubmit,
  departamentoOptions,
  departamentoDisabled = false,
}: UsuarioFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UsuarioPayload>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: "",
      email: "",
      departamentoId: "",
    },
  });

  return (
    <form
      className="usuario-form"
      noValidate
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

      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register("email")} />
        {errors.email ? <p role="alert">{errors.email.message}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="departamentoId">Departamento</label>
        <select
          id="departamentoId"
          {...register("departamentoId")}
          disabled={departamentoDisabled}
        >
          <option value="">Sem departamento</option>
          {departamentoOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.nome}
            </option>
          ))}
        </select>
        {errors.departamentoId ? <p role="alert">{errors.departamentoId.message}</p> : null}
      </div>

      <button type="submit" disabled={isSubmitting}>
        Salvar usuario
      </button>
    </form>
  );
}
