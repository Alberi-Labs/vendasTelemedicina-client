import { NextApiRequest, NextApiResponse } from "next";

// Armazena os pagamentos confirmados (IDs dos pagamentos)
const pagamentosConfirmados: Set<string> = new Set();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { event, payment } = req.body;
      if (event === "PAYMENT_RECEIVED" || payment?.status === "RECEIVED" || payment?.status === "CONFIRMED") {
        pagamentosConfirmados.add(payment.pixQrCodeId);
      }

      return res.status(200).json({ message: "Webhook recebido com sucesso" });
    } catch (error) {
      console.error("Erro ao processar webhook do Asaas:", error);
      return res.status(200).json({ message: "Erro ao processar, mas retorno garantido" });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}

// Exportamos a variável para ser acessada na outra rota
export { pagamentosConfirmados };
