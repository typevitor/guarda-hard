import { DomainError } from '../../../../shared/domain/domain-error.base';

export class EmprestimoJaDevolvidoError extends DomainError {
  constructor() {
    super('Emprestimo ja foi devolvido');
  }
}
