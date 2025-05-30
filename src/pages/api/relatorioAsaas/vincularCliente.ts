import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Método não permitido. Use POST." });
    }

    const registros: any[] = req.body;
    if (!Array.isArray(registros) || registros.length === 0) {
        return res.status(400).json({ message: "Lista vazia ou inválida." });
    }

    const resultados: any[] = [];
    const cacheInstituicoes: Record<string, number> = {};
    const insertClientes: any[] = [];
    const insertEmpresas: any[] = [];

    // 1. Buscar instituições necessárias
    const instituicoesUnicas = [
        ...new Set(
            registros
                .map(c => c.dsc_instituicao?.trim())
                .filter(nome => typeof nome === "string")
        ),
    ];
    for (const nome of instituicoesUnicas) {
        const [rows] = await pool.query(`SELECT idInstituicao FROM tb_instituicao WHERE nomeInstituicao = ?`, [nome]);
        if (Array.isArray(rows) && rows.length > 0) {
            cacheInstituicoes[nome] = (rows[0] as any).idInstituicao;
        }
    }

    // 2. Processar registros
    for (const dados of registros) {
        const nom_cliente = dados.nom_cliente?.trim() || dados.nom_empresa?.trim();
        const num_cpf = dados.num_cpf?.replace(/\D/g, "");
        const num_cnpj = dados.num_cnpj?.replace(/\D/g, "");
        const dsc_email = dados.dsc_email?.trim() || null;
        const num_celular = dados.num_celular?.trim() || null;
        const dsc_instituicao = dados.dsc_instituicao?.trim();

        if (!nom_cliente || !dsc_instituicao) {
            resultados.push({
                status: "erro",
                entidade: nom_cliente || "Desconhecido",
                motivo: "Campos obrigatórios ausentes.",
            });
            continue;
        }

        let id_instituicao = cacheInstituicoes[dsc_instituicao];

        if (!id_instituicao) {
            try {
                const [insertResult] = await pool.query(
                    "INSERT INTO tb_instituicao (nomeInstituicao) VALUES (?)",
                    [dsc_instituicao]
                );
                id_instituicao = (insertResult as any).insertId;
                cacheInstituicoes[dsc_instituicao] = id_instituicao;
                console.log(`🏛️ Instituição criada: ${dsc_instituicao} (ID: ${id_instituicao})`);
            } catch (err) {
                resultados.push({
                    status: "erro",
                    entidade: nom_cliente,
                    motivo: `Erro ao criar a instituição '${dsc_instituicao}'`,
                });
                continue;
            }
        }


        if (num_cnpj?.length === 14) {
            insertEmpresas.push([
                nom_cliente, // nomeEmpresa
                dsc_email,
                num_celular,
                num_cnpj,
                id_instituicao,
            ]);

            resultados.push({ status: "ok", entidade: nom_cliente, tipo: "empresa" });
        } else if (num_cpf?.length === 11) {
            insertClientes.push([nom_cliente, num_cpf, dsc_email, num_celular, id_instituicao]);
            resultados.push({ status: "ok", entidade: nom_cliente, tipo: "cliente" });
        } else {
            resultados.push({
                status: "erro",
                entidade: nom_cliente,
                motivo: "CPF ou CNPJ inválido.",
            });
        }
    }
    console.log(insertClientes)
    console.log(insertEmpresas)
    // 3. Inserir clientes
    if (insertClientes.length > 0) {
        const sqlClientes = `
      INSERT INTO tb_clientes (nome, cpf, email, telefone, id_instituicao)
      VALUES ${insertClientes.map(() => "(?, ?, ?, ?, ?)").join(", ")}
      ON DUPLICATE KEY UPDATE
        nome = VALUES(nome),
        email = VALUES(email),
        telefone = VALUES(telefone),
        id_instituicao = VALUES(id_instituicao)
    `;

        try {
            const [result] = await pool.query(sqlClientes, insertClientes.flat());
            console.log("✅ Clientes inseridos:", result);
        } catch (error: any) {
            return res.status(500).json({ message: "Erro ao inserir clientes", error: error.message });
        }
    }

    // 4. Inserir empresas
    if (insertEmpresas.length > 0) {
        const sqlEmpresas = `
  INSERT INTO tb_empresas (
    nomeEmpresa, email, celular, cnpj, id_instituicao
  )
  VALUES ${insertEmpresas.map(() => "(?, ?, ?, ?, ?)").join(", ")}
  ON DUPLICATE KEY UPDATE
    nomeEmpresa = VALUES(nomeEmpresa),
    email = VALUES(email),
    celular = VALUES(celular),
    id_instituicao = VALUES(id_instituicao)
`;



        try {
            console.log(sqlEmpresas)
            const [result] = await pool.query(sqlEmpresas, insertEmpresas.flat());
            console.log("🏢 Empresas inseridas:", result);
        } catch (error: any) {
            return res.status(500).json({ message: "Erro ao inserir empresas", error: error.message });
        }
    }

    return res.status(200).json({ message: "Processamento concluído", resultados });
}
