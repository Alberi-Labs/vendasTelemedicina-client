import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const { id_usuario, perfil_usuario, vendedor_filtro } = req.query;
        
        let query = `
            SELECT 
                crm.id, 
                crm.empresa, 
                crm.local, 
                crm.data, 
                crm.horario, 
                crm.contatos, 
                crm.numero_funcionarios, 
                crm.descricao, 
                crm.situacao, 
                crm.observacoes, 
                crm.id_usuario, 
                crm.criado_em,
                u.nome as nome_vendedor
            FROM tb_crm_vendas crm
            LEFT JOIN tb_usuarios u ON crm.id_usuario = u.idUsuario
        `;
        let params: any[] = [];
        let whereConditions: string[] = [];

        // Se for vendedor, mostrar apenas os CRMs dele
        if (perfil_usuario === 'vendedor' && id_usuario) {
            whereConditions.push("crm.id_usuario = ?");
            params.push(id_usuario);
        }
        // Se for admin/gerente e tiver filtro por vendedor específico
        else if (vendedor_filtro && vendedor_filtro !== 'todos') {
            whereConditions.push("crm.id_usuario = ?");
            params.push(vendedor_filtro);
        }

        // Adicionar WHERE se houver condições
        if (whereConditions.length > 0) {
            query += " WHERE " + whereConditions.join(" AND ");
        }

        query += " ORDER BY crm.criado_em DESC";

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
