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

  const docxPath = path.join(tempDir, `visualizar_${tempId}.docx`);
  const pdfPath = path.join(tempDir, `visualizar_${tempId}.pdf`);

  try {
    const templatePath = path.join(process.cwd(), "templates", "modelo_contrato_vita.docx");
    const content = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Dados sem assinatura para visualização
    const dadosVisualizacao = {
      ...dados,
      assinatura: null,
      dataAssinatura: null
    };

    doc.render(dadosVisualizacao);

    const bufferDocx = doc.getZip().generate({ type: "nodebuffer" });
    fs.writeFileSync(docxPath, bufferDocx);

    // Detectar sistema operacional e usar comando apropriado
    const isWindows = process.platform === 'win32';
    let convertCommands: string[] = [];
    
    if (isWindows) {
      // Tentar diferentes caminhos do LibreOffice no Windows
      convertCommands = [
        `"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf "${docxPath}" --outdir "${tempDir}"`,
        `"C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf "${docxPath}" --outdir "${tempDir}"`,
        `soffice --headless --convert-to pdf "${docxPath}" --outdir "${tempDir}"`,
        `libreoffice --headless --convert-to pdf "${docxPath}" --outdir "${tempDir}"`
      ];
    } else {
      convertCommands = [`libreoffice --headless --convert-to pdf "${docxPath}" --outdir "${tempDir}"`];
    }

    let conversionSuccess = false;
    let lastError: any = null;

    // Tentar cada comando até um funcionar
    for (const command of convertCommands) {
      try {
        await execAsync(command);
        conversionSuccess = true;
        break;
      } catch (error: any) {
        lastError = error;
        console.log(`Comando falhou: ${command}`, error.message);
      }
    }

    if (conversionSuccess) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Limpar arquivos temporários
      fs.unlinkSync(docxPath);
      fs.unlinkSync(pdfPath);

      // Retornar PDF como base64 para exibição no iframe
      const pdfBase64 = pdfBuffer.toString('base64');
      res.status(200).json({ 
        success: true, 
        contractData: `data:application/pdf;base64,${pdfBase64}`,
        format: 'pdf'
      });
      
    } else {
      console.log('Erro na conversão para PDF com todos os comandos:', lastError);
      
      // Se falhar a conversão, retornar mensagem informativa
      fs.unlinkSync(docxPath);
      
      res.status(200).json({ 
        success: true, 
        contractData: null,
        format: 'docx',
        message: 'Visualização em PDF não disponível. LibreOffice pode não estar instalado ou acessível. Use "Baixar sem Assinar" para obter o documento.'
      });
    }

  } catch (error: any) {
    console.error("Erro ao visualizar contrato Vita:", error);
    
    // Limpar arquivos temporários em caso de erro
    if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    
    return res.status(500).json({ error: "Erro ao visualizar contrato Vita", details: error.message });
  }
}
