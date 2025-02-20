import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const formatarDataParaSQL = (data: string): string => {
    const partes = data.split("/");
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`; // AAAA-MM-DD
    }
    return data; 
  };
  
  console.log(req.body);
  const { vidas, idEmpresa } = req.body;

  if (!idEmpresa || !Array.isArray(vidas) || vidas.length === 0) {
    return res.status(400).json({ error: "Adicione uma vida obrigatoriamente!" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const insertedIds: number[] = [];

    for (const vida of vidas) {

        const { nome, cpf, uf, genero } = vida;
        const nascimentoFormatado = formatarDataParaSQL(vida.nascimento);
        

      if (!nome || !cpf || !nascimentoFormatado || !uf || !genero) {
        throw new Error("Todos os campos da vida são obrigatórios");
      }

      // Verifica se a vida já existe no banco
      const [existingRows]: any = await connection.query(
        "SELECT idVida FROM tb_vidas WHERE cpf = ?",
        [cpf]
      );

      if (existingRows.length > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: "Vida já cadastrada", 
          cpf, 
          nome 
        });
      }

      // Inserir a vida
      await connection.query(
        "INSERT INTO tb_vidas (nome, cpf, nascimento, uf, genero) VALUES (?, ?, ?, ?, ?)",
        [nome, cpf, nascimentoFormatado, uf, genero]
      );

      // Buscar o ID da vida recém inserida
      const [rows]: any = await connection.query(
        "SELECT idVida FROM tb_vidas WHERE cpf = ? ORDER BY idVida DESC LIMIT 1",
        [cpf]
      );

      if (!rows.length) {
        throw new Error("Falha ao obter o ID da vida cadastrada.");
      }

      const idVida = rows[0].idVida;
      insertedIds.push(idVida);

      // Inserir na relação empresa-vida
      await connection.query(
        "INSERT INTO tb_relacao_empresa_vida (idEmpresa, idVida) VALUES (?, ?)",
        [idEmpresa, idVida]
      );
    }

    await connection.commit();

    res.status(201).json({ message: "Vidas cadastradas com sucesso!", insertedIds });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao cadastrar vidas:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao cadastrar vidas";
    res.status(500).json({ error: errorMessage });
  } finally {
    connection.release();
  }
}
