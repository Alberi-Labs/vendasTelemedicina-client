import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, message: "Método não permitido" });
  }

  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID da instituicao é obrigatório" });
  }

  try {
    await pool.query(`DELETE FROM tb_instituicao WHERE idInstituicao = ?`, [id]);
    return res.status(200).json({ success: true, message: "Instituicao deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar instituicao:", error);
    return res.status(500).json({ success: false, message: "Erro ao deletar instituicao" });
  }
}
