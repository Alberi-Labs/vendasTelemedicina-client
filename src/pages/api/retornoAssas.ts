import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const data = req.body;

    // 🔹 Log dos dados recebidos para depuração
    console.log("🔹 Webhook recebido do Asaas:", JSON.stringify(data, null, 2));

    // 📌 Se precisar processar os dados, adicione lógica aqui
    // Exemplo: verificar se o pagamento foi aprovado
    if (data.event === "PAYMENT_RECEIVED") {
      console.log(`✅ Pagamento recebido: ${data.payment.id}, Valor: ${data.payment.value}`);
      // Aqui você poderia atualizar o banco de dados, enviar notificações, etc.
    }

    // 🔹 Sempre retorna 200 para garantir que o Asaas não tente reenviar os dados
    return res.status(200).json({ message: "Webhook recebido com sucesso" });

  } catch (error) {
    console.error("Erro ao processar webhook do Asaas:", error);
    return res.status(200).json({ message: "Erro ao processar, mas retorno garantido" }); // Sempre retorna 200
  }
}
