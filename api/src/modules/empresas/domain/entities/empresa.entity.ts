export interface EmpresaProps {
  id: string;
  nome: string;
}

export class Empresa {
  readonly id: string;
  readonly nome: string;

  constructor(props: EmpresaProps) {
    this.id = props.id;
    this.nome = props.nome;
  }
}
