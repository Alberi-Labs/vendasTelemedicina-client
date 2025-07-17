import type { NextApiRequest, NextApiResponse } from 'next';

// Configurações do Asaas
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_TOKEN = "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjM2M2VkNzM3LTQ3ZDMtNDk4MC1iMzk1LWIwMWFiNTQ4NmQzZjo6JGFhY2hfYWMyZjg5ZmUtYTQ4MC00MDJhLTk5YzctOTRhM2MzZDFmOWIw";

interface NotaFiscalDetalhes {
  numero: string;
  serie: string;
  chave: string;
  dataEmissao: string;
  dataAutorizacao?: string;
  valor: number;
  status: string;
  empresaEmitente: {
    nome: string;
    cnpj: string;
    inscricaoEstadual: string;
    endereco: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  empresaDestinatario: {
    nome: string;
    cnpj: string;
    endereco?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  servicos: Array<{
    numero: number;
    codigo: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valorUnitario: number;
    valorTotal: number;
    aliquotaISS: number;
  }>;
  impostos: {
    baseCalculoISS: number;
    valorISS: number;
    baseCalculoPIS: number;
    valorPIS: number;
    baseCalculoCOFINS: number;
    valorCOFINS: number;
    valorTotalTributos: number;
  };
  observacoes?: string;
  xmlUrl?: string;
  pdfUrl?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { numero, serie } = req.query;

    if (!numero || !serie) {
      return res.status(400).json({ 
        message: 'Número e série da nota fiscal são obrigatórios' 
      });
    }

    console.log(`📄 Buscando nota fiscal: ${serie}-${numero}`);

    // Buscar nota fiscal no banco local
    const notaFiscal = await buscarNotaFiscalLocal(numero as string, serie as string);
    
    if (!notaFiscal) {
      return res.status(404).json({ 
        message: 'Nota fiscal não encontrada' 
      });
    }

    // Se temos a chave, buscar detalhes adicionais na API de NFe
    let detalhesCompletos = notaFiscal;
    if (notaFiscal.chave) {
      try {
        const detalhesAPI = await buscarDetalhesNaAPI(notaFiscal.chave);
        detalhesCompletos = { ...notaFiscal, ...detalhesAPI };
      } catch (apiError) {
        console.warn('Erro ao buscar detalhes na API de NFe:', apiError);
        // Continua com dados locais
      }
    }

    return res.status(200).json({
      success: true,
      notaFiscal: detalhesCompletos
    });

  } catch (error) {
    console.error('Erro ao buscar nota fiscal:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Função para buscar nota fiscal no banco local
async function buscarNotaFiscalLocal(numero: string, serie: string): Promise<NotaFiscalDetalhes | null> {
  try {
    // Aqui você consultaria seu banco de dados
    // Por enquanto, simulamos com dados de exemplo
    
    const notasSimuladas: NotaFiscalDetalhes[] = [
      {
        numero: "000001",
        serie: "001",
        chave: "35240712345678000195550010000000011234567890",
        dataEmissao: "2024-07-16",
        dataAutorizacao: "2024-07-16T10:30:00",
        valor: 299.90,
        status: "autorizada",
        empresaEmitente: {
          nome: "Vita Saúde e Cor LTDA",
          cnpj: "12.345.678/0001-95",
          inscricaoEstadual: "123.456.789.123",
          endereco: "Rua das Flores, 123 - Centro",
          cidade: "São Paulo",
          uf: "SP",
          cep: "01234-567"
        },
        empresaDestinatario: {
          nome: "Tech Solutions LTDA",
          cnpj: "98.765.432/0001-10",
          endereco: "Av. Paulista, 1000 - Bela Vista",
          cidade: "São Paulo",
          uf: "SP",
          cep: "01310-100"
        },
        servicos: [
          {
            numero: 1,
            codigo: "PLANO-SAUDE-PJ",
            descricao: "Assinatura Plano Saúde e Cor PJ - 12 meses",
            quantidade: 1,
            unidade: "UN",
            valorUnitario: 299.90,
            valorTotal: 299.90,
            aliquotaISS: 5
          }
        ],
        impostos: {
          baseCalculoISS: 299.90,
          valorISS: 14.995,
          baseCalculoPIS: 299.90,
          valorPIS: 1.949,
          baseCalculoCOFINS: 299.90,
          valorCOFINS: 8.997,
          valorTotalTributos: 25.941
        },
        observacoes: "Assinatura de plano de saúde empresarial com vigência de 12 meses",
        xmlUrl: `/api/notasFiscais/download/xml/${numero}`,
        pdfUrl: `/api/notasFiscais/download/pdf/${numero}`
      }
    ];

    const notaEncontrada = notasSimuladas.find(
      nota => nota.numero === numero && nota.serie === serie
    );

    return notaEncontrada || null;

  } catch (error) {
    console.error('Erro ao buscar nota fiscal local:', error);
    throw error;
  }
}

// Função para buscar detalhes adicionais na API de NFe
async function buscarDetalhesNaAPI(chave: string) {
  try {
    const NFE_API_URL = process.env.NFE_API_URL || 'https://homologacao.focusnfe.com.br';
    const NFE_API_TOKEN = process.env.NFE_API_TOKEN || '';

    if (!NFE_API_TOKEN) {
      throw new Error('Token da API de NFe não configurado');
    }

    const response = await fetch(`${NFE_API_URL}/v2/nfe/${chave}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${NFE_API_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na API de NFe: ${response.status}`);
    }

    const dados = await response.json();
    
    return {
      status: dados.status,
      dataAutorizacao: dados.data_autorizacao,
      xmlUrl: dados.caminho_xml_nota_fiscal,
      pdfUrl: dados.caminho_danfe
    };

  } catch (error) {
    console.error('Erro ao buscar na API de NFe:', error);
    throw error;
  }
}
