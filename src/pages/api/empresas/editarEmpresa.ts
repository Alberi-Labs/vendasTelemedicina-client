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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, message: "Método não permitido" });
  }

  const uploadDir = path.join(process.cwd(), "public/uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = new IncomingForm({ uploadDir, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Erro ao processar form:", err);
      return res.status(500).json({ success: false, message: "Erro ao processar o formulário" });
    }

    try {
      const { idEmpresa, nomeEmpresa, email, ativo, valor_plano } = fields;

      let imagemPath = null;
      if (files.imagem_perfil) {
        const imagem = Array.isArray(files.imagem_perfil)
          ? files.imagem_perfil[0]
          : files.imagem_perfil;

        if (imagem?.filepath) {
          imagemPath = `/uploads/${path.basename(imagem.filepath)}`;
        }
      }

      await pool.query(
        `UPDATE tb_empresas SET 
          nomeEmpresa = ?, 
          email = ?, 
          ativo = ?, 
          valor_plano = ?
          ${imagemPath ? ", imagem_perfil = ?" : ""}
          WHERE idEmpresa = ?`,
        imagemPath
          ? [
              (nomeEmpresa as string[])[0],
              (email as string[])[0],
              String((ativo as string[])[0]) === "true",
              parseFloat((valor_plano as string[])[0]),
              imagemPath,
              (idEmpresa as string[])[0],
            ]
          : [
              (nomeEmpresa as string[])[0],
              (email as string[])[0],
              String((ativo as string[])[0]) === "true",
              parseFloat((valor_plano as string[])[0]),
              (idEmpresa as string[])[0],
            ]
      );

      return res.status(200).json({ success: true, message: "Empresa atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      return res.status(500).json({ success: false, message: "Erro ao atualizar empresa" });
    }
  });
}
