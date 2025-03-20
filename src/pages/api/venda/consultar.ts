import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

// 🔹 Interface para Venda
interface Venda {
    idVenda: number;
    id_cliente: number;
    data: string;
    valor: number;
    forma_pagamento: string;
    status_pagamento: string;
    data_pagamento: string | null;
}

// 🔹 Função para converter a data para o formato brasileiro (DD/MM/YYYY)
const formatarDataParaBrasileiro = (data: string | null) => {
    if (!data) return null;
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const { id_cliente } = req.query;
        let query = "SELECT * FROM tb_vendas";
        let params: any[] = [];

        if (id_cliente) {
            query += " WHERE id_cliente = ?";
            params.push(id_cliente);
        }

        const [rows]: any = await pool.query(query, params);

        if (id_cliente && rows.length === 0) {
            return res.status(404).json({ error: "Nenhuma venda encontrada para este cliente." });
        }

        // 🔹 Formatar os dados antes de enviar
        const vendasFormatadas: Venda[] = rows.map((venda: any) => ({
            idVenda: venda.idVenda,
            id_cliente: venda.id_cliente,
            data: formatarDataParaBrasileiro(venda.data), // ✅ Converte para DD/MM/YYYY
            valor: venda.valor,
            forma_pagamento: venda.forma_pagamento,
            status_pagamento: venda.status_pagamento,
            data_pagamento: formatarDataParaBrasileiro(venda.data_pagamento), // ✅ Converte para DD/MM/YYYY
        }));

        console.log(vendasFormatadas);
        return res.status(200).json({ success: true, vendas: vendasFormatadas });
    } catch (error) {
        console.error("🔥 Erro ao consultar vendas:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
