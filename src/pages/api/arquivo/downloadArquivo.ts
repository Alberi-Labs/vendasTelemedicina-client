import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { dscEmpresa } = req.query;

  if (!dscEmpresa || typeof dscEmpresa !== "string") {
    return res.status(400).json({ error: "Parâmetro 'dscEmpresa' é obrigatório." });
  }

  const empresaLower = dscEmpresa.toLowerCase();
  const fileName =
    empresaLower.includes("vita")
      ? "Guia Explicativo + Anexo(VITA).pdf"
      : "Guia Explicativo + Anexo.pdf";

  const filePath = path.resolve("./public", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Arquivo não encontrado." });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}
