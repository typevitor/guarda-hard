"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import {
  createRegisterSchema,
  type AuthEmpresa,
  type RegisterPayload,
} from "../schemas/auth-schema";

type RegisterFormProps = {
  empresas: AuthEmpresa[];
  onSubmit: (values: RegisterPayload) => Promise<void>;
};

export function RegisterForm({ empresas, onSubmit }: RegisterFormProps) {
  const allowedEmpresaIds = useMemo(() => empresas.map((empresa) => empresa.id), [empresas]);
  const resolverSchema = useMemo(() => createRegisterSchema(allowedEmpresaIds), [allowedEmpresaIds]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterPayload>({
    resolver: zodResolver(resolverSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
      empresaId: "",
    },
  });

  return (
    <form
      className="auth-form"
      onSubmit={handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Nao foi possivel registrar";
          setError("root", { message });
        }
      })}
    >
      {errors.root?.message ? (
        <p role="alert" className="feedback-banner feedback-error">
          {errors.root.message}
        </p>
      ) : null}

      <div className="form-field">
        <label htmlFor="register-nome">Nome</label>
        <input id="register-nome" type="text" autoComplete="name" {...register("nome")} />
        {errors.nome ? <p role="alert">{errors.nome.message}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="register-email">Email</label>
        <input id="register-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p role="alert">{errors.email.message}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="register-senha">Senha</label>
        <input
          id="register-senha"
          type="password"
          autoComplete="new-password"
          {...register("senha")}
        />
        {errors.senha ? <p role="alert">{errors.senha.message}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="register-confirmar-senha">Confirmar senha</label>
        <input
          id="register-confirmar-senha"
          type="password"
          autoComplete="new-password"
          {...register("confirmarSenha")}
        />
        {errors.confirmarSenha ? <p role="alert">{errors.confirmarSenha.message}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="register-empresa">Empresa</label>
        <select id="register-empresa" {...register("empresaId")}>
          <option value="">Selecione...</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nome}
            </option>
          ))}
        </select>
        {errors.empresaId ? <p role="alert">{errors.empresaId.message}</p> : null}
      </div>

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        Criar conta
      </button>
    </form>
  );
}
