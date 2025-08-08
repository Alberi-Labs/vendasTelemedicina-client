// pages/api/dependente/cadastrarBanco.ts
import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

// Utilitário para formatar a data
function formatarDataParaMySQL(data: string): string {
  const [dia, mes, ano] = data.split("/");
  return `${ano}-${mes}-${dia}`; // Ex: "2003-12-14"
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const { cpf, nome, nascimento, cpfTitular } = req.body;

  if (!cpf || !nome || !nascimento || !cpfTitular) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  try {
    // Verifica duplicidade de CPF
    const [[cpfExiste]]: any = await pool.query(
      `SELECT 1 FROM tb_dependentes WHERE cpf = ? LIMIT 1`,
      [cpf]
    );

    if (cpfExiste) {
      return res.status(409).json({ error: "CPF do dependente já está cadastrado." });
    }

    // Converte data de nascimento para o formato YYYY-MM-DD

    // Inserção no banco
    await pool.query(
      `INSERT INTO tb_dependentes (nome, cpf, dt_nascimento, cpf_titular)
       VALUES (?, ?, ?, ?)`,
      [nome, cpf, nascimento, cpfTitular]
    );

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("❌ Erro ao cadastrar dependente:", error);
    return res.status(500).json({ error: "Erro ao cadastrar dependente." });
  }
}
