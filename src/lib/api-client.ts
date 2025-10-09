const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  post(endpoint: string, data: any, options?: RequestInit) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  },

  put(endpoint: string, data: any, options?: RequestInit) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  },

  delete(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  },
};

// Funções específicas para cada módulo
export const authApi = {
  login: (cpf: string, password: string) =>
    apiClient.post('/auth/login', { cpf, password }),
};

export const clientesApi = {
  cadastrar: (clienteData: any) =>
    apiClient.post('/clientes/cadastrar', clienteData),

  // Novo método para cadastro completo de telemedicina
  cadastrarTelemedicina: (clienteData: any) =>
    apiClient.post('/clientes/cadastrar-telemedicina', clienteData),

  consultar: (filtros?: { cpf?: string; id_instituicao?: number }) => {
    console.log('Consultando clientes com filtros:', filtros);
    if (filtros && (filtros.cpf || filtros.id_instituicao)) {
      const params = new URLSearchParams();
      if (filtros.cpf) params.append('cpf', filtros.cpf);
      if (filtros.id_instituicao) params.append('id_instituicao', String(filtros.id_instituicao));
      console.log('Parâmetros da consulta:', params.toString());
      return apiClient.get(`/clientes/consultar?${params.toString()}`);
    }
    return apiClient.get('/clientes/consultar');
  },

  buscarDadosSaudeECor: (cpf: string) =>
    apiClient.post('/clientes/buscar-dados-saudecor', { cpf }),

  editar: (id: number, clienteData: any) =>
    apiClient.put(`/clientes/editar/${id}`, clienteData),

  deletar: (id: number) =>
    apiClient.delete(`/clientes/deletar/${id}`),
};

export const vendaTelemedicinaApi = {
  criar: (vendaData: any) =>
    apiClient.post('/venda-telemedicina/criar', vendaData),

  consultar: (id?: number, filtros?: { id_usuario?: number; id_instituicao?: number }) => {
    if (id) return apiClient.get(`/venda-telemedicina/consultar/${id}`);
    if (filtros && (filtros.id_usuario || filtros.id_instituicao)) {
      const params = new URLSearchParams();
      if (filtros.id_usuario) params.append('id_usuario', String(filtros.id_usuario));
      if (filtros.id_instituicao) params.append('id_instituicao', String(filtros.id_instituicao));
      return apiClient.get(`/venda-telemedicina/consultar?${params.toString()}`);
    }
    return apiClient.get('/venda-telemedicina/consultar');
  },

  deletar: (id: number) =>
    apiClient.delete(`/venda-telemedicina/deletar/${id}`),
};

export const empresasApi = {
  listar: (filtros?: { cnpj?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.cnpj) params.append('cnpj', filtros.cnpj);
    if (filtros?.search) params.append('search', filtros.search);

    const queryString = params.toString();
    const endpoint = queryString ? `/empresas/listar?${queryString}` : '/empresas/listar';

    return apiClient.get(endpoint);
  },

  adicionar: (empresaData: any) =>
    apiClient.post('/empresas/adicionar', empresaData),

  editar: (id: number, empresaData: any) =>
    apiClient.put(`/empresas/editar/${id}`, empresaData),

  deletar: (id: number) =>
    apiClient.delete(`/empresas/deletar/${id}`),
};

export const usuariosApi = {
  buscar: (id?: number) =>
    id ? apiClient.get(`/usuarios/buscar/${id}`)
      : apiClient.get('/usuarios/buscar'),

  cadastrar: (usuarioData: any) =>
    apiClient.post('/usuarios/cadastrar', usuarioData),

  editar: (id: number, usuarioData: any) =>
    apiClient.put(`/usuarios/editar/${id}`, usuarioData),

  deletar: (id: number) =>
    apiClient.delete(`/usuarios/deletar/${id}`),

  reativar: (id: number) =>
    apiClient.put(`/usuarios/reativar/${id}`, {}),
};

export const usuarioApi = {
  buscarUsuario: (idUsuario?: number) => {
    const params = new URLSearchParams();
    if (idUsuario) params.append('idUsuario', idUsuario.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/usuario/buscarUsuario?${queryString}` : '/usuario/buscarUsuario';

    return apiClient.get(endpoint);
  },

  cadastrarClienteUsuario: (dadosUsuario: {
    nome: string;
    email?: string;
    senha?: string;
    telefone?: string;
    perfil?: string;
    cpf: string;
    data_nascimento?: string;
    id_instituicao?: number;
  }) =>
    apiClient.post('/usuario/cadastrarClienteUsuario', dadosUsuario),

  deletarUsuario: (idUsuario: number) => {
    const params = new URLSearchParams({ idUsuario: idUsuario.toString() });
    return apiClient.delete(`/usuario/deletarUsuario?${params.toString()}`);
  },

  editarUsuario: (dadosUsuario: {
    id: number;
    nome?: string;
    email?: string;
    telefone?: string;
    perfil?: string;
    imagem?: string;
    cpf?: string;
    data_nascimento?: string;
    id_instituicao?: number;
  }) =>
    apiClient.put('/usuario/editarUsuario', dadosUsuario),
};

export const apolicesApi = {
  consultar: (cpf: string) => {
    const params = new URLSearchParams({ cpf });
    return apiClient.get(`/apolices/consultar?${params.toString()}`);
  },

  inserir: (file: File, fields?: any) => {
    const formData = new FormData();
    formData.append('file', file);

    if (fields) {
      Object.keys(fields).forEach(key => {
        formData.append(key, fields[key]);
      });
    }

    return apiClient.request('/apolices/inserir', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type para que o browser configure automaticamente para FormData
    });
  },

  gerar: (dados: any) => {
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/apolices/gerar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
  },
};

export const arquivoApi = {
  downloadArquivo: (dscEmpresa: string) => {
    const params = new URLSearchParams({ dscEmpresa });
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/arquivo/downloadArquivo?${params.toString()}`;

    // Retorna a URL para download direto ou para usar com fetch
    return {
      url,
      fetch: () => fetch(url),
    };
  },

  download: (dscEmpresa: string) => {
    const params = new URLSearchParams({ dscEmpresa });
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/arquivo/downloadArquivo?${params.toString()}`;

    // Retorna a URL para download direto ou para usar com fetch
    return {
      url,
      fetch: () => fetch(url),
    };
  },

  listar: () =>
    apiClient.get('/arquivo/listar'),

  verificar: (fileName: string) => {
    const params = new URLSearchParams({ fileName });
    return apiClient.get(`/arquivo/verificar?${params.toString()}`);
  },
};

export const carteirinhaApi = {
  gerar: (dados: {
    nome: string;
    cpf: string;
    vigenciaInicio: string;
    vigenciaFinal: string;
    apolice: string;
    operacao: string;
    certificado: string;
    empresa?: string;
  }) => {
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/carteirinha/gerar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
  },

  gerarDependente: (dados: {
    nome: string;
    cpf: string;
    empresa?: string;
  }) => {
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/carteirinha/gerar-dependente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
  },
};

export const notasFiscaisApi = {
  consultarAsaas: (query: { assinaturaId: string }) => {
    const params = new URLSearchParams(query);
    return apiClient.get(`/notas-fiscais/consultar-asaas?${params.toString()}`);
  },

  consultarAssinaturas: (query: { offset?: number; limit?: number } = {}) => {
    const params = new URLSearchParams(
      Object.entries(query).map(([key, value]) => [key, value?.toString() || ''])
    );
    return apiClient.get(`/notas-fiscais/consultar-assinaturas?${params.toString()}`);
  },

  emitir: (data: {
    empresaNome: string;
    empresaEmail: string;
    empresaTelefone: string;
    empresaCnpj: string;
    empresaEndereco: string;
    clienteNome: string;
    clienteEmail: string;
    clienteCpfCnpj: string;
    descricao: string;
    valor: number;
    observacoes?: string;
    assinaturaId: string;
    serie: string;
  }) => {
    return apiClient.post('/notas-fiscais/emitir', data);
  },

  listar: (query: {
    page?: number;
    limit?: number;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  } = {}) => {
    const params = new URLSearchParams(
      Object.entries(query).map(([key, value]) => [key, value?.toString() || ''])
    );
    return apiClient.get(`/notas-fiscais/listar?${params.toString()}`);
  },

  visualizar: (query: { notaFiscalId: string }) => {
    const params = new URLSearchParams(query);
    return apiClient.get(`/notas-fiscais/visualizar?${params.toString()}`);
  },
};

export const cobrancaApi = {
  consultar: (cpf?: string) => {
    if (cpf) {
      const params = new URLSearchParams({ cpf });
      return apiClient.get(`/cobranca/consultar?${params.toString()}`);
    }
    return apiClient.get('/cobranca/consultar');
  },

  gerar: (dados: {
    nome: string;
    cpf: string;
    email: string;
    telefone?: string;
    valor: number;
    descricao: string;
    dueDate?: string;
    installmentCount?: number;
    installmentValue?: number;
    discount?: {
      value?: number;
      dueDateLimitDays?: number;
      type?: string;
    };
    postalService?: boolean;
  }) => {
    return apiClient.post('/cobranca/gerar', dados);
  },

  atualizar: (id: string, dados: any) =>
    apiClient.put(`/cobranca/atualizar/${id}`, dados),

  deletar: (id: string) =>
    apiClient.delete(`/cobranca/deletar/${id}`),

  gerarPixQr: (dados: {
    nome: string;
    cpf: string;
    email: string;
    valor: number;
    descricao: string;
  }) => {
    return apiClient.post('/cobranca/gerar-pix-qr', dados);
  },
};

export const contratoApi = {
  gerar: (dados: {
    tipoContrato: string;
    dadosCliente: any;
    dadosEmpresa?: any;
    configuracoes?: any;
  }) => {
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/contrato/gerar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
  },

  assinar: (contratoId: string, assinatura: {
    nome: string;
    cpf: string;
    email: string;
    data: string;
  }) => {
    return apiClient.post(`/contrato/assinar/${contratoId}`, assinatura);
  },

  verificar: (cpf: string) => {
    const params = new URLSearchParams({ cpf });
    return apiClient.get(`/contrato/verificar-status?${params.toString()}`);
  },

  baixarContratoAssinado: (cpf: string) => {
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/contrato/baixarContratoAssinado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf_usuario: cpf }),
    });
  },

  salvarAssinatura: (dados: {
    cpf_usuario: string;
    tipo_contrato: string;
    dados_contrato: any;
    assinatura_digital: string;
    ip_assinatura: string;
    user_agent: string;
  }) =>
    apiClient.post('/contrato/salvarAssinatura', dados),

  marcarAssinado: (cpf: string) =>
    apiClient.post('/contrato/marcarAssinado', { cpf }),

  listar: (filtros?: {
    status?: string;
    dataInicio?: string;
    dataFim?: string;
    clienteCpf?: string;
  }) => {
    if (filtros && Object.keys(filtros).length > 0) {
      const params = new URLSearchParams(
        Object.entries(filtros).filter(([, value]) => value).map(([key, value]) => [key, value as string])
      );
      return apiClient.get(`/contrato/listar?${params.toString()}`);
    }
    return apiClient.get('/contrato/listar');
  },
};

export const crmVendasApi = {
  buscar: (usuarioId?: number) => {
    if (usuarioId) {
      const params = new URLSearchParams({ usuarioId: usuarioId.toString() });
      return apiClient.get(`/crm-vendas/buscar?${params.toString()}`);
    }
    return apiClient.get('/crm-vendas/buscar');
  },

  criar: (dados: {
    codigoUsuario: number;
    nomeCliente: string;
    cpfCliente: string;
    emailCliente?: string;
    telefoneCliente?: string;
    statusVenda: string;
    valorVenda?: number;
    observacoes?: string;
    dataContato?: string;
  }) => {
    return apiClient.post('/crm-vendas/criar', dados);
  },

  atualizar: (id: number, dados: any) =>
    apiClient.put(`/crm-vendas/atualizar/${id}`, dados),

  deletar: (id: number) =>
    apiClient.delete(`/crm-vendas/deletar/${id}`),

  relatorio: (filtros?: {
    usuarioId?: number;
    dataInicio?: string;
    dataFim?: string;
    status?: string;
  }) => {
    if (filtros && Object.keys(filtros).length > 0) {
      const params = new URLSearchParams(
        Object.entries(filtros).filter(([, value]) => value).map(([key, value]) => [key, value!.toString()])
      );
      return apiClient.get(`/crm-vendas/relatorio?${params.toString()}`);
    }
    return apiClient.get('/crm-vendas/relatorio');
  },
};

export const dependenteApi = {
  cadastrar: (dados: {
    nomeDependente: string;
    cpfDependente: string;
    emailDependente?: string;
    telefoneDependente?: string;
    parentesco: string;
    cpfTitular: string;
  }) => {
    return apiClient.post('/dependente/cadastrar', dados);
  },

  consultar: (cpfTitular?: string) => {
    if (cpfTitular) {
      const params = new URLSearchParams({ cpfTitular });
      return apiClient.get(`/dependente/consultar?${params.toString()}`);
    }
    return apiClient.get('/dependente/consultar');
  },

  atualizar: (id: number, dados: any) =>
    apiClient.put(`/dependente/atualizar/${id}`, dados),

  deletar: (id: number) =>
    apiClient.delete(`/dependente/deletar/${id}`),

  sincronizar: (dados: { cpfTitular: string; nascimentoTitular?: string } | string) => {
    // Compatibilidade: aceita string (apenas cpfTitular) ou objeto completo
    const payload = typeof dados === 'string'
      ? { cpfTitular: dados }
      : dados;
    return apiClient.post('/dependente/sincronizar', payload);
  },
};

export const instituicoesApi = {
  listar: (filtros?: {
    nome?: string;
    tipo?: string;
    ativo?: boolean;
  }) => {
    if (filtros && Object.keys(filtros).length > 0) {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
      return apiClient.get(`/instituicoes/buscar?${params.toString()}`);
    }
    return apiClient.get('/instituicoes/buscar');
  },

  criar: (dados: {
    nome: string;
    tipo: string;
    endereco?: string;
    telefone?: string;
    email?: string;
    responsavel?: string;
    ativo?: boolean;
  }) => {
    return apiClient.post('/instituicoes/criar', dados);
  },

  atualizar: (id: number, dados: any) =>
    apiClient.put(`/instituicoes/atualizar/${id}`, dados),

  deletar: (id: number) =>
    apiClient.delete(`/instituicoes/deletar/${id}`),

  upload: (file: File, instituicaoId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('instituicaoId', instituicaoId.toString());

    return apiClient.request('/instituicoes/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type para FormData
    });
  },
};

// Wrapper específico para as rotas de empresa (empresa = instituicao) usadas na página de gestão
// Mantém compatibilidade com endpoints já existentes no front original (buscarEmpresa, criarEmpresa, editarEmpresa, deletarEmpresa)
export const instituicoesEmpresaApi = {
  buscar: () => apiClient.get('/instituicoes/buscar'),

  criar: (dados: FormData | Record<string, any>) => {
    if (dados instanceof FormData) {
      return apiClient.request('/instituicoes/criar', {
        method: 'POST',
        body: dados,
        headers: {}, // deixa o browser setar boundary do multipart
      });
    }
    return apiClient.post('/instituicoes/criar', dados);
  },

  // ⬇️ agora exige o id na URL (PUT /instituicoes/editar/:id)
  editar: (idInstituicao: number, dados: FormData | Record<string, any>) => {
    if (dados instanceof FormData) {
      return apiClient.request(`/instituicoes/editar/${idInstituicao}`, {
        method: 'PUT',
        body: dados,
        headers: {},
      });
    }
    return apiClient.put(`/instituicoes/editar/${idInstituicao}`, dados);
  },

  // ⬇️ rota correta (DELETE /instituicoes/deletar/:id)
  deletar: (id: number) => apiClient.delete(`/instituicoes/deletar/${id}`),
};


export const clienteSaudeeCorApi = {
  consultar: (cpf: string) => {
    const params = new URLSearchParams({ cpf });
    return apiClient.get(`/cliente-saudeecor?${params.toString()}`);
  },
};

export const relatorioAsaasApi = {
  buscarClientes: () =>
    apiClient.get('/relatorio-asaas/buscar-clientes'),

  buscarCobrancas: () =>
    apiClient.get('/relatorio-asaas/buscar-cobrancas'),

  uploadArquivo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.request('/relatorio-asaas/upload-arquivo', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type para FormData
    });
  },

  vincularCliente: (registros: Array<{
    nom_cliente?: string;
    nom_empresa?: string;
    num_cpf?: string;
    num_cnpj?: string;
    dsc_email?: string;
    num_celular?: string;
    dsc_instituicao?: string;
    quantidade_vidas?: string | number;
  }>) => {
    return apiClient.post('/relatorio-asaas/vincular-cliente', registros);
  },
};

export const vendaConsultaApi = {
  consultar: (id_cliente?: number) => {
    const params = new URLSearchParams();
    if (id_cliente) params.append('id_cliente', id_cliente.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/vendaConsulta/consultar?${queryString}` : '/vendaConsulta/consultar';

    return apiClient.get(endpoint);
  },

  criar: (novaVenda: {
    id_cliente: number;
    data: string;
    valor: number;
    forma_pagamento: string;
    status_pagamento: string;
    data_pagamento?: string | null;
  }) =>
    apiClient.post('/vendaConsulta/criar', novaVenda),

  deletar: (idVenda: number) => {
    const params = new URLSearchParams({ idVenda: idVenda.toString() });
    return apiClient.delete(`/vendaConsulta/deletar?${params.toString()}`);
  },
};

export const vendaPlanoPf = {
  cadastroClientePf: (dados: any) =>
    apiClient.post('/vendaPlanoPf/cadastroClientePf', dados),

  cadastroClientePfDB: (dados: any) =>
    apiClient.post('/vendaPlanoPf/cadastroClientePfDB', dados),

  cadastroSaudeECor: (dados: any) =>
    apiClient.post('/vendaPlanoPf/cadastroSaudeECor', dados),

  gerarCobrancaPf: (dados: any) =>
    apiClient.post('/vendaPlanoPf/gerarCobrancaPf', dados),

  vendaClienteOnline: (dados: any) =>
    apiClient.post('/vendaPlanoPf/vendaClienteOnlline', dados),

  vendaClientePf: (dados: any) =>
    apiClient.post('/vendaPlanoPf/vendaClientePf', dados),
};

// Venda Plano PJ (compatível com o padrão camelCase usado no backend)
export const vendaPlanoPj = {
  // Envia CSV (em base64) para upload de vidas no Saúde e Cor
  subirVidaSaudeECor: (dados: {
    instituicao: string;
    arquivoBase64: string; // data URL ou base64 puro do CSV
  }) => apiClient.post('/vendaPlanoPj/subirVidaSaudeECor', dados),

  // Cria assinatura simples PJ (sem lista de funcionários)
  vendaClientePj: (dados: {
    nomeEmpresa: string;
    cnpj: string;
    formaPagamento: string; // PIX, CREDIT_CARD, BOLETO, etc.
    valorPlano: string; // enviado como string no backend
    idUsuario: string;
  }) => apiClient.post('/vendaPlanoPj/vendaClientePj', dados),

  // Processa venda PJ Saúde e Cor (com funcionários)
  vendaPjSaudeECor: (dados: {
    nomeEmpresa: string;
    cnpj: string;
    formaPagamento: string;
    valorPlano: string;
    idUsuario: string;
    funcionarios: Array<{
      nome: string;
      cpf: string;
      dataNascimento: string;
      codigoPlano?: string;
      uf: string;
      sexo: string;
    }>;
  }) => apiClient.post('/vendaPlanoPj/vendaPjSaudeECor', dados),
};

// Alias compatível com as rotas camelCase do backend de venda telemedicina
export const vendaTelemedicinaApiCompat = {
  // Novos métodos para lógica separada (USAR ESTES)
  criarAssinatura: (assinaturaData: any) =>
    apiClient.post('/vendaTelemedicina/criarAssinatura', assinaturaData),

  // Métodos de consulta
  consultarVenda: (id_usuario?: number, filtros?: { id_instituicao?: number }) => {
    const params = new URLSearchParams();
    if (id_usuario !== undefined) params.append('id_usuario', id_usuario.toString());
    if (filtros?.id_instituicao) params.append('id_instituicao', filtros.id_instituicao.toString());
    const qs = params.toString();
    const endpoint = qs
      ? `/vendaTelemedicina/consultar?${qs}`
      : '/vendaTelemedicina/consultar';
    return apiClient.get(endpoint);
  },

  // Vida Sulamerica
  criarVidaSulamerica: (vidaData: any) =>
    apiClient.post('/vendaTelemedicina/vida-sulamerica', vidaData),

  cancelarVidaSulamerica: (cancelarData: any) =>
    apiClient.post('/vendaTelemedicina/cancelar-vida-sulamerica', cancelarData),

  // Cancelamento de assinatura Asaas
  cancelarAssinatura: (cancelarData: { idVenda: number; motivo?: string }) =>
    apiClient.post('/vendaTelemedicina/cancelar-assinatura', cancelarData),

  // Métodos de delete
  deletarVenda: (idVenda: number) => {
    return apiClient.delete(`/vendaTelemedicina/deletar/${idVenda}`);
  },

  // ===== MÉTODOS LEGADOS (MANTER POR COMPATIBILIDADE) =====
  criarVenda: (vendaData: any) =>
    apiClient.post('/vendaTelemedicina/criarVenda', vendaData),

  criarPf: (vendaData: any) =>
    apiClient.post('/vendaTelemedicina/criarPf', vendaData),

  deletarPf: (idVenda: number) => {
    return apiClient.delete(`/vendaTelemedicina/deletar/${idVenda}`);
  },
};

// API específica para operações com Asaas
export const asaasApiClient = {
  buscarCliente: (filtros: {
    cpf?: string;
    cnpj?: string;
    email?: string;
    name?: string;
  }) => {
    const params = new URLSearchParams();
    if (filtros.cpf) params.append('cpf', filtros.cpf);
    if (filtros.cnpj) params.append('cnpj', filtros.cnpj);
    if (filtros.email) params.append('email', filtros.email);
    if (filtros.name) params.append('name', filtros.name);

    const queryString = params.toString();
    const endpoint = queryString ? `/asaas-api/buscar-cliente?${queryString}` : '/asaas-api/buscar-cliente';

    return apiClient.get(endpoint);
  },

  buscarCobrancasCliente: (customerId: string, filtros: {
    status?: string;
    billingType?: string;
    dateCreatedGE?: string;
    dateCreatedLE?: string;
    paymentDateGE?: string;
    paymentDateLE?: string;
    estimatedCreditDateGE?: string;
    estimatedCreditDateLE?: string;
    dueDate?: string;
    dueDateGE?: string;
    dueDateLE?: string;
    user?: string;
    subscription?: string;
    installment?: string;
    offset?: number;
    limit?: number;
  } = {}) => {
    const params = new URLSearchParams();
    if (filtros.status) params.append('status', filtros.status);
    if (filtros.billingType) params.append('billingType', filtros.billingType);
    if (filtros.dateCreatedGE) params.append('dateCreatedGE', filtros.dateCreatedGE);
    if (filtros.dateCreatedLE) params.append('dateCreatedLE', filtros.dateCreatedLE);
    if (filtros.paymentDateGE) params.append('paymentDateGE', filtros.paymentDateGE);
    if (filtros.paymentDateLE) params.append('paymentDateLE', filtros.paymentDateLE);
    if (filtros.estimatedCreditDateGE) params.append('estimatedCreditDateGE', filtros.estimatedCreditDateGE);
    if (filtros.estimatedCreditDateLE) params.append('estimatedCreditDateLE', filtros.estimatedCreditDateLE);
    if (filtros.dueDate) params.append('dueDate', filtros.dueDate);
    if (filtros.dueDateGE) params.append('dueDateGE', filtros.dueDateGE);
    if (filtros.dueDateLE) params.append('dueDateLE', filtros.dueDateLE);
    if (filtros.user) params.append('user', filtros.user);
    if (filtros.subscription) params.append('subscription', filtros.subscription);
    if (filtros.installment) params.append('installment', filtros.installment);
    if (filtros.offset) params.append('offset', filtros.offset.toString());
    if (filtros.limit) params.append('limit', filtros.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/asaas-api/buscar-cobrancas/${customerId}?${queryString}`
      : `/asaas-api/buscar-cobrancas/${customerId}`;

    return apiClient.get(endpoint);
  },

  buscarCobrancas: (filtros: {
    customer?: string;
    status?: string;
    billingType?: string;
    dateCreatedGE?: string;
    dateCreatedLE?: string;
    paymentDateGE?: string;
    paymentDateLE?: string;
    estimatedCreditDateGE?: string;
    estimatedCreditDateLE?: string;
    dueDate?: string;
    dueDateGE?: string;
    dueDateLE?: string;
    user?: string;
    subscription?: string;
    installment?: string;
    offset?: number;
    limit?: number;
  } = {}) => {
    const params = new URLSearchParams();
    if (filtros.customer) params.append('customer', filtros.customer);
    if (filtros.status) params.append('status', filtros.status);
    if (filtros.billingType) params.append('billingType', filtros.billingType);
    if (filtros.dateCreatedGE) params.append('dateCreatedGE', filtros.dateCreatedGE);
    if (filtros.dateCreatedLE) params.append('dateCreatedLE', filtros.dateCreatedLE);
    if (filtros.paymentDateGE) params.append('paymentDateGE', filtros.paymentDateGE);
    if (filtros.paymentDateLE) params.append('paymentDateLE', filtros.paymentDateLE);
    if (filtros.estimatedCreditDateGE) params.append('estimatedCreditDateGE', filtros.estimatedCreditDateGE);
    if (filtros.estimatedCreditDateLE) params.append('estimatedCreditDateLE', filtros.estimatedCreditDateLE);
    if (filtros.dueDate) params.append('dueDate', filtros.dueDate);
    if (filtros.dueDateGE) params.append('dueDateGE', filtros.dueDateGE);
    if (filtros.dueDateLE) params.append('dueDateLE', filtros.dueDateLE);
    if (filtros.user) params.append('user', filtros.user);
    if (filtros.subscription) params.append('subscription', filtros.subscription);
    if (filtros.installment) params.append('installment', filtros.installment);
    if (filtros.offset) params.append('offset', filtros.offset.toString());
    if (filtros.limit) params.append('limit', filtros.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/asaas-api/buscar-cobrancas?${queryString}`
      : '/asaas-api/buscar-cobrancas';

    return apiClient.get(endpoint);
  },

  obterClientePorId: (id: string) =>
    apiClient.get(`/asaas-api/cliente/${id}`),

  obterCobrancaPorId: (id: string) =>
    apiClient.get(`/asaas-api/cobranca/${id}`),

  // Função específica para buscar pagamentos pendentes - ideal para controle de pagamentos
  buscarPagamentosPendentes: (filtros: {
    dateCreatedGE?: string;
    dateCreatedLE?: string;
    dueDateGE?: string;
    dueDateLE?: string;
    customer?: string;
    billingType?: string;
    offset?: number;
    limit?: number;
  } = {}) => {
    const params = new URLSearchParams();
    if (filtros.dateCreatedGE) params.append('dateCreatedGE', filtros.dateCreatedGE);
    if (filtros.dateCreatedLE) params.append('dateCreatedLE', filtros.dateCreatedLE);
    if (filtros.dueDateGE) params.append('dueDateGE', filtros.dueDateGE);
    if (filtros.dueDateLE) params.append('dueDateLE', filtros.dueDateLE);
    if (filtros.customer) params.append('customer', filtros.customer);
    if (filtros.billingType) params.append('billingType', filtros.billingType);
    if (filtros.offset) params.append('offset', filtros.offset.toString());
    if (filtros.limit) params.append('limit', filtros.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/asaas-api/pagamentos-pendentes?${queryString}`
      : '/asaas-api/pagamentos-pendentes';

    return apiClient.get(endpoint);
  },

  // Função otimizada para buscar TODAS as cobranças de um CPF (todos os clientes com esse CPF)
  buscarTodasCobrancasPorCpf: (cpf: string) =>
    apiClient.get(`/asaas-api/cobrancas/cpf/${cpf}`),

  criarCobrancas: (dados: {
    cpf?: string;
    customerId?: string;
    value: number;
    description?: string;
    billingType?: string;
    firstDueDate: string; // YYYY-MM-DD
    months?: number; // quantidade de meses
    intervalMonths?: number; // espaçamento entre dueDates
  }) => apiClient.post('/asaas-api/cobrancas', dados),

  configurarNotificacoes: (customerId: string, enable: boolean = true) =>
    apiClient.post(`/asaas-api/clientes/${customerId}/notificacoes/configurar`, { enable }),

  listarNotificacoes: (customerId: string) =>
    apiClient.get(`/asaas-api/clientes/${customerId}/notificacoes`),
  // dentro de `export const asaasApiClient = { ... }` adicione:
  buscarCobrancasVencimentoMensal: (filtros: {
    mes?: number | string;
    ano?: number | string;
    offsetMeses?: number | string;
    order?: 'asc' | 'desc';
    customer?: string;
    status?: string;
    billingType?: string;
    user?: string;
    subscription?: string;
    installment?: string;
    offset?: number;
    limit?: number;
  } = {}) => {
    const params = new URLSearchParams();

    if (filtros.mes != null) params.append('mes', String(filtros.mes));
    if (filtros.ano != null) params.append('ano', String(filtros.ano));
    if (filtros.offsetMeses != null) params.append('offsetMeses', String(filtros.offsetMeses));
    if (filtros.order) params.append('order', filtros.order);

    if (filtros.customer) params.append('customer', filtros.customer);
    if (filtros.status) params.append('status', filtros.status);
    if (filtros.billingType) params.append('billingType', filtros.billingType);
    if (filtros.user) params.append('user', filtros.user);
    if (filtros.subscription) params.append('subscription', filtros.subscription);
    if (filtros.installment) params.append('installment', filtros.installment);
    if (filtros.offset != null) params.append('offset', String(filtros.offset));
    if (filtros.limit != null) params.append('limit', String(filtros.limit));

    const qs = params.toString();
    const endpoint = qs
      ? `/asaas-api/cobrancas/vencimento-mensal?${qs}`
      : `/asaas-api/cobrancas/vencimento-mensal`;

    return apiClient.get(endpoint);
  },

  // Busca cobranças do mês para uma instituição específica
  buscarCobrancasMesInstituicao: (filtros: {
    id_instituicao?: number;
    mes?: number | string;
    ano?: number | string;
    order?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
    streaming?: boolean;
  } = {}) => {
    const params = new URLSearchParams();

    if (filtros.id_instituicao != null) params.append('id_instituicao', String(filtros.id_instituicao));
    if (filtros.mes != null) params.append('mes', String(filtros.mes));
    if (filtros.ano != null) params.append('ano', String(filtros.ano));
    if (filtros.order) params.append('order', filtros.order);
    if (filtros.page != null) params.append('page', String(filtros.page));
    if (filtros.pageSize != null) params.append('pageSize', String(filtros.pageSize));
    if (filtros.streaming) params.append('streaming', 'true');

    const qs = params.toString();
    const endpoint = qs
      ? `/asaas-api/cobrancas/mes-instituicao?${qs}`
      : `/asaas-api/cobrancas/mes-instituicao`;

    return apiClient.get(endpoint);
  },

  // Stream (SSE) de cobranças mensais por instituição
  streamCobrancasMesInstituicao: (
    params: {
      id_instituicao: number;
      mes?: number | string;
      ano?: number | string;
      order?: 'asc' | 'desc';
    },
    handlers: {
      onMetaInicial?: (data: any) => void;
      onBatch?: (data: any) => void;
      onDone?: (data: any) => void;
      onErro?: (data: any) => void;
      onRawEvent?: (evt: MessageEvent) => void;
    }
  ) => {
    const qs = new URLSearchParams();
    qs.append('id_instituicao', String(params.id_instituicao));
    if (params.mes != null) qs.append('mes', String(params.mes));
    if (params.ano != null) qs.append('ano', String(params.ano));
    if (params.order) qs.append('order', params.order);

    // ✅ use a base absoluta do backend
    const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${BASE}/asaas-api/cobrancas/mes-instituicao/stream?${qs.toString()}`;

    const es = new EventSource(url); // { withCredentials: false } (padrão)

    es.onmessage = (evt) => handlers.onRawEvent?.(evt);
    es.addEventListener('metaInicial', (evt: MessageEvent) => {
      handlers.onRawEvent?.(evt);
      try { handlers.onMetaInicial?.(JSON.parse(evt.data)); } catch { }
    });
    es.addEventListener('batch', (evt: MessageEvent) => {
      handlers.onRawEvent?.(evt);
      try { handlers.onBatch?.(JSON.parse(evt.data)); } catch { }
    });
    es.addEventListener('done', (evt: MessageEvent) => {
      handlers.onRawEvent?.(evt);
      try { handlers.onDone?.(JSON.parse(evt.data)); } catch { }
      es.close();
    });
    es.addEventListener('erro', (evt: MessageEvent) => {
      handlers.onRawEvent?.(evt);
      try { handlers.onErro?.(JSON.parse(evt.data)); } catch { }
    });

    return es;
  },


};




