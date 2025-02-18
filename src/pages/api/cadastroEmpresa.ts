import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { nomeEmpresa, nomeFantasia, email, cnpj, celular, cep, endereco, uf, cidade } = req.body;

  if (!nomeEmpresa || !email || !cnpj) {
    console.error("❌ Campos obrigatórios não preenchidos.");
    return res.status(400).json({ error: "Campos obrigatórios não preenchidos." });
  }

  try {
    console.log("🔹 Recebendo solicitação para cadastrar empresa:", nomeEmpresa);

    const query = `
      INSERT INTO tb_empresa (nomeEmpresa, nomeFantasia, email, cnpj, celular, cep, endereco, uf, cidade) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [nomeEmpresa, nomeFantasia, email, cnpj, celular, cep, endereco, uf, cidade];

    const [result]: any = await pool.query(query, values);

    console.log("✅ Empresa cadastrada com sucesso! ID:", result.insertId);

    return res.status(201).json({ message: "Empresa cadastrada com sucesso!", id: result.insertId });
  } catch (error) {
    console.error("🔥 Erro ao cadastrar empresa:", error);
    return res.status(500).json({ error: "Erro ao cadastrar empresa." });
  }
}
