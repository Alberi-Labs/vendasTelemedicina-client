import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { email, password } = req.body;

  try {
    console.log("🔹 Recebendo requisição de login para:", email);

    const [rows]: any = await pool.query("SELECT * FROM tb_usuarios WHERE email = ?", [email]);

    if (rows.length === 0) {
      console.error("❌ Usuário não encontrado:", email);
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const user = rows[0];
    console.log("✅ Usuário encontrado:", user.nome);

    if (password !== user.senha) {
      console.error("❌ Senha incorreta para:", email);
      return res.status(401).json({ error: "Senha incorreta" });
    }

    const token = jwt.sign({ id: user.id, nome: user.nome }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    console.log("🔑 Token gerado com sucesso para:", user.nome);

    return res.status(200).json({ token, nome: user.nome });
  } catch (error) {
    console.error("🔥 Erro no servidor:", error);
    return res.status(500).json({ error: "Erro no servidor" });
  }
}
