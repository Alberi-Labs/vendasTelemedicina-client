import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Método não permitido" });
  }

  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM tb_instituicao
    `);
    return res.status(200).json({ success: true, instituicoes: rows });
  } catch (error) {
    console.error("Erro ao buscar instituicoes:", error);
    return res.status(500).json({ success: false, message: "Erro ao buscar instituicoes" });
  }
}
