import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { id_usuario } = req.query;

    if (!id_usuario) {
      return res.status(400).json({ error: "ID do usuário é obrigatório" });
    }

    // Buscar contratos assinados do usuário
    const [contratos] = await pool.query(
      `SELECT 
        id,
        tipo_contrato,
        data_assinatura,
        status,
        ip_assinatura,
        user_agent,
        JSON_EXTRACT(dados_contrato, '$.nomeseg') as nome_contrato,
        JSON_EXTRACT(dados_contrato, '$.cpf') as cpf_contrato
       FROM tb_contratos_assinados 
       WHERE id_usuario = ?
       ORDER BY data_assinatura DESC`,
      [id_usuario]
    );

    return res.status(200).json({
      success: true,
      contratos: contratos
    });

  } catch (error) {
    console.error("Erro ao buscar contratos assinados:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
