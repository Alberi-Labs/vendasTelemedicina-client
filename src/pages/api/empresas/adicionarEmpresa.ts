// src/pages/api/empresas/adicionarEmpresa.ts
import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido. Use POST." });
  }

  const {
    nomeEmpresa,
    nomeFantasia,
    email,
    cnpj,
    celular,
    cep,
    endereco,
    uf,
    cidade,
    valor_plano,
    imagem_perfil,
    api_asaas,
  } = req.body;

  if (!nomeEmpresa || !cnpj) {
    return res.status(400).json({ message: "Campos obrigatórios ausentes: nomeEmpresa e cnpj" });
  }

  try {
    const sql = `
      INSERT INTO tb_empresas (
        nomeEmpresa, nomeFantasia, email, cnpj, celular,
        cep, endereco, uf, cidade, valor_plano,
        imagem_perfil, api_asaas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nomeEmpresa,
      nomeFantasia || null,
      email || null,
      cnpj,
      celular || null,
      cep || null,
      endereco || null,
      uf || null,
      cidade || null,
      valor_plano || null,
      imagem_perfil || null,
      api_asaas || null,
    ];

    await pool.query(sql, values);
    return res.status(200).json({ success: true, message: "Empresa adicionada com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao adicionar empresa:", error);
    return res.status(500).json({ success: false, message: "Erro ao adicionar empresa", error: error.message });
  }
}
