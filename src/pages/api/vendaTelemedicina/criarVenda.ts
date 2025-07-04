import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

interface NovaVendaTelemedicina {
    id_usuario: number;
    forma_pagamento: string;
    link_pagamento: string;
    tipo_venda: string;
    situacao_pagamento: string;
    valor_venda: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { 
        id_usuario, 
        forma_pagamento, 
        link_pagamento, 
        tipo_venda, 
        situacao_pagamento, 
        valor_venda 
    }: NovaVendaTelemedicina = req.body;

    if (!id_usuario || !forma_pagamento || !tipo_venda || !situacao_pagamento || !valor_venda) {
        return res.status(400).json({ 
            error: "Todos os campos obrigatórios devem ser preenchidos: id_usuario, forma_pagamento, tipo_venda, situacao_pagamento, valor_venda" 
        });
    }

    try {
        const [result]: any = await pool.query(
            "INSERT INTO tb_vendas_telemedicina (id_usuario, forma_pagamento, link_pagamento, tipo_venda, situacao_pagamento, valor_venda, criado_em) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [id_usuario, forma_pagamento, link_pagamento || null, tipo_venda, situacao_pagamento, valor_venda]
        );

        return res.status(201).json({ 
            success: true, 
            message: "Venda de telemedicina criada com sucesso!", 
            idVenda: result.insertId 
        });
    } catch (error) {
        console.error("🔥 Erro ao criar venda de telemedicina:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
