import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import { useAuth } from "@/app/context/AuthContext";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = useAuth();

  const dscEmpresa = user?.dsc_instituicao?.toLowerCase() || "";

  const fileName =
    dscEmpresa.includes("vita")
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
