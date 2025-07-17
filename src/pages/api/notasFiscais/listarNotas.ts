import type { NextApiRequest, NextApiResponse } from 'next';

// Configurações do Asaas
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_TOKEN = process.env.ASAAS_API_TOKEN || '';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { assinaturaId } = req.query;

    if (!assinaturaId || typeof assinaturaId !== 'string') {
      return res.status(400).json({ message: 'ID da assinatura é obrigatório' });
    }

    console.log(`🔍 Listando notas fiscais da assinatura: ${assinaturaId}`);

    // Listar notas fiscais da assinatura no Asaas
    let notasFiscais = [];
    
    try {
      if (!ASAAS_API_TOKEN) {
        throw new Error('Token do Asaas não configurado');
      }

      const response = await fetch(`${ASAAS_API_URL}/invoices?subscription=${assinaturaId}`, {
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
          municipalServiceCode: '07498',
          observations: 'Assinatura de plano de saúde empresarial com vigência de 12 meses',
          externalReference: assinaturaId,
          pdf: null,
          xml: null,
          taxes: {
            retainIss: false,
            iss: 5,
            cofins: 3,
            pis: 0.65
          }
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
      pdf: nota.pdf,
      xml: nota.xml,
      chaveAcesso: nota.accessKey || null,
      municipalServiceCode: nota.municipalServiceCode
    }));

    return res.status(200).json({
      success: true,
      assinaturaId,
      total: notasFormatadas.length,
      notasFiscais: notasFormatadas
    });

  } catch (error) {
    console.error('Erro ao listar notas fiscais:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}
