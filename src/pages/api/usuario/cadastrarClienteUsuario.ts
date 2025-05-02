import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const {
    nome,
    email,
    senha,
    telefone,
    role,
    cpf,
    creditos,
    data_nascimento,
    id_empresa,

  } = req.body;

  if (!nome || !email) {
    return res
      .status(400)
      .json({ error: "Nome, email, CPF e data de nascimento são obrigatórios." });
  }

  try {
    const [usuarioExistente] = await pool.query(
      "SELECT idUsuario FROM tb_usuarios WHERE cpf = ?",
      [cpf]
    );

    if ((usuarioExistente as any[]).length > 0) {
      return res
        .status(409)
        .json({ error: "Usuário já cadastrado com este CPF ou e-mail." });
    }

    const senhaFinal = senha || "123456";
    const senhaCriptografada = await bcrypt.hash(senhaFinal, 10);
    const roleFinal = role || "cliente";
    const [resultado] = await pool.query(
      `INSERT INTO tb_usuarios (nome, email, senha, telefone, perfil, cpf, creditos, data_nascimento, criado_em, id_empresa)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        nome,
        email,
        senhaCriptografada,
        telefone || null,
        roleFinal,
        cpf,
        creditos || 0,
        data_nascimento,
        id_empresa || null,
      ]
    );

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      usuario: {
        id: (resultado as any).insertId,
        nome,
        email,
        telefone,
        role: roleFinal,
        cpf,
        creditos: creditos || 0,
        data_nascimento,
      },
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
