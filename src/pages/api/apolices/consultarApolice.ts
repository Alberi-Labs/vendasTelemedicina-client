import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db"; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido. Use GET." });
  }

  const { cpf } = req.query;

  if (!cpf || typeof cpf !== "string") {
    return res.status(400).json({ error: "CPF é obrigatório e deve ser uma string." });
  }

  try {
    const [rows] = await pool.query(
      "SELECT nome, cpf, arquivo, created_at FROM tb_apolices WHERE cpf = ?",
      [cpf]
    ) as [any[], any];

    if (rows.length === 0) {
      return res.status(404).json({ message: "Nenhuma apólice encontrada para este CPF." });
    }

    return res.status(200).json({
      cpf,
      nome: rows[0].nome,
      apolices: rows.map(row => ({
        link: row.arquivo,
        dataCadastro: row.created_at
      }))
    });
  } catch (error) {
    console.error("Erro ao consultar apólice:", error);
    return res.status(500).json({ error: "Erro interno ao consultar apólice." });
  }
}
