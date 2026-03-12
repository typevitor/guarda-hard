import { DomainError } from '../../../../shared/domain/domain-error.base';

export class DescricaoProblemaObrigatoriaError extends DomainError {
  constructor() {
    super('Descricao do problema e obrigatoria');
  }
}
