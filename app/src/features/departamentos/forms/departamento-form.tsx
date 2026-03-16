'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { departamentoSchema, type DepartamentoPayload } from '../schemas/departamento-schema';

type DepartamentoFormProps = {
  onSubmit: (values: DepartamentoPayload) => Promise<void>;
  onCancel?: () => void;
};

export function DepartamentoForm({ onSubmit, onCancel }: DepartamentoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DepartamentoPayload>({
    resolver: zodResolver(departamentoSchema),
    defaultValues: {
      nome: '',
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
        <input id="nome" type="text" {...register('nome')} />
        {errors.nome ? <p role="alert">{errors.nome.message}</p> : null}
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
