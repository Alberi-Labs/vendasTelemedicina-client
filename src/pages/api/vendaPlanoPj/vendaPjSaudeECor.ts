import type { NextApiRequest, NextApiResponse } from 'next';

// Configurações do Asaas
const ASAAS_API_KEY = "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjM2M2VkNzM3LTQ3ZDMtNDk4MC1iMzk1LWIwMWFiNTQ4NmQzZjo6JGFhY2hfYWMyZjg5ZmUtYTQ4MC00MDJhLTk5YzctOTRhM2MzZDFmOWIw";
const ASAAS_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/api/v3';

interface Funcionario {
  nome: string;
  cpf: string;
  dataNascimento: string;
  codigoPlano: string;
  uf: string;
  sexo: string;
}

interface DadosVendaPj {
  nomeEmpresa: string;
  cnpj: string;
  funcionarios: Funcionario[];
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

  try {
    const dados: DadosVendaPj = req.body;

    // Validações básicas
    if (!dados.nomeEmpresa || !dados.cnpj || !dados.funcionarios || dados.funcionarios.length === 0) {
      return res.status(400).json({ 
        message: 'Dados incompletos. Nome da empresa, CNPJ e lista de funcionários são obrigatórios.' 
      });
    }

    // Validar cada funcionário
    for (const func of dados.funcionarios) {
      if (!func.nome || !func.cpf || !func.dataNascimento || !func.uf || !func.sexo) {
        return res.status(400).json({ 
          message: `Dados incompletos para o funcionário: ${func.nome || 'Nome não informado'}` 
        });
      }
      
      // Define plano padrão como 3 se não informado
      if (!func.codigoPlano) {
        func.codigoPlano = '3';
      }
    }

    console.log('🚀 Iniciando processamento de venda PJ para Saúde e Cor...');
    console.log(`📊 Empresa: ${dados.nomeEmpresa}`);
    console.log(`👥 Total de funcionários: ${dados.funcionarios.length}`);

    // Aqui você faria a integração com o sistema Saúde e Cor
    // Por enquanto, vamos simular o processo
    
    // 1. Cadastrar funcionários no sistema Saúde e Cor
    const resultadosCadastro = [];
    
    for (const funcionario of dados.funcionarios) {
      try {
        // Simular chamada para API do Saúde e Cor
        // const resultadoCadastro = await cadastrarFuncionarioSaudeECor(funcionario, dados.nomeEmpresa);
        
        // Por enquanto, simulamos sucesso
        const resultadoSimulado = {
          nome: funcionario.nome,
          cpf: funcionario.cpf,
          status: 'sucesso',
          numeroContrato: `SC${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
          message: 'Funcionário cadastrado com sucesso no sistema Saúde e Cor'
        };

        resultadosCadastro.push(resultadoSimulado);
        
        // Pequeno delay para simular processamento
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Erro ao cadastrar funcionário ${funcionario.nome}:`, error);
        resultadosCadastro.push({
          nome: funcionario.nome,
          cpf: funcionario.cpf,
          status: 'erro',
          message: `Erro ao cadastrar: ${error}`
        });
      }
    }

    // 2. Gerar link de pagamento no Asaas
    let paymentLink = '';
    try {
      console.log('💳 Criando assinatura recorrente no Asaas...');
      
      // Calcular valor total baseado no número de funcionários
      const valorUnitario = parseFloat(dados.valorPlano);
      const valorTotal = valorUnitario * dados.funcionarios.length;
      
      paymentLink = await criarAssinaturaAsaas({
        cnpj: dados.cnpj,
        nomeEmpresa: dados.nomeEmpresa,
        valorTotal,
        formaPagamento: dados.formaPagamento,
        descricao: `Assinatura Plano Saúde e Cor PJ - ${dados.funcionarios.length} funcionário(s) - 12 meses`
      });
      
      console.log('✅ Assinatura criada no Asaas:', paymentLink);
      
    } catch (paymentError) {
      console.error('Erro ao criar assinatura no Asaas:', paymentError);
      return res.status(500).json({ 
        message: 'Erro ao criar assinatura no Asaas',
        error: paymentError instanceof Error ? paymentError.message : 'Erro desconhecido',
        resultadosCadastro 
      });
    }

    // 3. Salvar no banco de dados local (se necessário)
    // await salvarVendaPjNoBanco({
    //   empresa: dados.nomeEmpresa,
    //   funcionarios: resultadosCadastro,
    //   paymentLink,
    //   idUsuario: dados.idUsuario
    // });

    const sucessos = resultadosCadastro.filter(r => r.status === 'sucesso').length;
    const erros = resultadosCadastro.filter(r => r.status === 'erro').length;

    console.log(`✅ Processamento concluído: ${sucessos} sucessos, ${erros} erros`);

    return res.status(200).json({
      success: true,
      message: `Processamento concluído: ${sucessos} funcionários cadastrados com sucesso, ${erros} erros`,
      paymentLink,
      resumo: {
        totalFuncionarios: dados.funcionarios.length,
        sucessos,
        erros,
        empresa: dados.nomeEmpresa
      },
      detalhes: resultadosCadastro
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
  try {
    // Primeiro, tenta buscar o cliente pelo CNPJ
    console.log(ASAAS_API_KEY)
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

    // Calcular próxima data de cobrança (próximo mês, dia 1)
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    nextDueDate.setDate(1);
    const nextDueDateString = nextDueDate.toISOString().split('T')[0];

    console.log('📅 Criando assinatura com primeira cobrança hoje:', todayString);
    console.log('📅 Próxima cobrança em:', nextDueDateString);

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
        externalReference: `ASSINATURA_PJ_${Date.now()}`,
        
        // Configurações específicas da assinatura
        endDate: null, // Sem data de fim (assinatura contínua)
        maxPayments: 12, // Máximo 12 pagamentos (12 meses)
        
        // Configurações de notificação e cobrança
        fine: {
          value: 2.00,
          type: 'PERCENTAGE'
        },
        interest: {
          value: 1.00,
          type: 'PERCENTAGE'
        },
        discount: {
          value: 0,
          dueDateLimitDays: 0
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

// Função auxiliar para cadastrar funcionário no Saúde e Cor (implementar conforme API)
// async function cadastrarFuncionarioSaudeECor(funcionario: Funcionario, empresa: string) {
//   // Implementar integração com API do Saúde e Cor
//   // return await fetch('API_SAUDE_E_COR_URL', {
//   //   method: 'POST',
//   //   headers: { 'Content-Type': 'application/json' },
//   //   body: JSON.stringify({
//   //     nome: funcionario.nome,
//   //     cpf: funcionario.cpf,
//   //     dataNascimento: funcionario.dataNascimento,
//   //     codigoPlano: funcionario.codigoPlano,
//   //     uf: funcionario.uf,
//   //     sexo: funcionario.sexo,
//   //     empresa
//   //   })
//   // });
// }
