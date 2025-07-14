// src/pages/api/empresas/listarEmpresas.ts
import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido. Use GET." });
  }

  try {
    const { cnpj, search } = req.query;
    
    let query = `
      SELECT idEmpresa, nomeEmpresa, nomeFantasia, email, cnpj, celular, 
             cep, endereco, uf, cidade, valor_plano
      FROM tb_empresas
    `;
    const params: any[] = [];

    // Filtros
    const conditions: string[] = [];
    
    if (cnpj) {
      conditions.push("cnpj = ?");
      params.push(cnpj);
    }
    
    if (search && typeof search === 'string') {
      conditions.push("LOWER(nomeEmpresa) LIKE LOWER(?)");
      params.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY nomeEmpresa ASC`;

    const empresas = await pool.query(query, params);
    
    // Extrai apenas os dados (primeiro elemento do array), ignorando metadados do MySQL
    const empresasData = Array.isArray(empresas) && Array.isArray(empresas[0]) ? empresas[0] : empresas;
    
    return res.status(200).json({ 
      success: true, 
      empresas: empresasData || [] 
    });
  } catch (error: any) {
    console.error("Erro ao listar empresas:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao listar empresas", 
      error: error.message 
    });
  }
}
