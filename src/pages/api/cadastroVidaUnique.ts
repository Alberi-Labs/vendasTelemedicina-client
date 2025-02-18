import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { nome, cpf, nascimento, uf, genero } = req.body;

  if (!nome || !cpf || !nascimento || !uf || !genero) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const connection = await pool.getConnection();

  try {
    const result: any = await connection.query(
        "INSERT INTO tb_vidas (nome, cpf, nascimento, uf, genero, pago) VALUES (?, ?, ?, ?, ?, false)",
        [nome, cpf, nascimento, uf, genero]
      );
      
      if (result.affectedRows === 1) {
        res.status(201).json({ message: "Vida cadastrada com sucesso!" });
      } else {
        res.status(500).json({ error: "Erro ao cadastrar a vida." });
      }
      
  } catch (error) {
    console.error("Erro ao cadastrar a vida:", error);
    res.status(500).json({ error: "Erro interno ao cadastrar a vida." });
  } finally {
    connection.release();
  }
}
