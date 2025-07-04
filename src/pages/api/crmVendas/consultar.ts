import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const { id_usuario } = req.query;
        
        // Validar se o id_usuario foi fornecido
        if (!id_usuario) {
            return res.status(400).json({ error: "ID do usuário é obrigatório." });
        }

        // Consultar apenas as propostas do usuário específico
        const query = `
            SELECT id, empresa, local, data, horario, contatos, numero_funcionarios, descricao, situacao, observacoes, id_usuario, criado_em 
            FROM tb_crm_vendas
            WHERE id_usuario = ?
            ORDER BY criado_em DESC
        `;

        const rows: any = await executeQuery(query, [id_usuario]);

        if (rows.length === 0) {
            return res.status(200).json({ 
                success: true, 
                vendas: [], 
                message: "Nenhuma proposta encontrada para este usuário." 
            });
        }

        // Processar os contatos que estão armazenados como JSON
        const vendasComContatos = rows.map((venda: any) => ({
            ...venda,
            contatos: venda.contatos ? JSON.parse(venda.contatos) : []
        }));

        console.log(`Propostas encontradas para usuário ${id_usuario}:`, vendasComContatos.length);
        return res.status(200).json({ success: true, vendas: vendasComContatos });
    } catch (error) {
        console.error("🔥 Erro ao consultar vendas do CRM:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
