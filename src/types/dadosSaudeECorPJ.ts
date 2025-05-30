export interface DadosSaudeECorPJ {
  nom_empresa: string;
  num_cnpj: string;
  dsc_email: string | null;
  num_celular: string | null;
  dsc_empresa: string;
  cidade: string;
  bairro: string;
  uf: string;
  logradouro: string;
  numero: string;
  cep: string;
  complemento?: string | null;
}
