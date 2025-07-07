import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const { id_usuario } = req.query;
        let query = `
            SELECT id, empresa, local, data, horario, contatos, numero_funcionarios, descricao, situacao, observacoes, id_usuario, criado_em 
            FROM tb_crm_vendas
        `;
        let params: any[] = [];

        if (id_usuario) {
            query += " WHERE id_usuario = ?";
            params.push(id_usuario);
        }

        query += " ORDER BY criado_em DESC";

        const [rows]: any = await pool.query(query, params);

        // Processar os contatos que estão armazenados como JSON
        const vendasComContatos = rows.map((venda: any) => ({
            ...venda,
            contatos: venda.contatos ? JSON.parse(venda.contatos) : []
        }));

        return res.status(200).json({ success: true, vendas: vendasComContatos });
    } catch (error) {
        console.error("🔥 Erro ao consultar vendas do CRM:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
