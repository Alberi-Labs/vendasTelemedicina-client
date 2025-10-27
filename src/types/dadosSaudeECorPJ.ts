export interface Vida {
  nom_cliente: string;
  dsc_produto: string;
  vlr_produto_base: string;
  cod_contrato_retorno_operacao: string;
  num_contrato_retorno_apolice: string;
  num_contrato_retorno_certificado: string;
  num_contrato_retorno_sorteio: string;
}

export interface DadosSaudeECorPJ {
  seq_cobranca: string;
  seq_empresa: string;
  nom_empresa: string;
  num_cnpj: string;
  seq_instituicao: string;
  dsc_instituicao: string;
  num_celular: string | null;
  num_email: string | null;
  vlr_pagamento: string;
  tip_venda: string;
  tip_pagamento: string;
  dat_referencia: string;
  dat_credito_pagamento: string;
  ind_status_pagamento: string;
  tip_status_pagamento: string;
  dsc_nosso_numero: string;
  dsc_link_pagamento: string;
  flg_ativo: string;
  seq_pay: string;
  qtd_vidas: string;
  vidas: Vida[];
}
