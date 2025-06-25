import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const { mes, ano, idInstituicao } = req.query;

  if (!mes || !ano || !idInstituicao) {
    return res.status(400).json({ message: "Parâmetros ausentes ou inválidos." });
  }

  try {
    const [rows]: any = await pool.query(
      `
      SELECT 
        COUNT(*) AS qtdVidas,
        SUM(c.valor_pg) AS valorBruto,
        SUM(c.valor_pg - c.valor_pg_asass) AS descontoAsaas,
        SUM(c.valor_pg_asass) AS valorLiquido
      FROM tb_cobrancas c
      LEFT JOIN tb_clientes cl ON cl.idCliente = c.id_cliente
      LEFT JOIN tb_empresas e ON e.idEmpresa = c.id_empresa
      WHERE 
        (cl.id_instituicao = ? OR e.id_instituicao = ?)
        AND MONTH(c.dt_pagamento) = ?
        AND YEAR(c.dt_pagamento) = ?
        AND c.dt_pagamento IS NOT NULL
      `,
      [idInstituicao, idInstituicao, mes, ano]
    );
    console.log("rows", rows[0]);
    res.status(200).json(rows[0]);
  } catch (error: any) {
    console.error("Erro ao buscar quadro comparativo:", error);
    res.status(500).json({ message: "Erro ao buscar dados", error: error.message });
  }
}
