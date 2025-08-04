import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { cpf } = req.body;

    if (!cpf) {
      return res.status(400).json({ 
        error: "CPF é obrigatório" 
      });
    }

    const cpfLimpo = cpf.replace(/\D/g, "");

    // Atualizar o status do contrato para assinado
    const [resultado] = await pool.query(
      "UPDATE tb_clientes SET contrato_assinado = 1 WHERE cpf = ?",
      [cpfLimpo]
    );

    const { affectedRows } = resultado as any;

    if (affectedRows === 0) {
      return res.status(404).json({ 
        error: "Cliente não encontrado" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contrato marcado como assinado com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao atualizar status do contrato:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
