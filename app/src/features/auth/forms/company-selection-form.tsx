"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import {
  createSelectEmpresaSchema,
  type AuthEmpresa,
  type SelectEmpresaPayload,
} from "../schemas/auth-schema";

type CompanySelectionFormProps = {
  empresas: AuthEmpresa[];
  onSubmit: (values: SelectEmpresaPayload) => Promise<void>;
};

export function CompanySelectionForm({ empresas, onSubmit }: CompanySelectionFormProps) {
  const allowedEmpresaIds = useMemo(() => empresas.map((empresa) => empresa.id), [empresas]);
  const resolverSchema = useMemo(
    () => createSelectEmpresaSchema(allowedEmpresaIds),
    [allowedEmpresaIds],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SelectEmpresaPayload>({
    resolver: zodResolver(resolverSchema),
    defaultValues: {
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
          const message =
            error instanceof Error ? error.message : "Nao foi possivel selecionar empresa";
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
        <label htmlFor="select-company-empresa">Empresa</label>
        <select id="select-company-empresa" {...register("empresaId")}>
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
        Continuar
      </button>
    </form>
  );
}
