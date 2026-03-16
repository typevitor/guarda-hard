'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type { HardwareOption } from '@/features/hardwares/server/hardwares-options-api';
import type { UsuarioOption } from '@/features/usuarios/server/usuarios-options-api';

import { emprestimoSchema, type EmprestimoPayload } from '../schemas/emprestimo-schema';

type EmprestimoFormProps = {
  onSubmit: (values: EmprestimoPayload) => Promise<void>;
  onCancel?: () => void;
  usuarioOptions: UsuarioOption[];
  hardwareOptions: HardwareOption[];
  usuarioOptionsError?: string | null;
  hardwareOptionsError?: string | null;
  disableSubmit?: boolean;
};

export function EmprestimoForm({
  onSubmit,
  onCancel,
  usuarioOptions,
  hardwareOptions,
  usuarioOptionsError = null,
  hardwareOptionsError = null,
  disableSubmit = false,
}: EmprestimoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmprestimoPayload>({
    resolver: zodResolver(emprestimoSchema),
    defaultValues: {
      usuarioId: '',
      hardwareId: '',
    },
  });

  const hasUsuarioOptionsError = Boolean(usuarioOptionsError && usuarioOptionsError.trim().length > 0);
  const hasHardwareOptionsError = Boolean(
    hardwareOptionsError && hardwareOptionsError.trim().length > 0,
  );

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
      {hasUsuarioOptionsError ? <p role="alert">{usuarioOptionsError}</p> : null}
      {hasHardwareOptionsError ? <p role="alert">{hardwareOptionsError}</p> : null}

      <div className="form-field">
        <label htmlFor="usuarioId">Usuario</label>
        <select id="usuarioId" {...register('usuarioId')} required>
          <option value="">Selecione um usuario</option>
          {usuarioOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.nome}
            </option>
          ))}
        </select>
        {errors.usuarioId ? <p role="alert">{errors.usuarioId.message}</p> : null}
      </div>

      <div className="form-field">
        <label htmlFor="hardwareId">Hardware</label>
        <select id="hardwareId" {...register('hardwareId')} required>
          <option value="">Selecione um hardware</option>
          {hardwareOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {`${option.descricao} - ${option.marca} ${option.modelo} (${option.codigoPatrimonio})`}
            </option>
          ))}
        </select>
        {errors.hardwareId ? <p role="alert">{errors.hardwareId.message}</p> : null}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting || disableSubmit}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
