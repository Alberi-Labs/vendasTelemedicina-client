import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const { nome, email, senha, telefone, role, cpf, creditos, data_nascimento } = req.body;

  if (!nome || !email || !senha || !cpf || !data_nascimento) {
    return res.status(400).json({ error: "Nome, email, senha, CPF e data de nascimento são obrigatórios." });
  }

  try {
    const [usuarioExistente] = await pool.query(
      "SELECT id FROM tb_usuarios WHERE cpf = ? OR email = ?",
      [cpf, email]
    );

    if ((usuarioExistente as any[]).length > 0) {
      return res.status(409).json({ error: "Usuário já cadastrado com este CPF ou e-mail." });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const [resultado] = await pool.query(
      `INSERT INTO tb_usuarios (nome, email, senha, telefone, role, cpf, creditos, data_nascimento, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [nome, email, senhaCriptografada, telefone || null, role || "cliente", cpf, creditos || 0, data_nascimento]
    );

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      usuario: {
        id: (resultado as any).insertId,
        nome,
        email,
        telefone,
        role,
        cpf,
        creditos,
        data_nascimento, 
      },
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
