import { NextApiRequest, NextApiResponse } from "next";
import { pagamentosConfirmados } from "./retornoAssas";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID do pagamento não informado" });
    }

    // Verifica se o pagamento está na lista de confirmados
    const confirmado = pagamentosConfirmados.has(id as string);

    return res.status(200).json({ confirmado });

  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
