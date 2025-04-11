export interface Cobranca {
    seq_cobranca: string;
    vlr_pagamento: string | null;
    tip_venda: string;
    tip_pagamento: string;
    dat_referencia: string;
    dat_vencimento: string;
    ind_status_pagamento: string | null;
    tip_status_pagamento: string | null;
    dsc_nosso_numero: string | null;
    dsc_link_pagamento: string | null;
    flg_ativo: string;
    seq_pay: string | null;
  }
  
  export interface DadosSaudeECor {
    seq_cliente: string;
    seq_venda: string;
    seq_produto: string;
    seq_instituicao: string;
    nom_cliente: string;
    num_cpf: string;
    dsc_instituicao: string;
    dsc_produto: string;
    vlr_pagamento: string | null;
    num_parcelas_pagamento: string;
    vlr_parcelas_pagamento: string;
    vlr_netvalue: string | null;
    dat_credito_pagamento: string | null;
    ind_status_pagamento: string;
    tip_status_pagamento: string;
    tip_pagamento: string;
    dsc_link_pagamento: string | null;
    cidade: string | null;
    uf: string | null;
    tip_venda: string;
    flg_ativo: string;
    dsc_usuario_nome: string;
    dat_contrato_vigencia_inicio: string;
    dat_contrato_vigencia_final: string;
    data_contrato_vigencia_inicio: string;
    data_contrato_vigencia_final: string;
    num_contrato_retorno: string;
    dsc_contrato_retorno: string | null;
    dat_contrato_retorno_cancelado_operacao: string | null;
    flg_registro_falso: string;
    num_contrato_retorno_apolice: string;
    num_contrato_retorno_certificado: string;
    cod_contrato_retorno_operacao: string;
    cod_contrato_retorno_cancelado_operacao: string | null;
    cobranca: Cobranca[];
  }