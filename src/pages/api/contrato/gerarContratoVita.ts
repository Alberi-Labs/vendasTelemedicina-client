import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { exec } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import { createCanvas, loadImage } from 'canvas';

const ImageModule = require('docxtemplater-image-module-free');
const execAsync = promisify(exec);

// Função para inserir imagem no template
const imageOpts = {
  getImage: function(tagValue: any, tagName: any) {
    if (typeof tagValue === 'string' && tagValue.startsWith('data:image')) {
      // Se for base64, converter para buffer
      const base64Data = tagValue.replace(/^data:image\/[a-z]+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    }
    return fs.readFileSync(tagValue);
  },
  getSize: function(img: any, tagValue: any, tagName: any) {
    // Tamanho da assinatura no documento
    return [200, 80]; // largura, altura em pontos
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const dados = req.body;
  const { assinaturaDigital } = dados; // Nova propriedade para a assinatura
  const tempId = uuidv4();
  const tempDir = path.join(process.cwd(), "tmp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const docxPath = path.join(tempDir, `${tempId}.docx`);
  const pdfPath = path.join(tempDir, `${tempId}.pdf`);
  const assinaturaTempPath = path.join(tempDir, `assinatura_${tempId}.png`);

  try {
    // Se houver assinatura digital, processar a imagem
    let assinaturaProcessada = null;
    if (assinaturaDigital) {
      // Remover o prefixo data:image/png;base64, se presente
      const base64Data = assinaturaDigital.replace(/^data:image\/png;base64,/, '');
      const assinaturaBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(assinaturaTempPath, assinaturaBuffer);
      
      // Criar um canvas para redimensionar a assinatura
      const assinaturaImg = await loadImage(assinaturaTempPath);
      const canvas = createCanvas(300, 100); // Tamanho padrão para assinatura
      const ctx = canvas.getContext('2d');
      
      // Fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 100);
      
      // Desenhar a assinatura redimensionada
      ctx.drawImage(assinaturaImg, 0, 0, 300, 100);
      
      // Salvar a assinatura processada
      const assinaturaProcessadaBuffer = canvas.toBuffer('image/png');
      fs.writeFileSync(assinaturaTempPath, assinaturaProcessadaBuffer);
      
      assinaturaProcessada = fs.readFileSync(assinaturaTempPath, 'base64');
    }

    const templatePath = path.join(process.cwd(), "templates", "modelo_contrato_vita.docx");
    const content = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [new ImageModule(imageOpts)]
    });

    // Adicionar a assinatura aos dados se ela existir
    const agora = new Date();
    const dadosComAssinatura = {
      ...dados,
      // Campos para data de Brasília na página 7
      diaAssinatura: assinaturaDigital ? agora.getDate().toString() : null,
      mesAssinatura: assinaturaDigital ? agora.toLocaleDateString("pt-BR", { month: "long" }) : null,
      anoAssinatura: assinaturaDigital ? agora.getFullYear().toString() : null,
      // Dados para o bloco de assinatura digital
      assinaturaDigital: assinaturaDigital ? true : false,
      imagemAssinatura: assinaturaDigital ? assinaturaTempPath : null, // Caminho do arquivo de imagem
      mensagemAssinatura: assinaturaDigital ? 
        `Assinado digitalmente por CPF: ${dados.cpf}, em ${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR")}` : null,
      // Campos legados (manter compatibilidade)
      paginaAssinatura: assinaturaDigital ? true : false,
      assinatura: assinaturaProcessada ? {
        data: assinaturaProcessada,
        size: [300, 100]
      } : null,
      dataAssinatura: assinaturaDigital ? agora.toLocaleDateString("pt-BR") : null,
      horaAssinatura: assinaturaDigital ? agora.toLocaleTimeString("pt-BR") : null,
      // Informações adicionais para a página de assinatura
      localAssinatura: "São Paulo, SP",
      textoAssinatura: "Documento assinado digitalmente conforme Lei nº 14.063/2020"
    };

    try {
      doc.render(dadosComAssinatura);
    } catch (error) {
      console.error("Erro ao processar template:", error);
      return res.status(500).json({ error: "Erro ao processar template do contrato" });
    }

    const bufferDocx = doc.getZip().generate({ type: "nodebuffer" });
    fs.writeFileSync(docxPath, bufferDocx);

    // Detectar sistema operacional e usar comando apropriado
    const isWindows = process.platform === 'win32';
    let convertCommand;
    
    if (isWindows) {
      // No Windows, usar soffice (se disponível) ou retornar o DOCX
      convertCommand = `soffice --headless --convert-to pdf "${docxPath}" --outdir "${tempDir}"`;
    } else {
      // No Linux/macOS usar libreoffice
      convertCommand = `libreoffice --headless --convert-to pdf "${docxPath}" --outdir "${tempDir}"`;
    }

    try {
      await execAsync(convertCommand);
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Limpar arquivos temporários
      fs.unlinkSync(docxPath);
      fs.unlinkSync(pdfPath);
      if (fs.existsSync(assinaturaTempPath)) {
        fs.unlinkSync(assinaturaTempPath);
      }

      const nomeArquivo = assinaturaDigital ? 
        `contrato_vita_assinado_${new Date().toISOString().split('T')[0]}.pdf` : 
        'contrato_vita.pdf';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
      res.send(pdfBuffer);
      
    } catch (conversionError) {
      
      // Se falhar a conversão, retornar o DOCX
      const docxBuffer = fs.readFileSync(docxPath);
      
      // Limpar arquivos temporários
      fs.unlinkSync(docxPath);
      if (fs.existsSync(assinaturaTempPath)) {
        fs.unlinkSync(assinaturaTempPath);
      }

      const nomeArquivo = assinaturaDigital ? 
        `contrato_vita_assinado_${new Date().toISOString().split('T')[0]}.docx` : 
        'contrato_vita.docx';

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
      res.send(docxBuffer);
    }

  } catch (error: any) {
    console.error("Erro ao gerar contrato Vita:", error);
    
    // Limpar arquivos temporários em caso de erro
    if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    if (fs.existsSync(assinaturaTempPath)) fs.unlinkSync(assinaturaTempPath);
    
    return res.status(500).json({ error: "Erro ao gerar contrato Vita", details: error.message });
  }
}
