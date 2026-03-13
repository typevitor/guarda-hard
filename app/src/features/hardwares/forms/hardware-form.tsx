"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { hardwareSchema, type HardwarePayload } from "../schemas/hardware-schema";

type HardwareFormProps = {
  onSubmit: (values: HardwarePayload) => Promise<void>;
};

export function HardwareForm({ onSubmit }: HardwareFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<HardwarePayload>({
    resolver: zodResolver(hardwareSchema),
    defaultValues: {
      descricao: "",
      codigoPatrimonio: "",
    },
  });

  return (
    <form
      className="hardware-form"
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
        <label htmlFor="descricao">Descricao</label>
        <input id="descricao" type="text" {...register("descricao")} />
        {errors.descricao ? <p role="alert">{errors.descricao.message}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="codigoPatrimonio">Codigo patrimonio</label>
        <input id="codigoPatrimonio" type="text" {...register("codigoPatrimonio")} />
        {errors.codigoPatrimonio ? <p role="alert">{errors.codigoPatrimonio.message}</p> : null}
      </div>

      <button type="submit" disabled={isSubmitting}>
        Salvar hardware
      </button>
    </form>
  );
}
