import { DomainError } from '../../../../shared/domain/domain-error.base';

export class HardwareNaoDisponivelError extends DomainError {
  constructor() {
    super('Hardware nao esta disponivel para emprestimo');
  }
}
