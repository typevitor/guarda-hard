import { DomainError } from '../../../../shared/domain/domain-error.base';

export class HardwareDefeituosoError extends DomainError {
  constructor() {
    super('Hardware defeituoso nao pode ser emprestado');
  }
}
