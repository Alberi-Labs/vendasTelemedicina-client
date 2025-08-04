import type { NextApiRequest, NextApiResponse } from 'next';

// Configurações do Asaas para consultar assinaturas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/api/v3';

interface AssinaturaAsaas {
  id: string;
  customer: string;
  billingType: string;
  nextDueDate: string;
  value: number;
  cycle: string;
  description: string;
  status: string;
  dateCreated: string;
  endDate?: string;
  maxPayments?: number;
}

interface Cliente {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  personType: string;
}

interface AssinaturaFormatada {
  id: string;
  empresaNome: string;
  cnpj: string;
  valor: number;
  status: string;
  dataInicio: string;
  proximoVencimento: string;
  notaFiscalEmitida: boolean;
  notaFiscalNumero?: string;
  assinaturaId: string;
  descricao: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {

    // Buscar assinaturas ativas
    const assinaturasResponse = await fetch(`${ASAAS_BASE_URL}/subscriptions?status=ACTIVE&limit=50`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'access_token': ASAAS_API_KEY ?? ''
      } as Record<string, string>
    });

    if (!assinaturasResponse.ok) {
      throw new Error(`Erro ao buscar assinaturas: ${assinaturasResponse.status}`);
    }

    const assinaturasData = await assinaturasResponse.json();
    const assinaturas: AssinaturaAsaas[] = assinaturasData.data || [];

    // Buscar dados dos clientes
    const assinaturasFormatadas: AssinaturaFormatada[] = [];

    for (const assinatura of assinaturas) {
      try {
        // Buscar dados do cliente
        const clienteResponse = await fetch(`${ASAAS_BASE_URL}/customers/${assinatura.customer}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'access_token': ASAAS_API_KEY ?? ''
          } as Record<string, string>
        });

        let cliente: Cliente | null = null;
        if (clienteResponse.ok) {
          cliente = await clienteResponse.json();
        }

        // Verificar se existe configuração de nota fiscal automática no Asaas
        let notaFiscalConfig = null;
        try {
          const configResponse = await fetch(`${ASAAS_BASE_URL}/subscriptions/${assinatura.id}/invoiceSettings`, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'access_token': ASAAS_API_KEY ?? ''
            } as Record<string, string>
          });
          if (configResponse.ok) {
            notaFiscalConfig = await configResponse.json();
          }
        } catch (err) {
          console.warn('Erro ao buscar configuração de NF automática:', err);
        }
        
        const assinaturaFormatada: AssinaturaFormatada = {
          id: assinatura.id,
          empresaNome: cliente?.name || 'Empresa não encontrada',
          cnpj: cliente?.cpfCnpj || '',
          valor: assinatura.value,
          status: mapearStatusAssinatura(assinatura.status),
          dataInicio: assinatura.dateCreated,
          proximoVencimento: assinatura.nextDueDate,
          notaFiscalEmitida: !!notaFiscalConfig,
          notaFiscalNumero: notaFiscalConfig ? `Configuração: ${notaFiscalConfig.id}` : undefined,
          assinaturaId: assinatura.id,
          descricao: assinatura.description || ''
        };

        assinaturasFormatadas.push(assinaturaFormatada);

      } catch (clienteError) {
        console.warn(`Erro ao buscar cliente ${assinatura.customer}:`, clienteError);
        
        // Adicionar assinatura mesmo sem dados do cliente
        assinaturasFormatadas.push({
          id: assinatura.id,
          empresaNome: 'Erro ao carregar dados',
          cnpj: '',
          valor: assinatura.value,
          status: mapearStatusAssinatura(assinatura.status),
          dataInicio: assinatura.dateCreated,
          proximoVencimento: assinatura.nextDueDate,
          notaFiscalEmitida: false,
          assinaturaId: assinatura.id,
          descricao: assinatura.description || ''
        });
      }
    }


    return res.status(200).json({
      success: true,
      total: assinaturasFormatadas.length,
      assinaturas: assinaturasFormatadas
    });

  } catch (error) {
    console.error('Erro ao consultar assinaturas:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Função para mapear status do Asaas para status legível
function mapearStatusAssinatura(status: string): string {
  const statusMap: { [key: string]: string } = {
    'ACTIVE': 'ativa',
    'OVERDUE': 'em_atraso',
    'EXPIRED': 'expirada',
    'CANCELED': 'cancelada',
    'SUSPENDED': 'suspensa'
  };

  return statusMap[status] || status.toLowerCase();
}

// Função para verificar se existe nota fiscal emitida
async function verificarNotaFiscalEmitida(assinaturaId: string) {
  try {
    // Aqui você consultaria seu banco de dados local
    // Por enquanto, simulamos alguns dados
    
    const notasFiscaisSimuladas = [
      {
        id: '1',
        numero: 'NF-001234',
        assinaturaId: 'sub_987654321',
        status: 'emitida'
      }
    ];

    const notaEncontrada = notasFiscaisSimuladas.find(
      nota => nota.assinaturaId === assinaturaId
    );

    return notaEncontrada || null;

  } catch (error) {
    console.warn('Erro ao verificar nota fiscal:', error);
    return null;
  }
}
