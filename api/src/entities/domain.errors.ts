export class HardwareNaoDisponivelError extends Error {
  constructor() {
    super('Hardware nao esta disponivel para emprestimo');
  }
}

export class HardwareDefeituosoError extends Error {
  constructor() {
    super('Hardware defeituoso nao pode ser emprestado');
  }
}

export class EmprestimoJaDevolvidoError extends Error {
  constructor() {
    super('Emprestimo ja foi devolvido');
  }
}

export class DescricaoProblemaObrigatoriaError extends Error {
  constructor() {
    super('Descricao do problema e obrigatoria');
  }
}
