import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

// Formata CPF para 999.999.999-99
function formatarCPF(cpf: string): string {
  const num = cpf.replace(/\D/g, "");
  return num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Converte para DD/MM/AAAA
function formatarDataParaBR(data: any): string {
  const d = new Date(data);
  if (isNaN(d.getTime())) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const { cpfTitular } = req.body;

  if (!cpfTitular) {
    return res.status(400).json({ error: "CPF do titular é obrigatório." });
  }

  try {
    const [rows]: any = await pool.query(
      `SELECT idDependente, nome, cpf, dt_nascimento
       FROM tb_dependentes
       WHERE cpf_titular = ?`,
      [cpfTitular]
    );

    const dependentes = rows.map((row: any) => ({
      id: row.idDependente,
      nome: row.nome,
      cpf: formatarCPF(row.cpf),
      nascimento: formatarDataParaBR(row.dt_nascimento),
    }));

    return res.status(200).json({ dependentes });
  } catch (error: any) {
    console.error("Erro ao consultar dependentes no banco:", error);
    return res.status(500).json({ error: "Erro ao consultar dependentes no banco." });
  }
}
