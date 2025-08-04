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

    // Buscar o ID do usuário pelo CPF na tabela tb_clientes (com ou sem formatação)
    const cpfLimpo = cpf_usuario.replace(/[.\-]/g, ''); // Remove pontos e traços
    
    const [usuarios] = await pool.query(
      `SELECT idCliente FROM tb_clientes 
       WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ? 
       OR cpf = ?`,
      [cpfLimpo, cpf_usuario]
    ) as any[];

    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({ 
        error: "Usuário não encontrado na base de dados" 
      });
    }

    const id_usuario = usuarios[0].idCliente;

    // Salvar o contrato assinado no banco de dados
    const [resultado] = await pool.query(
      `INSERT INTO tb_contratos_assinados 
       (idCliente, tipo_contrato, dados_contrato, assinatura_digital, ip_assinatura, user_agent, data_assinatura, status)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 'assinado')`,
      [
        id_usuario,
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
