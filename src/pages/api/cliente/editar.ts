import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

// 🔹 Interface para tipagem dos dados do cliente
interface Cliente {
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  data_nascimento?: string | null;
  creditos?: number | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { id } = req.query;
  const { nome, telefone, email, cpf, data_nascimento, creditos }: Cliente = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID do cliente é obrigatório." });
  }

  try {
    const [result]: any = await pool.query(
      `UPDATE tb_clientes 
       SET nome = ?, telefone = ?, email = ?, cpf = ?, data_nascimento = ?, creditos = ?
       WHERE idCliente = ?`,
      [nome, telefone, email, cpf.replace(/\D/g, ""), data_nascimento, creditos, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente não encontrado." });
    }

    return res.status(200).json({ success: true, message: "Cliente atualizado com sucesso." });
  } catch (error) {
    console.error("🔥 Erro ao editar cliente:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
