import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "CPF é obrigatório." });
    }

    try {
        const [result]: any = await pool.query("DELETE FROM tb_clientes WHERE idCliente = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Cliente não encontrado." });
        }

        return res.status(200).json({ success: true, message: "Cliente deletado com sucesso." });
    } catch (error) {
        console.error("🔥 Erro ao deletar cliente:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
