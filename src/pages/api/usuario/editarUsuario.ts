import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

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
      creditos,
      data_nascimento,
      id_empresa,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Campo 'id' do usuário é obrigatório." });
    }

    const [result]: any = await pool.query(
      `UPDATE tb_usuarios SET 
        nome = ?, 
        email = ?, 
        telefone = ?, 
        perfil = ?, 
        imagem = ?, 
        cpf = ?, 
        creditos = ?, 
        data_nascimento = ?, 
        id_empresa = ? 
      WHERE idUsuario = ?`,
      [
        nome,
        email,
        telefone,
        perfil,
        imagem,
        cpf,
        creditos,
        data_nascimento,
        id_empresa, 
        id
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({ success: true, message: "Usuário atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao editar usuário:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
