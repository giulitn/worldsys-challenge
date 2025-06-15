export interface Cliente {
  nombreCompleto: string;
  dni: number;
  estado: string;
  fechaIngreso: Date;
  esPep: boolean;
  esSujetoObligado: boolean | null;
}

export interface ValidParsedLine {
  data: Cliente;
}

export interface InvalidParsedLine {
  error: string;
  rawLine: string;
}
