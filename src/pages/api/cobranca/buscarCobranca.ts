import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import dayjs from "dayjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const { mes, ano, idCliente, idEmpresa } = req.query;

  if (!mes || !ano) {
    return res.status(400).json({ message: "Parâmetros mes e ano são obrigatórios." });
  }

  const mesStr = String(mes).padStart(2, "0");
  const dataInicio = dayjs(`${ano}-${mesStr}-01`).startOf("month").format("YYYY-MM-DD");
  const dataFim = dayjs(`${ano}-${mesStr}-01`).endOf("month").format("YYYY-MM-DD");

  let queryConditions = [
    `c.dt_pagamento IS NOT NULL`,
    `c.dt_pagamento BETWEEN ? AND ?`
  ];

  let queryParams = [dataInicio, dataFim];

  if (idCliente) {
    queryConditions.push("c.id_cliente = ?");
    queryParams.push(Array.isArray(idCliente) ? idCliente[0] : idCliente);
  }

  if (idEmpresa) {
    queryConditions.push("c.id_empresa = ?");
    queryParams.push(Array.isArray(idEmpresa) ? idEmpresa[0] : idEmpresa);
  }

  try {
    const [rows]: any = await pool.query(
      `
      SELECT 
        c.idCobranca,
        c.id_cliente,
        c.id_empresa,
        c.valor_pg,
        c.valor_pg_asass,
        c.dt_pagamento,
        cl.nome AS cliente_nome,
        e.nomeEmpresa AS empresa_nome
      FROM tb_cobrancas c
      LEFT JOIN tb_clientes cl ON cl.idCliente = c.id_cliente
      LEFT JOIN tb_empresas e ON e.idEmpresa = c.id_empresa
      WHERE ${queryConditions.join(" AND ")}
      `,
      queryParams
    );
    res.status(200).json(rows);
  } catch (error: any) {
    console.error("Erro ao buscar cobranças:", error);
    res.status(500).json({ message: "Erro ao buscar dados", error: error.message });
  }
}
