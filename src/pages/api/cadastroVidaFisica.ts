import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const formatarDataParaSQL = (data: string): string => {
    const partes = data.split("/");
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return data;
  };

  console.log(req.body);
  const { nome, cpf, nascimento, uf, genero, endereco, cep } = req.body;
  const nascimentoFormatado = formatarDataParaSQL(nascimento);

  if (!nome || !cpf || !nascimentoFormatado || !uf || !genero || !endereco || !cep) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows]: any = await connection.query(
      "SELECT idVida FROM tb_vidas WHERE cpf = ?",
      [cpf]
    );

    if (existingRows.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Vida já cadastrada",
        cpf,
        nome,
      });
    }

    await connection.query(
      "INSERT INTO tb_vidas (nome, cpf, nascimento, uf, genero, endereco, cep) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nome, cpf, nascimentoFormatado, uf, genero, endereco, cep]
    );

    const [rows]: any = await connection.query(
      "SELECT idVida FROM tb_vidas WHERE cpf = ? ORDER BY idVida DESC LIMIT 1",
      [cpf]
    );

    if (!rows.length) {
      throw new Error("Falha ao obter o ID da vida cadastrada.");
    }

    const idVida = rows[0].idVida;
    await connection.commit();

    res.status(201).json({ message: "Vida cadastrada com sucesso!", idVida });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao cadastrar vida:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao cadastrar vida";
    res.status(500).json({ error: errorMessage });
  } finally {
    connection.release();
  }
}