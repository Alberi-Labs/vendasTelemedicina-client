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
                    access_token: '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmEyY2QxYjQwLTA0ZTktNGU0Mi05ODQ3LTQzY2IwY2Q5OGNkNzo6JGFhY2hfNTRmY2U5YzktMjFhZC00NTIwLTkxYTMtZDM5OGYzZGNiY2Rm'
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
