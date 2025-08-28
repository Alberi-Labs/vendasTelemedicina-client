import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        // Buscar todos os usuários que têm CRMs cadastrados
        const query = `
            SELECT DISTINCT 
                u.idUsuario,
                u.nome,
                u.perfil
            FROM tb_usuarios u
            INNER JOIN tb_crm_vendas crm ON u.idUsuario = crm.id_usuario
            ORDER BY u.nome ASC
        `;

        const [rows]: any = await pool.query(query);

        return res.status(200).json({ success: true, vendedores: rows });
    } catch (error) {
        console.error("🔥 Erro ao listar vendedores:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
