import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

interface VendaTelemedicina {
    idVenda: number;
    id_usuario: number;
    nome_usuario: string;
    forma_pagamento: string;
    link_pagamento: string | null;
    tipo_venda: string;
    situacao_pagamento: string;
    valor_venda: string;
    criado_em: string;
}

const formatarDataParaBrasileiro = (data: string | Date | null) => {
    if (!data) return null;

    const dataObj = new Date(data);
    return dataObj.toLocaleString("pt-BR", { 
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const { id_usuario } = req.query;
        let query = `
            SELECT v.*, u.nome AS nome_usuario 
            FROM tb_vendas_telemedicina v 
            JOIN tb_usuarios u ON v.id_usuario = u.id
        `;
        let params: any[] = [];

        if (id_usuario) {
            query += " WHERE v.id_usuario = ?";
            params.push(id_usuario);
        }

        query += " ORDER BY v.criado_em DESC";

        const [rows]: any = await pool.query(query, params);

        if (id_usuario && rows.length === 0) {
            return res.status(404).json({ error: "Nenhuma venda de telemedicina encontrada para este usuário." });
        }

        const vendasFormatadas: VendaTelemedicina[] = rows.map((venda: any) => ({
            idVenda: venda.idVenda,
            id_usuario: venda.id_usuario,
            nome_usuario: venda.nome_usuario,
            forma_pagamento: venda.forma_pagamento,
            link_pagamento: venda.link_pagamento,
            tipo_venda: venda.tipo_venda,
            situacao_pagamento: venda.situacao_pagamento,
            valor_venda: venda.valor_venda,
            criado_em: formatarDataParaBrasileiro(venda.criado_em),
        }));

        console.log("Vendas de telemedicina formatadas:", vendasFormatadas);
        return res.status(200).json({ success: true, vendas: vendasFormatadas });
    } catch (error) {
        console.error("🔥 Erro ao consultar vendas de telemedicina:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
