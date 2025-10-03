import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { encrypt } from "@/lib/cryptoHelper";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const {
      id,
      nome,
      email,
      telefone,
      perfil,
      imagem,
      cpf,
      data_nascimento,
      id_instituicao,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Campo 'id' do usuário é obrigatório." });
    }

    const campos = [
      "nome = ?",
      "email = ?",
      "telefone = ?",
      "perfil = ?",
      "imagem = ?",
      "cpf = ?",
      "data_nascimento = ?",
      "id_instituicao = ?",
    ];

    const valores = [
      nome,
      email,
      telefone,
      perfil,
      imagem,
      cpf,
      data_nascimento,
      id_instituicao,
    ];

    valores.push(id);

    const query = `UPDATE tb_usuarios SET ${campos.join(", ")} WHERE idUsuario = ?`;

    const [result]: any = await pool.query(query, valores);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({ success: true, message: "Usuário atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao editar usuário:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
