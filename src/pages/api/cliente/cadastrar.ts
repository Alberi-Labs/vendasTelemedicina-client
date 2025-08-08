import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { nome, cpf, telefone, email, data_nascimento } = req.body;

  const idInstituicaoFixa = 1;

  if (!nome || !cpf || !telefone || !email) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  try {
    const [result]: any = await pool.query(
      `INSERT INTO tb_clientes (nome, cpf, telefone, email, data_nascimento, perfil)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, cpf, telefone, email, data_nascimento, "cliente"]
    );

    const idCliente = result.insertId;

    await pool.query(
      "INSERT INTO tb_relacao_cliente_empresa (id_cliente, id_instituicao) VALUES (?, ?)",
      [idCliente, idInstituicaoFixa]
    );

    return res.status(201).json({
      success: true,
      message: "Cliente cadastrado e vinculado à instituicao com sucesso.",
    });
  } catch (error) {
    console.error("🔥 Erro ao cadastrar cliente:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
