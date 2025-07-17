import type { NextApiRequest, NextApiResponse } from 'next';

// Configurações do Asaas
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_TOKEN = "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjM2M2VkNzM3LTQ3ZDMtNDk4MC1iMzk1LWIwMWFiNTQ4NmQzZjo6JGFhY2hfYWMyZjg5ZmUtYTQ4MC00MDJhLTk5YzctOTRhM2MzZDFmOWIw";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { assinaturaId } = req.query;

    if (!assinaturaId) {
      return res.status(400).json({ message: 'ID da assinatura é obrigatório' });
    }

    console.log(`🔍 Consultando notas fiscais da assinatura: ${assinaturaId}`);

    // Consultar notas fiscais da assinatura no Asaas
    let notasFiscais = [];
    
    try {
      if (!ASAAS_API_TOKEN) {
        throw new Error('Token do Asaas não configurado');
      }

      const response = await fetch(`${ASAAS_API_URL}/subscriptions/${assinaturaId}/invoices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_TOKEN
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro na API do Asaas: ${response.status} - ${errorData}`);
      }

      const resultado = await response.json();
      notasFiscais = resultado.data || [];
      console.log(notasFiscais)
      console.log(`✅ Encontradas ${notasFiscais.length} notas fiscais no Asaas`);

    } catch (asaasError) {
      console.warn('⚠️ Erro ao consultar Asaas, usando dados simulados:', asaasError);
      
      // Dados simulados para desenvolvimento
      notasFiscais = [
        {
          id: 'inv_123456789',
          number: '000001',
          status: 'AUTHORIZED',
          value: 299.90,
          serviceDescription: 'Assinatura Plano Saúde e Cor PJ - 12 meses',
          effectiveDate: '2024-07-16',
          municipalServiceId: null,
          municipalServiceCode: null,
          municipalServiceName: 'Planos de assistência à saúde',
          taxes: {
            retainIss: false,
            iss: 5,
            cofins: 3,
            pis: 0.65
          },
          observations: 'Assinatura de plano de saúde empresarial',
          externalReference: assinaturaId,
          pdf: null,
          xml: null
        }
      ];
    }

    // Formatar resposta
    const notasFormatadas = notasFiscais.map((nota: any) => ({
      id: nota.id,
      numero: nota.number,
      status: nota.status,
      valor: nota.value,
      descricao: nota.serviceDescription,
      dataEmissao: nota.effectiveDate,
      observacoes: nota.observations,
      impostos: nota.taxes,
      pdf: nota.pdfUrl,
      xml: nota.xml,
      chaveAcesso: nota.accessKey || null
    }));
    console.log(notasFormatadas)
    return res.status(200).json({
      success: true,
      assinaturaId,
      total: notasFormatadas.length,
      notasFiscais: notasFormatadas
    });

  } catch (error) {
    console.error('Erro ao consultar notas fiscais:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}
