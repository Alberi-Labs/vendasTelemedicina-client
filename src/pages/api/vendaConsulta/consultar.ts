import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

// 🔹 Interface para Venda
interface Venda {
    idVenda: number;
    id_cliente: number;
    nome_cliente: string; // <- aqui
    data: string;
    valor: string;
    forma_pagamento: string;
    status_pagamento: string;
    data_pagamento: string | null;
  }
  

// 🔹 Função para converter a data para o formato brasileiro (DD/MM/YYYY)
const formatarDataParaBrasileiro = (data: string | Date | null) => {
    if (!data) return null;

    // Se a data for string no formato YYYY-MM-DD, apenas troca a ordem
    if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
        const [ano, mes, dia] = data.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    // Se for uma data em formato Date (ISO), converte corretamente
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const { id_cliente } = req.query;
        let query = `
        SELECT v.*, c.nome AS nome_cliente 
        FROM tb_vendas_consulta v 
        JOIN tb_clientes c ON v.id_cliente = c.idCliente
      `;
              let params: any[] = [];

        if (id_cliente) {
            query += " WHERE id_cliente = ?";
            params.push(id_cliente);
        }

        const [rows]: any = await pool.query(query, params);

        if (id_cliente && rows.length === 0) {
            return res.status(404).json({ error: "Nenhuma venda encontrada para este cliente." });
        }

        const vendasFormatadas: Venda[] = rows.map((venda: any) => ({
            idVenda: venda.idVenda,
            id_cliente: venda.id_cliente,
            nome_cliente: venda.nome_cliente, // <- aqui
            data: formatarDataParaBrasileiro(venda.data),
            valor: venda.valor,
            forma_pagamento: venda.forma_pagamento,
            status_pagamento: venda.status_pagamento,
            data_pagamento: formatarDataParaBrasileiro(venda.data_pagamento),
          }));
          

        return res.status(200).json({ success: true, vendas: vendasFormatadas });
    } catch (error) {
        console.error("🔥 Erro ao consultar vendas:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
