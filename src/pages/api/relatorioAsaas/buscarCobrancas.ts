// pages/api/asaas/todasCobrancasPorCliente.ts
import { NextApiRequest, NextApiResponse } from "next";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY ?? "";

async function getAllCustomers() {
    const allCustomers: any[] = [];
    const limit = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(`https://api.asaas.com/v3/customers?limit=${limit}&offset=${offset}`, {
            headers: {
                'accept': 'application/json',
                'access_token': ASAAS_API_KEY
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));

        allCustomers.push(...data.data);
        hasMore = data.hasMore;
        offset += limit;
    }

    return allCustomers;
}

async function getPaymentsByCustomer(customerId: string): Promise<any[]> {
    const allPayments: any[] = [];
    const limit = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(`https://api.asaas.com/v3/payments?customer=${customerId}&limit=${limit}&offset=${offset}`, {
            headers: {
                'accept': 'application/json',
                'access_token': ASAAS_API_KEY
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));

        allPayments.push(...data.data);
        hasMore = data.hasMore;
        offset += limit;
    }

    return allPayments;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const customers = await getAllCustomers();

        // Executa as requisições em paralelo, com controle de concorrência
        const MAX_CONCURRENT = 10;
        const results: any[] = [];

        const chunks = Array.from({ length: Math.ceil(customers.length / MAX_CONCURRENT) }, (_, i) =>
            customers.slice(i * MAX_CONCURRENT, (i + 1) * MAX_CONCURRENT)
        );

        for (const chunk of chunks) {
            const chunkResults = await Promise.all(
                chunk.map(async (customer) => {
                    const payments = await getPaymentsByCustomer(customer.id);
                    return {
                        customerId: customer.id,
                        name: customer.name,
                        email: customer.email,
                        cpfCnpj: customer.cpfCnpj,
                        payments
                    };
                })
            );
            results.push(...chunkResults);
        }

        return res.status(200).json(results);
    } catch (error) {
        console.error("Erro ao buscar cobranças:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
}
