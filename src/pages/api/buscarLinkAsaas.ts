import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = "$aact_MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjVkNjE4ZTNkLTBiNTgtNDIwYi1hMzIxLTg5NzM5ZjYzMTgzMjo6JGFhY2hfM2Y0ZTUwMjMtM2YxMy00M2ZkLTg5YjktNWM0NmQ3NjA4NjRj";

  if (!accessToken) {
    console.error("acess_token não encontrado no ambiente");
    return res.status(500).json({ error: "Erro interno: acess_token não configurado." });
  }

  const url = 'https://api.asaas.com/v3/paymentLinks';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      access_token: `${accessToken}`
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
