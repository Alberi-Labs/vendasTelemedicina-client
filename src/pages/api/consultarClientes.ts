import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // 🔹 Consulta todos os clientes da tabela `tb_clientes`
    const [rows]: any = await pool.query("SELECT * FROM tb_vendas");

    return res.status(200).json({
      success: true,
      clientes: rows,
      vendas: rows,
    });
  } catch (error) {
    console.error("🔥 Erro ao consultar clientes:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
