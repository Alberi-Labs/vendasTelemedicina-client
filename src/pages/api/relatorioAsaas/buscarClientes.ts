// pages/api/asaas/listarTodosClientes.ts
import { NextApiRequest, NextApiResponse } from "next";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const allCustomers: any[] = [];
    const limit = 100;
    let offset = 0;
    let hasMore = true;

    try {
        while (hasMore) {
            const response = await fetch(`https://api.asaas.com/v3/customers?limit=${limit}&offset=${offset}`, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    access_token: ASAAS_API_KEY
                }
            });

            const data = await response.json();

            if (!response.ok) {
                return res.status(response.status).json({ error: data });
            }

            allCustomers.push(...data.data);
            hasMore = data.hasMore;
            offset += limit;
        }

        return res.status(200).json(allCustomers);
    } catch (error) {
        console.error("Erro ao listar clientes:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
}
