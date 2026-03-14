"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { loginSchema, type LoginPayload } from "../schemas/auth-schema";

type LoginFormProps = {
  onSubmit: (values: LoginPayload) => Promise<void>;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  return (
    <form
      className="auth-form"
      onSubmit={handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Nao foi possivel entrar";
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
        <label htmlFor="login-email">Email</label>
        <input id="login-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p role="alert">{errors.email.message}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="login-senha">Senha</label>
        <input
          id="login-senha"
          type="password"
          autoComplete="current-password"
          {...register("senha")}
        />
        {errors.senha ? <p role="alert">{errors.senha.message}</p> : null}
      </div>

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        Entrar
      </button>
    </form>
  );
}
