import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
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

  const { cpf_usuario } = req.body;

  if (!cpf_usuario) {
    return res.status(400).json({ error: "CPF do usuário é obrigatório" });
  }

  try {
    // Buscar o contrato assinado no banco de dados
    const [contratoRows]: any = await pool.execute(
      `SELECT ca.*, c.nome, c.cpf, c.email, c.telefone, c.data_nascimento, c.cidade, c.uf 
       FROM tb_contratos_assinados ca 
       JOIN tb_clientes c ON ca.id_usuario = c.idCliente 
       WHERE c.cpf = ? 
       ORDER BY ca.data_assinatura DESC 
       LIMIT 1`,
      [cpf_usuario.replace(/\D/g, "")]
    );

    if (contratoRows.length === 0) {
      return res.status(404).json({ error: "Contrato assinado não encontrado" });
    }

    const contrato = contratoRows[0];
    const assinaturaDigital = contrato.assinatura_digital;
    const dataAssinatura = contrato.data_assinatura;
    
    // Recriar os dados do contrato no formato original
    const dadosContrato = {
      nomeseg: contrato.nome,
      cpf: contrato.cpf,
      datanascimento: contrato.dt_nascimento ? new Date(contrato.dt_nascimento).toLocaleDateString("pt-BR") : "",
      endereco: `${contrato.cidade || ""}${contrato.cidade && contrato.uf ? ", " : ""}${contrato.uf || ""}`.trim() || "—",
    };

    // Gerar o contrato com a assinatura
    const tempId = uuidv4();
    const tempDir = path.join(process.cwd(), "tmp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const docxPath = path.join(tempDir, `contrato_assinado_${tempId}.docx`);
    const pdfPath = path.join(tempDir, `contrato_assinado_${tempId}.pdf`);
    const assinaturaTempPath = path.join(tempDir, `assinatura_${tempId}.png`);

    // Processar a assinatura
    let assinaturaProcessada = null;
    if (assinaturaDigital && assinaturaDigital.startsWith('data:image/png;base64,')) {
      const base64Data = assinaturaDigital.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(assinaturaTempPath, base64Data, 'base64');
      assinaturaProcessada = fs.readFileSync(assinaturaTempPath);
    }

    // Carregar template
    const templatePath = path.join(process.cwd(), "templates", "modelo_contrato_vita.docx");
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Dados do contrato com assinatura
    const dadosComAssinatura = {
      ...dadosContrato,
      paginaAssinatura: true,
      assinatura: assinaturaProcessada ? {
        data: assinaturaProcessada,
        size: [300, 100]
      } : null,
      dataAssinatura: new Date(dataAssinatura).toLocaleDateString("pt-BR"),
      horaAssinatura: new Date(dataAssinatura).toLocaleTimeString("pt-BR"),
      localAssinatura: "São Paulo, SP",
      textoAssinatura: "Documento assinado digitalmente conforme Lei nº 14.063/2020"
    };

    doc.render(dadosComAssinatura);

    const bufferDocx = doc.getZip().generate({ type: "nodebuffer" });
    fs.writeFileSync(docxPath, bufferDocx);

    // Detectar sistema operacional e converter para PDF
    const isWindows = process.platform === 'win32';
    let convertCommands: string[] = [];
    
    if (isWindows) {
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
    for (const command of convertCommands) {
      try {
        await execAsync(command);
        conversionSuccess = true;
        break;
      } catch (error: any) {
        console.log(`Comando falhou: ${command}`, error.message);
      }
    }

    if (conversionSuccess) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Limpar arquivos temporários
      fs.unlinkSync(docxPath);
      fs.unlinkSync(pdfPath);
      if (fs.existsSync(assinaturaTempPath)) {
        fs.unlinkSync(assinaturaTempPath);
      }

      const nomeArquivo = `contrato_vita_assinado_${new Date(dataAssinatura).toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
      res.send(pdfBuffer);
      
    } else {
      // Se falhar a conversão, retornar o DOCX
      const docxBuffer = fs.readFileSync(docxPath);
      
      // Limpar arquivos temporários
      fs.unlinkSync(docxPath);
      if (fs.existsSync(assinaturaTempPath)) {
        fs.unlinkSync(assinaturaTempPath);
      }

      const nomeArquivo = `contrato_vita_assinado_${new Date(dataAssinatura).toISOString().split('T')[0]}.docx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
      res.send(docxBuffer);
    }

  } catch (error: any) {
    console.error("Erro ao baixar contrato assinado:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
