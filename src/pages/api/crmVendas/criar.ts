import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { 
        empresa, 
        local, 
        data, 
        horario, 
        contatos, 
        numero_funcionarios, 
        descricao, 
        situacao, 
        observacoes, 
        id_usuario 
    } = req.body;

    if (!empresa || !local || !data || !horario || !contatos || !descricao || !situacao || !id_usuario) {
        return res.status(400).json({ 
            error: "Todos os campos obrigatórios devem ser preenchidos." 
        });
    }

    if (!contatos || contatos.length === 0) {
        return res.status(400).json({ 
            error: "Pelo menos um contato é obrigatório." 
        });
    }

    // Validar se o primeiro contato tem os campos obrigatórios
    const primeiroContato = contatos[0];
    if (!primeiroContato.nome || !primeiroContato.telefone || !primeiroContato.cargo) {
        return res.status(400).json({ 
            error: "Nome, telefone e cargo são obrigatórios para o primeiro contato." 
        });
    }

    try {
        const [result]: any = await pool.query(
            `INSERT INTO tb_crm_vendas 
            (empresa, local, data, horario, contatos, numero_funcionarios, descricao, situacao, observacoes, id_usuario, criado_em) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                empresa, 
                local, 
                data, 
                horario, 
                JSON.stringify(contatos), 
                numero_funcionarios, 
                descricao, 
                situacao, 
                observacoes, 
                id_usuario
            ]
        );

        return res.status(201).json({ 
            success: true, 
            message: "Venda do CRM criada com sucesso!", 
            id: result.insertId 
        });
    } catch (error) {
        console.error("🔥 Erro ao criar venda do CRM:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
