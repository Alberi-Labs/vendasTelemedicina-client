import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = process.env.NEXT_PUBLIC_ASAAS_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("acess_token não encontrado no ambiente");
    return res.status(500).json({ error: "Erro interno: acess_token não configurado." });
  }

  const url = 'https://api-sandbox.asaas.com/v3/payments';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  };

  try {
    const response = await fetch(url, options);
    const json = await response.json();
    return res.status(response.ok ? 200 : response.status).json(json);
  } catch (err) {
    console.error("Erro ao buscar cobranças:", err);
    return res.status(500).json({ error: "Erro interno ao buscar cobranças" });
  }
}
