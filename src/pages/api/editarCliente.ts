import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const {
      id,
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
      forma_pagamento,
      tipo_pagamento_loja,
      status_pagamento,
      data_confirmacao_pagamento,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "O ID da venda é obrigatório." });
    }

    // 🔹 Atualiza todas as informações na `tb_vendas`
    const query = `
      UPDATE tb_vendas 
      SET 
        nome = ?, email = ?, cpf = ?, celular = ?, nascimento = ?, cep = ?, endereco = ?, 
        casa = ?, sexo = ?, uf = ?, cidade = ?, forma_pagamento = ?, tipo_pagamento_loja = ?, 
        status_pagamento = ?, data_confirmacao_pagamento = ?
      WHERE id = ?
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
      forma_pagamento,
      tipo_pagamento_loja,
      status_pagamento,
      data_confirmacao_pagamento || null, // Se não for enviado, mantém NULL
      id,
    ];

    const [result]: any = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Registro não encontrado." });
    }

    return res.status(200).json({ success: true, message: "Informações atualizadas com sucesso!" });
  } catch (error) {
    console.error("🔥 Erro ao atualizar a venda:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
