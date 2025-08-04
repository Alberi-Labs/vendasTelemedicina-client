import type { NextApiRequest, NextApiResponse } from 'next';

// Configurações do Asaas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/api/v3';

interface DadosVendaPjSimples {
  nomeEmpresa: string;
  cnpj: string;
  formaPagamento: string;
  valorPlano: string;
  idUsuario: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  // Verificar se a API key está configurada
  if (!ASAAS_API_KEY) {
    console.error('❌ ASAAS_API_KEY não está configurada nas variáveis de ambiente');
    return res.status(500).json({ 
      message: 'Configuração de API não encontrada. Contate o administrador.' 
    });
  }

  try {
    const dados: DadosVendaPjSimples = req.body;

    // Validações básicas
    if (!dados.nomeEmpresa || !dados.cnpj || !dados.formaPagamento || !dados.valorPlano) {
      return res.status(400).json({ 
        message: 'Dados incompletos. Nome da empresa, CNPJ, forma de pagamento e valor são obrigatórios.' 
      });
    }

    console.log('🚀 Iniciando processamento de venda PJ simples...');
    console.log(`📊 Empresa: ${dados.nomeEmpresa}`);
    console.log(`💰 Valor: R$ ${dados.valorPlano}`);

    // Gerar assinatura no Asaas
    let paymentLink = '';
    try {
      console.log('💳 Criando assinatura recorrente no Asaas...');
      
      const valorTotal = parseFloat(dados.valorPlano);
      
      paymentLink = await criarAssinaturaAsaas({
        cnpj: "49.937.814/0001-46",
        nomeEmpresa: dados.nomeEmpresa,
        valorTotal,
        formaPagamento: dados.formaPagamento,
        descricao: `Assinatura Plano Saúde e Cor PJ - ${dados.nomeEmpresa} - 12 meses`
      });
      
      console.log('✅ Assinatura criada no Asaas:', paymentLink);
      
    } catch (paymentError) {
      console.error('Erro ao criar assinatura no Asaas:', paymentError);
      return res.status(500).json({ 
        message: 'Erro ao criar assinatura no Asaas',
        error: paymentError instanceof Error ? paymentError.message : 'Erro desconhecido'
      });
    }

    console.log('✅ Processamento concluído com sucesso!');

    return res.status(200).json({
      success: true,
      message: 'Assinatura criada com sucesso',
      paymentLink,
      resumo: {
        empresa: dados.nomeEmpresa,
        valor: dados.valorPlano,
        formaPagamento: dados.formaPagamento,
        tipo: 'Assinatura Recorrente - 12 meses'
      }
    });

  } catch (error) {
    console.error('Erro no processamento da venda PJ:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Funções auxiliares para integração com Asaas

interface DadosAssinaturaAsaas {
  cnpj: string;
  nomeEmpresa: string;
  valorTotal: number;
  formaPagamento: string;
  descricao: string;
}

// Função para buscar ou criar cliente no Asaas
async function buscarOuCriarClienteAsaas(cnpj: string, nomeEmpresa: string): Promise<string> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  try {
    // Primeiro, tenta buscar o cliente pelo CNPJ
    const searchResponse = await fetch(`${ASAAS_BASE_URL}/customers?cpfCnpj=${cnpj}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });

    const searchData = await searchResponse.json();
    
    if (searchData.data && searchData.data.length > 0) {
      console.log('✅ Cliente encontrado no Asaas:', searchData.data[0].id);
      return searchData.data[0].id;
    }

    // Se não encontrou, cria um novo cliente
    console.log('📝 Criando novo cliente no Asaas...');
    const createResponse = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        name: nomeEmpresa,
        cpfCnpj: cnpj,
        personType: 'JURIDICA'
      })
    });

    const createData = await createResponse.json();
    
    if (!createResponse.ok) {
      throw new Error(`Erro ao criar cliente: ${JSON.stringify(createData)}`);
    }

    console.log('✅ Cliente criado no Asaas:', createData.id);
    return createData.id;

  } catch (error) {
    console.error('Erro ao buscar/criar cliente no Asaas:', error);
    throw error;
  }
}

// Função para criar assinatura recorrente no Asaas
async function criarAssinaturaAsaas(dados: DadosAssinaturaAsaas): Promise<string> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  try {
    // Buscar ou criar cliente
    const customerId = await buscarOuCriarClienteAsaas(dados.cnpj, dados.nomeEmpresa);

    // Mapear forma de pagamento
    const billingTypeMap: { [key: string]: string } = {
      'cartao': 'CREDIT_CARD',
      'pix': 'PIX',
      'boleto': 'BOLETO'
    };

    const billingType = billingTypeMap[dados.formaPagamento] || 'BOLETO';

    // Calcular data de início (hoje para pagamento imediato da primeira parcela)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    console.log('📅 Criando assinatura com primeira cobrança hoje:', todayString);

    // Criar assinatura
    const subscriptionResponse = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: billingType,
        nextDueDate: todayString, // Primeira cobrança hoje
        value: dados.valorTotal,
        cycle: 'MONTHLY', // Ciclo mensal
        description: dados.descricao,
        externalReference: `ASSINATURA_PJ_SIMPLES_${Date.now()}`,
        
        // Configurações específicas da assinatura
        endDate: null, // Sem data de fim (assinatura contínua)
        maxPayments: 12, // Máximo 12 pagamentos (12 meses)
        
        // Configurações de cobrança
        fine: {
          value: 2.00,
          type: 'PERCENTAGE'
        },
        interest: {
          value: 1.00,
          type: 'PERCENTAGE'
        },
        
        // Configurações específicas por tipo de pagamento
        ...(billingType === 'CREDIT_CARD' && {
          creditCard: {
            automaticRoutingEnabled: true
          }
        })
      })
    });

    const subscriptionData = await subscriptionResponse.json();

    console.log('📋 Status da resposta da assinatura:', subscriptionResponse.status);
    console.log('📋 Headers da resposta:', Object.fromEntries(subscriptionResponse.headers.entries()));

    if (!subscriptionResponse.ok) {
      console.error('❌ Erro na resposta da assinatura:', subscriptionData);
      throw new Error(`Erro ao criar assinatura: ${JSON.stringify(subscriptionData)}`);
    }

    console.log('✅ Assinatura criada no Asaas:', subscriptionData.id);
    console.log('📊 Dados da assinatura:', {
      id: subscriptionData.id,
      status: subscriptionData.status,
      nextDueDate: subscriptionData.nextDueDate,
      cycle: subscriptionData.cycle,
      value: subscriptionData.value
    });

    // A assinatura já gera automaticamente a primeira cobrança
    // Vamos buscar o link de pagamento diretamente da assinatura
    let paymentUrl = '';

    // Tentar obter link direto da assinatura
    if (subscriptionData.invoiceUrl) {
      paymentUrl = subscriptionData.invoiceUrl;
      console.log('🔗 Usando link da assinatura:', paymentUrl);
    } else {
      // Buscar a primeira cobrança gerada automaticamente pela assinatura
      try {
        console.log('🔍 Buscando cobranças da assinatura...');
        
        const paymentsResponse = await fetch(`${ASAAS_BASE_URL}/payments?subscription=${subscriptionData.id}&limit=1`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'access_token': ASAAS_API_KEY
          }
        });

        if (paymentsResponse.ok) {
          const paymentsText = await paymentsResponse.text();
          console.log('📄 Resposta bruta das cobranças:', paymentsText);
          
          if (paymentsText && paymentsText.trim()) {
            try {
              const paymentsData = JSON.parse(paymentsText);
              
              if (paymentsData.data && paymentsData.data.length > 0) {
                const firstPayment = paymentsData.data[0];
                paymentUrl = firstPayment.invoiceUrl || `${ASAAS_BASE_URL.replace('/v3', '')}/i/${firstPayment.id}`;
                console.log('🎯 Primeira cobrança encontrada:', firstPayment.id);
              }
            } catch (parseError) {
              console.warn('Aviso: Erro ao fazer parse da resposta de cobranças:', parseError);
            }
          } else {
            console.warn('Aviso: Resposta de cobranças vazia ou inválida');
          }
        } else {
          console.warn('Aviso: Erro na requisição de cobranças:', paymentsResponse.status);
        }
      } catch (searchError) {
        console.warn('Aviso: Erro ao buscar cobranças da assinatura:', searchError);
      }

      // Se ainda não temos um link, usar link genérico da assinatura
      if (!paymentUrl) {
        paymentUrl = `${ASAAS_BASE_URL.replace('/v3', '')}/i/${subscriptionData.id}`;
        console.log('🔗 Usando link genérico da assinatura');
      }
    }

    console.log('🔗 Link de pagamento gerado:', paymentUrl);
    
    return paymentUrl;

  } catch (error) {
    console.error('Erro ao criar assinatura no Asaas:', error);
    throw error;
  }
}
