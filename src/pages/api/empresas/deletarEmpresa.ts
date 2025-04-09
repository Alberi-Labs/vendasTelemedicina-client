import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, message: "Método não permitido" });
  }

  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID da empresa é obrigatório" });
  }

  try {
    await pool.query(`DELETE FROM tb_empresas WHERE idEmpresa = ?`, [id]);
    return res.status(200).json({ success: true, message: "Empresa deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar empresa:", error);
    return res.status(500).json({ success: false, message: "Erro ao deletar empresa" });
  }
}
