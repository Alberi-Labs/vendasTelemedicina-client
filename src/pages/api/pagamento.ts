import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const {
      nome,
      email,
      cpf,
      celular,
      nascimento,
      cep,
      endereco,
      casa,
      sexo,
      uf,
      cidade,
      formaPagamento,
      tipoPagamentoLoja, // Cartão de crédito, débito ou dinheiro
    } = req.body;

    // Verifica se os dados obrigatórios foram enviados
    if (!nome || !email || !cpf || !celular || !nascimento || !cep || !endereco || !casa || !sexo || !uf || !cidade || !formaPagamento) {
      return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    // Se for pagamento em loja, `tipoPagamentoLoja` precisa ser enviado
    if (formaPagamento === "loja" && !tipoPagamentoLoja) {
      return res.status(400).json({ error: "É necessário informar se o pagamento foi feito com dinheiro, débito ou crédito." });
    }

    // Define o status inicial do pagamento
    let statusPagamento = "pendente";
    let dataConfirmacaoPagamento = null;

    // Se for pagamento em loja, confirma automaticamente e salva a data
    if (formaPagamento === "loja") {
      statusPagamento = "confirmado";
      dataConfirmacaoPagamento = new Date();
    }

    // 🔹 Inserir a venda na tabela `tb_vendas_consulta`
    const query = `
      INSERT INTO tb_vendas_consulta 
      (nome, email, cpf, celular, nascimento, cep, endereco, casa, sexo, uf, cidade, forma_pagamento, tipo_pagamento_loja, status_pagamento, data_confirmacao_pagamento) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nome,
      email,
      cpf,
      celular,
      nascimento,
      cep,
      endereco,
      casa,
      sexo,
      uf,
      cidade,
      formaPagamento,
      formaPagamento === "loja" ? tipoPagamentoLoja : null, // Somente se for pagamento em loja
      statusPagamento,
      dataConfirmacaoPagamento,
    ];

    const [result]: any = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: formaPagamento === "loja" ? `Pagamento confirmado com sucesso (${tipoPagamentoLoja}).` : "Venda registrada, aguardando pagamento via Pix.",
      vendaId: result.insertId,
      statusPagamento,
      tipoPagamentoLoja,
    });
  } catch (error) {
    console.error("🔥 Erro ao processar pagamento:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
