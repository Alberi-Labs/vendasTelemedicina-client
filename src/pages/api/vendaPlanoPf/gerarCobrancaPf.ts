import pool from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";

// Configurações do Asaas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY ? `$${process.env.ASAAS_API_KEY}` : undefined;
const ASAAS_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/api/v3';

interface DadosCobrancaPf {
  clienteId: number;
  nomeCliente: string;
  email: string;
  cpf: string;
  formaDePagamento: string;
  idUsuario: string;
  valorPlano?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const dados: DadosCobrancaPf = req.body;
  console.log("🔸 Requisição recebida para gerar cobrança:", req.body);

  // Verificar se a API key está configurada
  if (!ASAAS_API_KEY) {
    console.error('❌ ASAAS_API_KEY não está configurada nas variáveis de ambiente');
    return res.status(500).json({ 
      error: 'Configuração de API não encontrada. Contate o administrador.' 
    });
  }

  try {

    const valorPlano = dados.valorPlano || 29.90; // Valor padrão do plano PF
    console.log(`💰 Gerando cobrança de R$ ${valorPlano} para o cliente ${dados.nomeCliente}`);

    // Criar assinatura no Asaas
    console.log("🔸 Criando assinatura no Asaas...");
  let paymentLink = '';
  let paymentId = '';
  let subscriptionId = '';

    try {
      // Função modificada para retornar também o id do primeiro pagamento
      const assinaturaResult = await criarAssinaturaAsaasComId({
        cpf: dados.cpf,
        nomeCliente: dados.nomeCliente,
        email: dados.email,
        valorTotal: valorPlano,
        formaPagamento: dados.formaDePagamento,
        descricao: `Plano Telemedicina Básico PF - ${dados.nomeCliente}`
      });
      paymentLink = assinaturaResult.paymentLink;
      paymentId = assinaturaResult.paymentId;
      subscriptionId = assinaturaResult.subscriptionId;
      console.log('✅ Assinatura criada no Asaas:', paymentLink, paymentId, subscriptionId);
    } catch (paymentError) {
      console.error('Erro ao criar assinatura no Asaas:', paymentError);
      return res.status(500).json({ 
        error: 'Erro ao criar assinatura no Asaas',
        details: paymentError instanceof Error ? paymentError.message : 'Erro desconhecido'
      });
    }

    // Configuração automática da nota fiscal
    if (subscriptionId) {
      try {
        const notaFiscalConfig = {
          municipalServiceId: "17.23",
          municipalServiceCode: "8299799",
          municipalServiceName: "Prestação de serviço",
          updatePayment: false,
          deductions: 0.00,
          effectiveDatePeriod: "ON_PAYMENT_CONFIRMATION",
          receivedOnly: true,
          daysBeforeDueDate: 0
        };
        // Usar o endpoint correto para configurar nota fiscal da assinatura
        const notaResponse = await fetch(`${ASAAS_BASE_URL}/subscriptions/${subscriptionId}/invoiceSettings`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'access_token': ASAAS_API_KEY
          },
          body: JSON.stringify(notaFiscalConfig)
        });
        const responseText = await notaResponse.text();
        let notaData;
        try {
          notaData = JSON.parse(responseText);
        } catch (jsonErr) {
          console.error('Resposta inesperada da API de nota fiscal:', responseText);
          throw new Error('Resposta inesperada da API de nota fiscal.');
        }
        if (!notaResponse.ok) {
          console.error('Erro ao configurar nota fiscal:', notaData);
          throw new Error('Erro ao configurar nota fiscal automaticamente');
        }
        console.log('✅ Nota fiscal configurada automaticamente:', notaData);
      } catch (notaError) {
        console.error('Erro ao configurar nota fiscal:', notaError);
        return res.status(500).json({ error: 'Erro ao configurar nota fiscal', details: notaError instanceof Error ? notaError.message : 'Erro desconhecido' });
      }
    }

    // Registrar venda na tabela telemedicina
    console.log("🔸 Registrando venda na tabela telemedicina...");
    
    const insertVendaQuery = `
      INSERT INTO tb_vendas_telemedicina (
        id_usuario, forma_pagamento, link_pagamento, 
        tipo_venda, situacao_pagamento, valor_venda, criado_em
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const [resultVenda] = await pool.execute(insertVendaQuery, [
      dados.idUsuario,
      dados.formaDePagamento,
      paymentLink,
      "pf",
      "pendente",
      valorPlano.toString(),
    ]);

    const vendaId = (resultVenda as any).insertId;
    console.log("✅ Venda registrada na tabela telemedicina com ID:", vendaId);

    return res.status(200).json({
      success: true,
      message: "Cobrança gerada com sucesso!",
      paymentLink,
      vendaId,
      resumo: {
        cliente: dados.nomeCliente,
        email: dados.email,
        cpf: dados.cpf,
        valor: valorPlano,
        formaPagamento: dados.formaDePagamento,
        tipo: 'Plano Telemedicina Básico PF'
      }
    });

  } catch (error) {
    console.error("❌ Erro ao gerar cobrança:", error);
    return res.status(500).json({ 
      error: "Erro ao gerar cobrança",
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Funções auxiliares para integração com Asaas

// Função para criar assinatura e retornar link, id do primeiro pagamento e id da assinatura
async function criarAssinaturaAsaasComId(dados: DadosAssinaturaAsaas): Promise<{ paymentLink: string, paymentId: string, subscriptionId: string }> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  try {
    // Buscar ou criar cliente
    const customerId = await buscarOuCriarClienteAsaas(dados.cpf, dados.nomeCliente, dados.email);

    // Mapear forma de pagamento
    const billingTypeMap: { [key: string]: string } = {
      'cartao': 'CREDIT_CARD',
      'pix': 'PIX',
      'boleto': 'BOLETO'
    };

    const billingType = billingTypeMap[dados.formaPagamento] || 'BOLETO';

    // Calcular datas: primeira cobrança dia 10 do próximo mês, demais sempre dia 15
    const now = new Date();
    let firstDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10);
    if (now.getDate() >= 10) {
      firstDueDate = new Date(now.getFullYear(), now.getMonth() + 2, 10);
    }
    const firstDueDateString = firstDueDate.toISOString().split('T')[0];
    // Próximas cobranças sempre dia 15
    const recurringDueDate = 15;

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
        nextDueDate: firstDueDateString,
        value: dados.valorTotal,
        cycle: 'MONTHLY',
        description: 'Assinatura de Beneficios Saude e Cor',
        externalReference: `ASSINATURA_PF_${Date.now()}`,
        // endDate removido para assinatura sem limite
        fine: { value: 2.00, type: 'PERCENTAGE' },
        interest: { value: 1.00, type: 'PERCENTAGE' },
        splitNextDueDate: true,
        dueDate: recurringDueDate,
        ...(billingType === 'CREDIT_CARD' && { creditCard: { automaticRoutingEnabled: true } })
      })
    });

    const subscriptionData = await subscriptionResponse.json();

    if (!subscriptionResponse.ok) {
      console.error('❌ Erro na resposta da assinatura:', subscriptionData);
      throw new Error(`Erro ao criar assinatura: ${JSON.stringify(subscriptionData)}`);
    }

    // Buscar o primeiro pagamento gerado para a assinatura
    let paymentId = '';
    let paymentUrl = '';
    try {
      const paymentsResponse = await fetch(`${ASAAS_BASE_URL}/payments?subscription=${subscriptionData.id}&limit=1`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'access_token': ASAAS_API_KEY
        }
      });
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsData.data && paymentsData.data.length > 0) {
          const firstPayment = paymentsData.data[0];
          paymentId = firstPayment.id;
          paymentUrl = firstPayment.invoiceUrl || `${ASAAS_BASE_URL.replace('/v3', '')}/i/${firstPayment.id}`;
        }
      }
    } catch (searchError) {
      console.warn('Aviso: Erro ao buscar cobranças da assinatura:', searchError);
    }
    if (!paymentId) {
      throw new Error('Não foi possível obter o id do pagamento recorrente.');
    }
    return { paymentLink: paymentUrl, paymentId, subscriptionId: subscriptionData.id };
  } catch (error) {
    console.error('Erro ao criar assinatura no Asaas:', error);
    throw error;
  }
}

interface DadosAssinaturaAsaas {
  cpf: string;
  nomeCliente: string;
  email: string;
  valorTotal: number;
  formaPagamento: string;
  descricao: string;
}

// Função para buscar ou criar cliente no Asaas
async function buscarOuCriarClienteAsaas(cpf: string, nomeCliente: string, email: string): Promise<string> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  try {
    // Primeiro, tenta buscar o cliente pelo CPF
    const searchResponse = await fetch(`${ASAAS_BASE_URL}/customers?cpfCnpj=${cpf}`, {
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
        name: nomeCliente,
        cpfCnpj: cpf,
        email: email,
        personType: 'FISICA'
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
    const customerId = await buscarOuCriarClienteAsaas(dados.cpf, dados.nomeCliente, dados.email);

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
        nextDueDate: todayString,
        value: dados.valorTotal,
        cycle: 'MONTHLY',
        description: dados.descricao,
        externalReference: `ASSINATURA_PF_${Date.now()}`,
        
        endDate: null,
        maxPayments: 12, // 12 meses
        
        fine: {
          value: 2.00,
          type: 'PERCENTAGE'
        },
        interest: {
          value: 1.00,
          type: 'PERCENTAGE'
        },
        
        ...(billingType === 'CREDIT_CARD' && {
          creditCard: {
            automaticRoutingEnabled: true
          }
        })
      })
    });

    const subscriptionData = await subscriptionResponse.json();

    if (!subscriptionResponse.ok) {
      console.error('❌ Erro na resposta da assinatura:', subscriptionData);
      throw new Error(`Erro ao criar assinatura: ${JSON.stringify(subscriptionData)}`);
    }

    console.log('✅ Assinatura criada no Asaas:', subscriptionData.id);

    // Obter link de pagamento
    let paymentUrl = '';

    if (subscriptionData.invoiceUrl) {
      paymentUrl = subscriptionData.invoiceUrl;
    } else {
      try {
        const paymentsResponse = await fetch(`${ASAAS_BASE_URL}/payments?subscription=${subscriptionData.id}&limit=1`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'access_token': ASAAS_API_KEY
          }
        });

        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          
          if (paymentsData.data && paymentsData.data.length > 0) {
            const firstPayment = paymentsData.data[0];
            paymentUrl = firstPayment.invoiceUrl || `${ASAAS_BASE_URL.replace('/v3', '')}/i/${firstPayment.id}`;
          }
        }
      } catch (searchError) {
        console.warn('Aviso: Erro ao buscar cobranças da assinatura:', searchError);
      }

      if (!paymentUrl) {
        paymentUrl = `${ASAAS_BASE_URL.replace('/v3', '')}/i/${subscriptionData.id}`;
      }
    }

    console.log('🔗 Link de pagamento gerado:', paymentUrl);
    
    return paymentUrl;

  } catch (error) {
    console.error('Erro ao criar assinatura no Asaas:', error);
    throw error;
  }
}
