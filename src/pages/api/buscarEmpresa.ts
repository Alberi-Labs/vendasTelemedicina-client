import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db"; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const [rows]: any = await pool.query("SELECT idEmpresa, nomeEmpresa FROM tb_empresa ORDER BY nomeEmpresa ASC");

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return res.status(500).json({ error: "Erro ao buscar empresas" });
  }
}
