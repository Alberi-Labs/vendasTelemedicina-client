import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { encrypt } from "@/lib/cryptoHelper";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const {
    nome,
    email,
    senha,
    telefone,
    perfil,
    cpf,
    data_nascimento,
    id_instituicao,
  } = req.body;

  if (!nome || !cpf) {
    return res
      .status(400)
      .json({ error: "Nome e CPF são obrigatórios." });
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



    const roleFinal = perfil || "cliente";

    const [resultado] = await pool.query(
      `INSERT INTO tb_usuarios (nome, email, senha, telefone, perfil, cpf, data_nascimento, criado_em, id_instituicao)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        nome,
        email,
        bcrypt.hashSync(senhaFinal, 10),
        telefone || null,
        roleFinal,
        cpf,
        data_nascimento,
        id_instituicao || null,
      ]
    );

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      usuario: {
        id: (resultado as any).insertId,
        nome,
        email,
        telefone,
        perfil: roleFinal,
        cpf,
        data_nascimento,
      },
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
