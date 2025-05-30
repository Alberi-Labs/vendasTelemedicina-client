// src/pages/api/empresas/listarEmpresas.ts
import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido. Use GET." });
  }

  const { cnpj } = req.query;

  try {
    let query = "SELECT * FROM tb_empresas";
    const params: any[] = [];

    if (cnpj) {
      query += " WHERE cnpj = ?";
      params.push(cnpj);
    }

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, empresas: rows });
  } catch (error: any) {
    console.error("Erro ao listar empresas:", error);
    return res.status(500).json({ success: false, message: "Erro ao listar empresas", error: error.message });
  }
}
