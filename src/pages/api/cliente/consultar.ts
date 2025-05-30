import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

// 🔹 Definição da Interface do Cliente
interface Cliente {
    idCliente: number;
    nome: string;
    telefone: string;
    email: string;
    cpf: string;
    data_nascimento: string | null;
    idClienteDependente: number | null;
    data_vinculo: string | null;
    creditos: number | null;
}

const formatarDataParaBrasileiro = (data: string | null) => {
    if (!data) return null;
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString("pt-BR"); // Converte para DD/MM/AAAA
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const { cpf } = req.query;
        let query = "SELECT * FROM tb_clientes";
        let params: any[] = [];

        if (cpf) {
            query += " WHERE cpf = ?";
            params.push(cpf);
        }

        const [rows]: any = await pool.query(query, params);

        if (cpf && rows.length === 0) {
            return res.status(404).json({ error: "Cliente não encontrado." });
        }
        const clientesFormatados: Cliente[] = rows.map((cliente: any) => ({
            idCliente: cliente.idCliente,
            nome: cliente.nome,
            telefone: cliente.telefone,
            email: cliente.email,
            cpf: cliente.cpf,
            data_nascimento: formatarDataParaBrasileiro(cliente.data_nascimento), // ✅ Agora vem no formato brasileiro
            idClienteDependente: cliente.idClienteDependente,
            data_vinculo: cliente.data_vinculo && !isNaN(new Date(cliente.data_vinculo).getTime()) 
                ? new Date(cliente.data_vinculo).toISOString().split("T")[0] 
                : null,
            creditos: cliente.creditos,
        }));
        return res.status(200).json({ success: true, clientes: clientesFormatados });
    } catch (error) {
        console.error("🔥 Erro ao consultar clientes:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
}
