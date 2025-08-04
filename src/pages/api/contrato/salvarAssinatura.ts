import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { 
      cpf_usuario, 
      tipo_contrato, 
      dados_contrato, 
      assinatura_digital, 
      ip_assinatura,
      user_agent 
    } = req.body;

    if (!cpf_usuario || !tipo_contrato || !dados_contrato || !assinatura_digital) {
      return res.status(400).json({ 
        error: "Campos obrigatórios: cpf_usuario, tipo_contrato, dados_contrato, assinatura_digital" 
      });
    }

    // Salvar o contrato assinado no banco de dados
    const [resultado] = await pool.query(
      `INSERT INTO tb_contratos_assinados 
       (cpf_usuario, tipo_contrato, dados_contrato, assinatura_digital, ip_assinatura, user_agent, data_assinatura, status)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 'assinado')`,
      [
        cpf_usuario,
        tipo_contrato,
        JSON.stringify(dados_contrato),
        assinatura_digital,
        ip_assinatura,
        user_agent
      ]
    );

    const contratoId = (resultado as any).insertId;

    return res.status(201).json({
      success: true,
      message: "Contrato assinado com sucesso!",
      contratoId
    });

  } catch (error) {
    console.error("Erro ao salvar contrato assinado:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
