import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "ID da venda é obrigatório." });
    }

    try {
        const result: any = await executeQuery("DELETE FROM tb_crm_vendas WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Venda do CRM não encontrada." });
        }

        return res.status(200).json({ success: true, message: "Venda do CRM deletada com sucesso." });
    } catch (error) {
        console.error("🔥 Erro ao deletar venda do CRM:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
