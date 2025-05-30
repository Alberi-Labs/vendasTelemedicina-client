// pages/api/clienteSaudeecor/buscarDados.ts

import { NextApiRequest, NextApiResponse } from "next";
import { DadosSaudeECor } from "@/types/dadosSaudeECor"; // Para CPF
import { DadosSaudeECorPJ } from "@/types/dadosSaudeECorPJ";

const SaudeECorURL = process.env.SAUDE_E_COR_URL;
const SaudeECorURLPJ = process.env.SAUDE_E_COR_URL_PJ;
const authToken = process.env.SAUDE_E_COR_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido. Use POST." });
  }

  const { cpf } = req.body;

  if (!cpf) {
    return res.status(400).json({ message: "CPF ou CNPJ é obrigatório." });
  }

  const docNumeros = cpf.replace(/\D/g, "");
  const isCPF = docNumeros.length === 11;
  const endpoint = isCPF ? SaudeECorURL : SaudeECorURLPJ;

  const payload = isCPF
    ? {
        app: "backend",
        user: "1",
        auth_token: authToken,
        cpf: docNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
      }
    : {
        app: "backend",
        user: "1",
        auth_token: authToken,
        cnpj: docNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"),
      };

  try {
    const response = await fetch(endpoint as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: "Erro na requisição externa", error: errorText });
    }

    if (isCPF) {
      const data: DadosSaudeECor = await response.json();
      return res.status(200).json(data);
    } else {
      const data: DadosSaudeECorPJ[] = await response.json(); // Geralmente retorna um array
      return res.status(200).json(data);
    }

  } catch (error: any) {
    return res.status(500).json({ message: "Erro ao buscar os dados", error: error.message });
  }
}
