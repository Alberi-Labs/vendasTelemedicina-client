import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "PUT") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { id } = req.query;
    const { 
        empresa, 
        local, 
        data, 
        horario, 
        contatos, 
        numero_funcionarios, 
        descricao, 
        situacao, 
        observacoes 
    } = req.body;

    if (!id) {
        return res.status(400).json({ error: "ID da venda é obrigatório." });
    }

    if (!empresa || !local || !data || !horario || !contatos || !descricao || !situacao) {
        return res.status(400).json({ 
            error: "Todos os campos obrigatórios devem ser preenchidos." 
        });
    }

    try {
        const result: any = await executeQuery(
            `UPDATE tb_crm_vendas SET 
            empresa = ?, local = ?, data = ?, horario = ?, 
            contatos = ?, numero_funcionarios = ?, descricao = ?, situacao = ?, observacoes = ?
            WHERE id = ?`,
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
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Venda não encontrada." });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Venda do CRM atualizada com sucesso!" 
        });
    } catch (error) {
        console.error("🔥 Erro ao atualizar venda do CRM:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
