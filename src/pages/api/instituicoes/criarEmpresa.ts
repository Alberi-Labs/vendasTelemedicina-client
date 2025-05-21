import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

function getField(field: string | string[] | undefined): string {
  return Array.isArray(field) ? field[0] : field ?? "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não permitido" });
  }

  const uploadDir = path.join(process.cwd(), "public/uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = new IncomingForm({ uploadDir, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Erro ao processar formulário:", err);
      return res.status(500).json({ success: false, message: "Erro no processamento do formulário" });
    }

    try {
      const imagemPath = files.imagem_perfil
        ? `/uploads/${path.basename((files.imagem_perfil as any).filepath)}`
        : null;

      const {
        nomeInstituicao,
        nomeFantasia,
        email,
        cnpj,
        celular,
        cep,
        endereco,
        uf,
        cidade,
        ativo,
        valor_plano,
      } = fields;

      await pool.query(
        `INSERT INTO tb_instituicao (
          nomeInstituicao, nomeFantasia, email, cnpj, celular, cep,
          endereco, uf, cidade, ativo, valor_plano, imagem_perfil
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          getField(nomeInstituicao),
          getField(nomeFantasia),
          getField(email),
          getField(cnpj),
          getField(celular),
          getField(cep),
          getField(endereco),
          getField(uf),
          getField(cidade),
          getField(ativo) === "true",
          parseFloat(getField(valor_plano) || "0"),
          imagemPath,
        ]
      );

      return res.status(201).json({ success: true, message: "Instituicao criada com sucesso" });
    } catch (error) {
      console.error("Erro ao salvar instituicao:", error);
      return res.status(500).json({ success: false, message: "Erro ao salvar instituicao" });
    }
  });
}
