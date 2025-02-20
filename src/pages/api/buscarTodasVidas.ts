import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const connection = await pool.getConnection();
  try {
    const [vidas]: any = await connection.query(`
      SELECT * FROM tb_vidas v
      WHERE NOT EXISTS (
        SELECT 1 FROM tb_relacao_empresa_vida r
        WHERE r.idVida = v.idVida
      )
    `);

    if (!vidas || vidas.length === 0) {
      return res.status(404).json({ message: "Nenhuma vida sem empresa encontrada" });
    }

    res.status(200).json(vidas);
  } catch (error) {
    console.error("Erro ao buscar vidas sem empresa:", error);
    res.status(500).json({ error: "Erro ao buscar vidas sem empresa" });
  } finally {
    connection.release();
  }
}
