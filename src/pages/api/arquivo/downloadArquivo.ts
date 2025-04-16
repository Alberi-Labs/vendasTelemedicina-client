import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const fileName = "Guia Explicativo + Anexo.pdf"; // Nome do seu arquivo
  const filePath = path.resolve("./public", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Arquivo não encontrado." });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}
