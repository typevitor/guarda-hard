'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { hardwareSchema, type HardwarePayload } from '../schemas/hardware-schema';

type HardwareFormProps = {
  onSubmit: (values: HardwarePayload) => Promise<void>;
  onCancel?: () => void;
};

export function HardwareForm({ onSubmit, onCancel }: HardwareFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<HardwarePayload>({
    resolver: zodResolver(hardwareSchema),
    defaultValues: {
      descricao: '',
      codigoPatrimonio: '',
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
        <input id="descricao" type="text" {...register('descricao')} />
        {errors.descricao ? <p role="alert">{errors.descricao.message}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="codigoPatrimonio">Codigo patrimonio</label>
        <input id="codigoPatrimonio" type="text" {...register('codigoPatrimonio')} />
        {errors.codigoPatrimonio ? <p role="alert">{errors.codigoPatrimonio.message}</p> : null}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
