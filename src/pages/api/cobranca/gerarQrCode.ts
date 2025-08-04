import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const url = 'https://api-sandbox.asaas.com/v3/pix/qrCodes/static';

        const body = {
            addressKey: process.env.ASAAS_PIX_KEY,
            description: "Pagamento Teleconsulta",
            value: 29.90,
            format: 'payload',
            expirationSeconds: 1800,
            allowsMultiplePayments: false
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                access_token: process.env.ASAAS_API_KEY || ''
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        console.log(data);
        if (!response.ok) {
            return res.status(response.status).json({ error: data });
        }

        return res.status(200).json({
            id: data.id,
            encodedImage: data.encodedImage,
            payload: data.payload,
            allowsMultiplePayments: data.allowsMultiplePayments,
            expirationDate: data.expirationDate,
        });

    } catch (error) {
        console.error("Erro ao gerar QR Code:", error);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
}
