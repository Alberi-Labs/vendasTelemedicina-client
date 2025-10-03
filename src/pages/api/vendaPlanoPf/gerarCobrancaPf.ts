import pool from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";

// Configurações do Asaas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY ? `$${process.env.ASAAS_API_KEY}` : undefined;
const ASAAS_BASE_URL = 'https://api-sandbox.asaas.com/v3';

interface DadosCobrancaPf {
  clienteId: number;
  nomeCliente: string;
  email: string;
  cpf: string;
  formaDePagamento: string;
  idUsuario: string;
  valorPlano?: number;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  telefone?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const dados: DadosCobrancaPf = req.body

  // Verificar se a API key está configurada
  if (!ASAAS_API_KEY) {
    console.error('❌ ASAAS_API_KEY não está configurada nas variáveis de ambiente');
    return res.status(500).json({
      error: 'Configuração de API não encontrada. Contate o administrador.'
    });
  }

  try {

    const valorPlano = dados.valorPlano || 29.90; // Valor padrão do plano PF

    // Criar assinatura no Asaas
    let paymentLink = '';
    let paymentId = '';
    let subscriptionId = '';

    try {
      // Função modificada para retornar também o id do primeiro pagamento
      const assinaturaResult = await criarAssinaturaAsaasComId({
        cpf: dados.cpf,
        nomeCliente: dados.nomeCliente,
        email: dados.email,
        valorTotal: 5.00,
        formaPagamento: dados.formaDePagamento,
        descricao: `Plano Telemedicina Básico PF - ${dados.nomeCliente}`,
        cep: dados.cep,
        endereco: dados.endereco,
        numero: dados.numero,
        bairro: dados.bairro,
        telefone: dados.telefone
      });
      paymentLink = assinaturaResult.paymentLink;
      paymentId = assinaturaResult.paymentId;
      subscriptionId = assinaturaResult.subscriptionId;
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

        // Primeiro, verificar se a assinatura existe
        const checkResponse = await fetch(`${ASAAS_BASE_URL}/subscriptions/${subscriptionId}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'access_token': ASAAS_API_KEY
          }
        });

        const checkText = await checkResponse.text();

        if (!checkResponse.ok) {
          console.error('❌ Assinatura não encontrada ou erro ao verificar');
          throw new Error(`Assinatura não encontrada. Status: ${checkResponse.status}`);
        }

        const notaFiscalConfig = {
          municipalServiceId: "326047",
          municipalServiceCode: "17.23",
          municipalServiceName: "1723 - 17.23 - Assessoria, análise, avaliação, atendimento, consulta, ca…",
          updatePayment: false,
          deductions: 0,
          effectiveDatePeriod: "ON_PAYMENT_CONFIRMATION",
          receivedOnly: true,
          daysBeforeDueDate: 0,
          taxes: {
            retainIss: false
          }
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

        // Se a resposta estiver vazia ou não for JSON válido
        if (!responseText || responseText.trim() === '') {
          console.error('❌ Resposta vazia da API de nota fiscal');
          ;
          if (!notaResponse.ok) {
            throw new Error(`Erro ${notaResponse.status} (${notaResponse.statusText}) da API de nota fiscal - Resposta vazia`);
          } else {
            console.log('⚠️ Status OK mas resposta vazia, assumindo sucesso');
          }
        } else {
          // Tentar fazer parse do JSON
          let notaData;
          try {
            notaData = JSON.parse(responseText);
          } catch (jsonErr) {

            // Se a resposta não for JSON, mas o status for 2xx, pode ser que tenha funcionado
            if (notaResponse.ok) {
              console.log('⚠️ Resposta não é JSON mas status é OK, assumindo sucesso');
            } else {
              throw new Error(`Resposta inesperada da API de nota fiscal. Status: ${notaResponse.status}, Resposta: ${responseText}`);
            }
          }

          if (!notaResponse.ok) {
            console.error('❌ Erro ao configurar nota fiscal:', {
              status: notaResponse.status,
              statusText: notaResponse.statusText,
              response: notaData || responseText
            });
            throw new Error(`Erro ao configurar nota fiscal automaticamente. Status: ${notaResponse.status}`);
          }

        }
      } catch (notaError) {
        console.error('❌ Erro ao configurar nota fiscal:', notaError);
      }

      // Atualizar assinatura para mudar nextDueDate para dia 15 do próximo mês
      try {

        // Calcular dia 15 do próximo mês
        const now = new Date();
        const nextMonth15 = new Date(now.getFullYear(), now.getMonth() + 1, 15);
        const nextMonth15String = nextMonth15.toISOString().split('T')[0];

        const updateResponse = await fetch(`${ASAAS_BASE_URL}/subscriptions/${subscriptionId}`, {
          method: 'PUT',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'access_token': ASAAS_API_KEY
          },
          body: JSON.stringify({
            nextDueDate: nextMonth15String,
            updatePendingPayments: false
          })
        });

        const updateText = await updateResponse.text();

        if (!updateResponse.ok) {
          console.error('❌ Erro ao atualizar assinatura:', updateText);
          throw new Error(`Erro ao atualizar assinatura. Status: ${updateResponse.status}`);
        }
      } catch (updateError) {
        console.error('❌ Erro ao atualizar assinatura:', updateError);
      }
    }

    // Registrar venda na tabela telemedicina

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


    // Registrar cobrança na tabela tb_cobrancas
    const insertCobrancaQuery = `
      INSERT INTO tb_cobrancas (
        id_usuario,
        id_cliente,
        valor,
        forma_pagamento,
        link_pagamento,
        criado_em
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;
    await pool.execute(insertCobrancaQuery, [
      dados.idUsuario,
      dados.clienteId,
      valorPlano,
      dados.formaDePagamento,
      paymentLink
    ]);

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
    const customerId = await buscarOuCriarClienteAsaas(dados.cpf, dados.nomeCliente, dados.email, dados.cep, dados.endereco, dados.numero, dados.bairro, dados.telefone);

    // Mapear forma de pagamento
    const billingTypeMap: { [key: string]: string } = {
      'cartao': 'CREDIT_CARD',
      'pix': 'PIX',
      'boleto': 'BOLETO'
    };

    const billingType = billingTypeMap[dados.formaPagamento] || 'BOLETO';

    // Calcular datas: primeira cobrança amanhã, depois atualizar para dia 15
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];

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
        nextDueDate: tomorrowString,
        value: dados.valorTotal,
        cycle: 'MONTHLY',
        description: 'Assinatura de Beneficios Saude e Cor',
        externalReference: `ASSINATURA_PF_${Date.now()}`,
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
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  telefone?: string;
}

// Função para buscar ou criar cliente no Asaas
async function buscarOuCriarClienteAsaas(cpf: string, nomeCliente: string, email: string, cep?: string, endereco?: string, numero?: string, bairro?: string, telefone?: string): Promise<string> {
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
      return searchData.data[0].id;
    }

    // Se não encontrou, cria um novo cliente

    const clienteData: any = {
      name: nomeCliente,
      cpfCnpj: cpf,
      email: email,
      personType: 'FISICA'
    };
    // Adicionar dados de endereço se fornecidos
    if (cep && endereco && numero) {
      clienteData.postalCode = cep;
      clienteData.address = endereco;
      clienteData.addressNumber = numero;
      if (bairro) {
        clienteData.province = bairro;
      }
    }
    const createResponse = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify(clienteData)
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(`Erro ao criar cliente: ${JSON.stringify(createData)}`);
    }
    return createData.id;

  } catch (error) {
    console.error('Erro ao buscar/criar cliente no Asaas:', error);
    throw error;
  }
}

