import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { email, password } = req.body;

  try {
    console.log("🔹 Recebendo requisição de login para:", email);

    // 1. Tenta buscar na tb_usuarios
    const [usuarios]: any = await pool.query(
      `SELECT idUsuario AS id, nome, senha, perfil AS role, id_empresa FROM tb_usuarios WHERE email = ?`,
      [email]
    );

    let user: any = null;

    if (usuarios.length > 0) {
      user = usuarios[0];
      console.log("✅ Usuário encontrado em tb_usuarios:", user.nome);
    } else {
      console.warn("⚠️ Usuário não encontrado em tb_usuarios, tentando em tb_clientes...");

      const [clientes]: any = await pool.query(
        `SELECT idCliente AS id, nome, senha, perfil AS role FROM tb_clientes WHERE cpf = ?`,
        [email]
      );

      if (clientes.length === 0) {
        console.error("❌ Usuário não encontrado em nenhuma tabela:", email);
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      user = clientes[0];

      // 🔍 Busca o id_empresa da relação com cliente
      const [relacoes]: any = await pool.query(
        `SELECT id_empresa FROM tb_relacao_cliente_empresa WHERE id_cliente = ? LIMIT 1`,
        [user.id]
      );

      if (relacoes.length === 0) {
        console.error("❌ Cliente sem empresa vinculada:", email);
        return res.status(401).json({ error: "Cliente sem empresa vinculada" });
      }

      user.id_empresa = relacoes[0].id_empresa;

      console.log("✅ Cliente encontrado em tb_clientes:", user.nome);
    }

    const senhaCorreta = await bcrypt.compare(password, user.senha);
    if (!senhaCorreta) {
      console.error("❌ Senha incorreta para:", email);
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
