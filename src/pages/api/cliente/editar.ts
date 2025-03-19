import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

// 🔹 Interface para tipagem dos dados do cliente
interface Cliente {
    nome: string;
    telefone: string;
    email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "PUT") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { cpf } = req.query;
    const { nome, telefone, email }: Cliente = req.body;

    if (!cpf) {
        return res.status(400).json({ error: "CPF é obrigatório." });
    }

    try {
        const [result]: any = await pool.query(
            "UPDATE tb_clientes SET nome = ?, telefone = ?, email = ? WHERE cpf = ?",
            [nome, telefone, email, cpf]
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
