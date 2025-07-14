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
  } = req.body;

  if (!nomeEmpresa || !cnpj) {
    return res.status(400).json({ message: "Campos obrigatórios ausentes: nomeEmpresa e cnpj" });
  }

  try {
    // Limpa CNPJ e CEP removendo pontos, barras e hífens
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    const cepLimpo = cep ? cep.replace(/[^\d]/g, '') : null;

    // Verifica se já existe uma empresa com o mesmo nome ou CNPJ
    const checkSql = `
      SELECT id, nomeEmpresa, cnpj FROM tb_empresas 
      WHERE LOWER(nomeEmpresa) = LOWER(?) OR cnpj = ?
    `;
    
    const existingCompanies = await pool.query(checkSql, [nomeEmpresa, cnpjLimpo]);
    
    if (Array.isArray(existingCompanies) && existingCompanies.length > 0) {
      const existing = existingCompanies[0] as any;
      
      if (existing.cnpj === cnpjLimpo) {
        return res.status(409).json({ 
          message: `Empresa com CNPJ ${cnpj} já está cadastrada.`,
          existing: { id: existing.id, nomeEmpresa: existing.nomeEmpresa }
        });
      }
      
      if (existing.nomeEmpresa.toLowerCase() === nomeEmpresa.toLowerCase()) {
        return res.status(409).json({ 
          message: `Empresa com nome "${nomeEmpresa}" já está cadastrada.`,
          existing: { id: existing.id, nomeEmpresa: existing.nomeEmpresa }
        });
      }
    }
    const sql = `
      INSERT INTO tb_empresas (
        nomeEmpresa, nomeFantasia, email, cnpj, celular,
        cep, endereco, uf, cidade, valor_plano,
        ativo, imagem_perfil, instituicao, quantidade_vidas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      nomeEmpresa,
      nomeFantasia || null,
      email || null,
      cnpjLimpo,  // CNPJ limpo (apenas números)
      celular || null,
      cepLimpo,   // CEP limpo (apenas números)
      endereco || null,
      uf || null,
      cidade || null,
      valor_plano || null,
      1,          // ativo (padrão: 1 = ativo)
      null,       // imagem_perfil (padrão: null)
      null,       // instituicao (padrão: null)
      null,       // quantidade_vidas (padrão: null)
    ];

    await pool.query(sql, values);
    return res.status(200).json({ success: true, message: "Empresa adicionada com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao adicionar empresa:", error);
    return res.status(500).json({ success: false, message: "Erro ao adicionar empresa", error: error.message });
  }
}
