import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { idEmpresa } = req.query;

  if (!idEmpresa) {
    return res.status(400).json({ error: "ID da empresa é obrigatório" });
  }

  const connection = await pool.getConnection();
  try {
    const [result]: any = await connection.query(
      "UPDATE tb_empresas SET ativo = false WHERE idEmpresa = ?",
      [idEmpresa]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    res.status(200).json({ message: "Empresa marcada como inativa com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar status da empresa:", error);
    res.status(500).json({ error: "Erro ao atualizar status da empresa" });
  } finally {
    connection.release();
  }
}
