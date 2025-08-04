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

    // Verificar se o contrato foi assinado
    const [resultado]: any = await pool.execute(
      "SELECT contrato_assinado FROM tb_clientes WHERE cpf = ?",
      [cpfLimpo]
    );

    if (resultado.length === 0) {
      return res.status(404).json({ 
        error: "Cliente não encontrado" 
      });
    }

    const contratoAssinado = resultado[0].contrato_assinado === 1;

    return res.status(200).json({
      success: true,
      contrato_assinado: contratoAssinado
    });

  } catch (error) {
    console.error("Erro ao verificar status do contrato:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
