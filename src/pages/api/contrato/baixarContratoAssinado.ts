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
      // Campos para assinatura na página 7
      dataAssinaturaBrasilia: new Date(dataAssinatura).toLocaleDateString("pt-BR"),
      diaAssinatura: new Date(dataAssinatura).getDate().toString(),
      mesAssinatura: new Date(dataAssinatura).toLocaleDateString("pt-BR", { month: "long" }),
      anoAssinatura: new Date(dataAssinatura).getFullYear().toString(),
      // Dados para o bloco de assinatura digital
      assinaturaDigital: true, // Para mostrar o bloco
      imagemAssinatura: assinaturaDigital, // A imagem em base64
      mensagemAssinatura: `Assinado digitalmente por CPF: ${contrato.cpf}, em ${new Date(dataAssinatura).toLocaleDateString("pt-BR")} às ${new Date(dataAssinatura).toLocaleTimeString("pt-BR")}`
    };

    // Caminho do template
    const templatePath = path.join(process.cwd(), "templates", "modelo_contrato_vita.docx");
    
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: "Template do contrato não encontrado" });
    }

    // Ler o template
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Preencher o template com os dados (incluindo os novos campos de data)
    doc.setData(dadosContrato);

    try {
      doc.render();
    } catch (error) {
      console.error("Erro ao processar template:", error);
      return res.status(500).json({ error: "Erro ao processar template do contrato" });
    }

    const buf = doc.getZip().generate({ type: "nodebuffer" });

    // Criar arquivo temporário único
    const timestamp = Date.now();
    const tempDir = path.join(process.cwd(), "tmp");
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempDocxPath = path.join(tempDir, `${timestamp}.docx`);
    const tempPdfPath = path.join(tempDir, `${timestamp}.pdf`);

    fs.writeFileSync(tempDocxPath, buf);

    // Adicionar a assinatura ao PDF
    const assinaturaPath = path.join(tempDir, `assinatura_${timestamp}.png`);
    
    // Salvar a imagem da assinatura
    const assinaturaBuffer = Buffer.from(assinaturaDigital.replace(/^data:image\/png;base64,/, ""), 'base64');
    fs.writeFileSync(assinaturaPath, assinaturaBuffer);

    // Detectar sistema operacional e converter para PDF
    const isWindows = process.platform === 'win32';
    let convertCommands: string[] = [];
    
    if (isWindows) {
      convertCommands = [
        `"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf "${tempDocxPath}" --outdir "${tempDir}"`,
        `"C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf "${tempDocxPath}" --outdir "${tempDir}"`,
        `soffice --headless --convert-to pdf "${tempDocxPath}" --outdir "${tempDir}"`,
        `libreoffice --headless --convert-to pdf "${tempDocxPath}" --outdir "${tempDir}"`
      ];
    } else {
      convertCommands = [`libreoffice --headless --convert-to pdf "${tempDocxPath}" --outdir "${tempDir}"`];
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
      const pdfBuffer = fs.readFileSync(tempPdfPath);
      
      // Limpar arquivos temporários
      fs.unlinkSync(tempDocxPath);
      fs.unlinkSync(tempPdfPath);
      if (fs.existsSync(assinaturaPath)) {
        fs.unlinkSync(assinaturaPath);
      }

      const nomeArquivo = `contrato_vita_assinado_${new Date(dataAssinatura).toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
      res.send(pdfBuffer);
      
    } else {
      // Se falhar a conversão, retornar o DOCX
      const docxBuffer = fs.readFileSync(tempDocxPath);
      
      // Limpar arquivos temporários
      fs.unlinkSync(tempDocxPath);
      if (fs.existsSync(assinaturaPath)) {
        fs.unlinkSync(assinaturaPath);
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
