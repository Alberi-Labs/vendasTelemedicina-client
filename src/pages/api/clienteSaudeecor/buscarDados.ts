// buscarDados.ts

import { DadosSaudeECor } from "@/types/dadosSaudeECor";
import { NextApiRequest, NextApiResponse } from "next";

const SaudeECorURL = process.env.SAUDE_E_COR_URL;
const authToken = process.env.SAUDE_E_COR_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido. Use POST." });
  }

  const { cpf } = req.body;

  if (!cpf) {
    return res.status(400).json({ message: "CPF é obrigatório." });
  }

  
  try {
    const response = await fetch(SaudeECorURL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app: "backend",
        user: "1",
        auth_token: authToken,
        cpf,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: "Erro na requisição externa", error: errorText });
    }

    const data: DadosSaudeECor = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ message: "Erro ao buscar os dados", error: error.message });
  }
}
