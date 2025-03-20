import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Importa o bcrypt para comparar a senha

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { email, password } = req.body;

  try {
    console.log("🔹 Recebendo requisição de login para:", email);

    // 🔍 Busca o usuário pelo email e inclui a `role`
    const [rows]: any = await pool.query("SELECT idUsuario, nome, senha, role FROM tb_usuarios WHERE email = ?", [email]);

    if (rows.length === 0) {
      console.error("❌ Usuário não encontrado:", email);
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const user = rows[0];
    console.log("✅ Usuário encontrado:", user.nome);

    // 🔒 Verifica a senha com bcrypt
    const senhaCorreta = await bcrypt.compare(password, user.senha);
    if (!senhaCorreta) {
      console.error("❌ Senha incorreta para:", email);
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // 🔑 Gera o token JWT incluindo a `role`
    const token = jwt.sign({ id: user.id, nome: user.nome, role: user.role }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    console.log("🔑 Token gerado com sucesso para:", user.nome);

    // Retorna a resposta incluindo `role`
    return res.status(200).json({ token, nome: user.nome, role: user.role });
  } catch (error) {
    console.error("🔥 Erro no servidor:", error);
    return res.status(500).json({ error: "Erro no servidor" });
  }
}
