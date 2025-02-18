import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { idEmpresa } = req.query;
  console.log(idEmpresa)
  if (!idEmpresa) {
    return res.status(400).json({ error: "ID da empresa é obrigatório" });
  }

  const connection = await pool.getConnection();
  try {
    const [vidas]: any = await connection.query(
        `SELECT v.* 
         FROM tb_vidas v
         INNER JOIN tb_relacao_empresa_vida rev ON v.idVida = rev.idVida
         INNER JOIN tb_empresa e ON rev.idEmpresa = e.idEmpresa
         WHERE rev.idEmpresa = ? AND e.ativo = true`,
        [idEmpresa]
      );
      
      const vidasFormatadas = vidas.map((vida: any) => ({
        ...vida,
        nascimento: new Date(vida.nascimento).toLocaleDateString("pt-BR"),
      }));
      
      if (vidasFormatadas.length === 0) {
        return res.status(404).json({ message: "Nenhuma vida encontrada para esta empresa" });
      }
      
      res.status(200).json(vidasFormatadas);
      
  } catch (error) {
    console.error("Erro ao buscar vidas:", error);
    res.status(500).json({ error: "Erro ao buscar vidas" });
  } finally {
    connection.release();
  }
}
