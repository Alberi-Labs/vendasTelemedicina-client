import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { exec } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const dados = req.body;
  const tempId = uuidv4();
  const tempDir = path.join(process.cwd(), "tmp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const docxPath = path.join(tempDir, `${tempId}.docx`);
  const pdfPath = path.join(tempDir, `${tempId}.pdf`);

  try {
    const templatePath = path.join(process.cwd(), "templates", "modelo.docx");
    const content = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.setData(dados);

    doc.render();

    const bufferDocx = doc.getZip().generate({ type: "nodebuffer" });
    fs.writeFileSync(docxPath, bufferDocx);

    await execAsync(`libreoffice --headless --convert-to pdf "${docxPath}" --outdir "${tempDir}"`);

    const pdfBuffer = fs.readFileSync(pdfPath);

    fs.unlinkSync(docxPath);
    fs.unlinkSync(pdfPath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=apolice.pdf"); 
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error("Erro ao gerar apólice:", error);
    return res.status(500).json({ error: "Erro ao gerar apólice", details: error.message });
  }
}
