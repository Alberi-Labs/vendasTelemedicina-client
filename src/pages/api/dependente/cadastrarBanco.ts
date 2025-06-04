import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const { idTitular, cpfTitular } = req.body;

  if (!idTitular && !cpfTitular) {
    return res.status(400).json({ error: "Informe o idTitular ou cpfTitular." });
  }

  try {
    let query = `
      SELECT d.idDependente, d.nome, d.cpf, d.dt_nascimento
      FROM tb_dependentes d
      JOIN tb_clientes c ON d.id_titular = c.idCliente
    `;
    const params: any[] = [];

    if (idTitular) {
      query += ` WHERE d.id_titular = ?`;
      params.push(idTitular);
    } else if (cpfTitular) {
      query += ` WHERE c.cpf = ?`;
      params.push(cpfTitular);
    }

    const [rows]: any = await pool.query(query, params);

    const dependentes = rows.map((row: any) => ({
      id: row.idDependente,
      nome: row.nome,
      cpf: row.cpf,
      nascimento: row.dt_nascimento,
    }));

    res.status(200).json({ dependentes });
  } catch (error: any) {
    console.error("Erro ao consultar dependentes:", error);
    res.status(500).json({ error: "Erro ao consultar dependentes." });
  }
}
