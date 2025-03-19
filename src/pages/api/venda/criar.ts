import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

// 🔹 Interface para criação de venda
interface NovaVenda {
    id_cliente: number;
    data: string;
    valor: number;
    forma_pagamento: string;
    status_pagamento: string;
    data_pagamento?: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { id_cliente, data, valor, forma_pagamento, status_pagamento, data_pagamento }: NovaVenda = req.body;

    if (!id_cliente || !data || !valor || !forma_pagamento || !status_pagamento) {
        return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    try {
        const [result]: any = await pool.query(
            "INSERT INTO tb_vendas (id_cliente, data, valor, forma_pagamento, status_pagamento, data_pagamento) VALUES (?, ?, ?, ?, ?, ?)",
            [id_cliente, data, valor, forma_pagamento, status_pagamento, data_pagamento || null]
        );

        return res.status(201).json({ success: true, message: "Venda criada com sucesso!", idVenda: result.insertId });
    } catch (error) {
        console.error("🔥 Erro ao criar venda:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
