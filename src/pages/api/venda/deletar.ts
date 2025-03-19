import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { idVenda } = req.query;

    if (!idVenda) {
        return res.status(400).json({ error: "ID da venda é obrigatório." });
    }

    try {
        const [result]: any = await pool.query("DELETE FROM tb_vendas WHERE idVenda = ?", [idVenda]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Venda não encontrada." });
        }

        return res.status(200).json({ success: true, message: "Venda deletada com sucesso." });
    } catch (error) {
        console.error("🔥 Erro ao deletar venda:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
