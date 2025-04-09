import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { cpf, password } = req.body;

  try {
    console.log("🔹 Recebendo requisição de login para CPF:", cpf);

    // Busca o usuário apenas na tabela tb_usuarios usando CPF
    const [usuarios]: any = await pool.query(
      `SELECT idUsuario AS id, nome, senha, perfil AS role, id_empresa FROM tb_usuarios WHERE cpf = ?`,
      [cpf]
    );

    if (usuarios.length === 0) {
      console.error("❌ Usuário não encontrado na tabela tb_usuarios:", cpf);
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const user = usuarios[0];
    console.log("✅ Usuário encontrado:", user.nome);

    const senhaCorreta = await bcrypt.compare(password, user.senha);
    if (!senhaCorreta) {
      console.error("❌ Senha incorreta para CPF:", cpf);
      return res.status(401).json({ error: "Senha incorreta" });
    }

    const token = jwt.sign(
      { id: user.id, nome: user.nome, role: user.role, id_empresa: user.id_empresa },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    console.log("🔑 Token gerado com sucesso para:", user.nome);

    return res.status(200).json({ token, nome: user.nome, role: user.role, id_empresa: user.id_empresa });
  } catch (error) {
    console.error("🔥 Erro no servidor:", error);
    return res.status(500).json({ error: "Erro no servidor" });
  }
}
