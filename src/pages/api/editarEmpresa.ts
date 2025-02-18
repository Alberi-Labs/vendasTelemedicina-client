import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { idEmpresa, nomeEmpresa, endereco, telefone } = req.body;

  if (!idEmpresa || !nomeEmpresa) {
    return res.status(400).json({ error: "ID e nome da empresa são obrigatórios" });
  }

  const connection = await pool.getConnection();
  try {
    const [result]: any = await connection.query(
      "UPDATE tb_empresas SET nomeEmpresa = ?, endereco = ?, telefone = ? WHERE idEmpresa = ?",
      [nomeEmpresa, endereco, telefone, idEmpresa]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    res.status(200).json({ message: "Empresa atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao editar empresa:", error);
    res.status(500).json({ error: "Erro ao editar empresa" });
  } finally {
    connection.release();
  }
}
