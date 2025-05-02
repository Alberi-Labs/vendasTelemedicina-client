import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const { idUsuario } = req.query;

    if (!idUsuario) {
      return res.status(400).json({ error: "Parâmetro 'idUsuario' é obrigatório." });
    }

    const [result]: any = await pool.query("DELETE FROM tb_usuarios WHERE idUsuario = ?", [idUsuario]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({ success: true, message: "Usuário deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
