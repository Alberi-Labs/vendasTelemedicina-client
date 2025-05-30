import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import dayjs from "dayjs";

interface Cobranca {
  cpf: string;
  mesReferencia: string;
  dt_vencimento: string;
  dt_pagamento: string | null;
  valor_pg: number;
  valor_pg_asaas: number;
}

interface ClienteRow extends RowDataPacket {
  idCliente: number;
}

interface EmpresaRow extends RowDataPacket {
  idEmpresa: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido. Use POST." });
  }

  const cobrancas: Cobranca[] = req.body;

  if (!Array.isArray(cobrancas) || cobrancas.length === 0) {
    return res.status(400).json({ message: "Lista de cobranças vazia ou inválida." });
  }

  try {
    const valoresInsercao: any[] = [];

    for (const c of cobrancas) {
      const doc = c.cpf.replace(/\D/g, "");

      let id_cliente: number | null = null;
      let id_empresa: number | null = null;

      if (doc.length === 11) {
        const [rows] = await pool.query<ClienteRow[]>(
          "SELECT idCliente FROM tb_clientes WHERE cpf = ? LIMIT 1",
          [doc]
        );
        id_cliente = rows[0]?.idCliente || null;
        if (!id_cliente) {
          console.warn(`⚠️ Cliente com CPF ${doc} não encontrado.`);
        }
      } else if (doc.length === 14) {
        const [rows] = await pool.query<EmpresaRow[]>(
          "SELECT idEmpresa FROM tb_empresas WHERE cnpj = ? LIMIT 1",
          [doc]
        );
        id_empresa = rows[0]?.idEmpresa || null;
        if (!id_empresa) {
          console.warn(`⚠️ Empresa com CNPJ ${doc} não encontrada.`);
        }
      } else {
        console.warn(`⚠️ Documento inválido: ${doc}`);
      }

      // Insere somente se pelo menos um ID estiver presente
      if (id_cliente !== null || id_empresa !== null) {
        valoresInsercao.push([
          id_cliente,
          id_empresa,
          c.mesReferencia,
          dayjs(c.dt_vencimento, ["DD/MM/YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD"),
          c.dt_pagamento ? dayjs(c.dt_pagamento, ["DD/MM/YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD") : null,
          c.valor_pg,
          c.valor_pg_asaas,
        ]);
      }
    }

    if (valoresInsercao.length === 0) {
      return res.status(400).json({ message: "Nenhuma cobrança válida para inserção." });
    }

    const sql = `
      INSERT INTO tb_cobrancas (
        id_cliente,
        id_empresa,
        mesReferencia,
        dt_vencimento,
        dt_pagamento,
        valor_pg,
        valor_pg_asass
      ) VALUES ?
    `;

    await pool.query(sql, [valoresInsercao]);

    return res.status(200).json({ message: "Cobranças inseridas com sucesso!" });
  } catch (error: any) {
    console.error("❌ Erro ao inserir cobranças:", error);
    return res.status(500).json({ message: "Erro ao inserir cobranças", error: error.message });
  }
}
