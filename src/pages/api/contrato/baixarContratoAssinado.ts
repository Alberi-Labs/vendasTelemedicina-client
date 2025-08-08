import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { exec } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

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

    console.log("Query executada, linhas encontradas:", contratoRows.length);
    if (contratoRows.length > 0) {
      console.log("Primeiro contrato:", {
        id: contratoRows[0].id,
        nome: contratoRows[0].nome,
        cpf: contratoRows[0].cpf,
        dataAssinatura: contratoRows[0].data_assinatura,
        temAssinatura: !!contratoRows[0].assinatura_digital
      });
    }

    if (contratoRows.length === 0) {
      return res.status(404).json({ error: "Contrato assinado não encontrado" });
    }

    const contrato = contratoRows[0];
    const assinaturaDigital = contrato.assinatura_digital;
    const dataAssinatura = contrato.data_assinatura;

    // Buscar dados completos do usuário na API SaudeECor para obter endereço
    let dadosUsuarioCompletos = null;
    try {
      const responseBuscarDados = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/clienteSaudeecor/buscarDados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpf_usuario }),
      });

      if (responseBuscarDados.ok) {
        const userData = await responseBuscarDados.json();
        if (Array.isArray(userData) && userData.length > 0) {
          dadosUsuarioCompletos = userData[0];
          console.log("Dados do usuário da API:", {
            nome: dadosUsuarioCompletos.nom_cliente,
            endereco: dadosUsuarioCompletos.dsc_endereco_completo,
            cidade: dadosUsuarioCompletos.dsc_cidade,
            uf: dadosUsuarioCompletos.dsc_uf
          });
        }
      }
    } catch (error) {
      console.log("Erro ao buscar dados da API SaudeECor:", error);
      // Continua com os dados do banco se falhar a API
    }
    
    console.log("Dados do contrato:", {
      nome: contrato.nome,
      cpf: contrato.cpf,
      temAssinatura: !!assinaturaDigital,
      tamanhoAssinatura: assinaturaDigital ? assinaturaDigital.length : 0
    });
    
    // Criar arquivo temporário único ANTES de definir os dados
    const timestamp = Date.now();
    const tempDir = path.join(process.cwd(), "tmp");
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    console.log("Diretório temporário:", tempDir);

    // Verificar se há assinatura digital
    if (!assinaturaDigital) {
      return res.status(400).json({ error: "Assinatura digital não encontrada no contrato" });
    }

    // Salvar a imagem da assinatura
    const assinaturaPath = path.join(tempDir, `assinatura_${timestamp}.png`);
    console.log("Caminho da assinatura:", assinaturaPath);
    
    try {
      const assinaturaBuffer = Buffer.from(assinaturaDigital.replace(/^data:image\/png;base64,/, ""), 'base64');
      console.log("Tamanho do buffer da assinatura:", assinaturaBuffer.length);
      
      fs.writeFileSync(assinaturaPath, assinaturaBuffer);
      console.log("Arquivo de assinatura criado com sucesso");
      
      // Verificar se o arquivo foi realmente criado
      if (fs.existsSync(assinaturaPath)) {
        console.log("Arquivo verificado - existe:", fs.statSync(assinaturaPath).size, "bytes");
      } else {
        console.log("Erro: arquivo não foi criado");
      }
    } catch (error) {
      console.error("Erro ao criar arquivo de assinatura:", error);
      return res.status(500).json({ error: "Erro ao processar assinatura digital" });
    }
    
    // Recriar os dados do contrato no formato original
    const dadosContrato = {
      nomeseg: contrato.nome,
      cpf: contrato.cpf,
      datanascimento: contrato.dt_nascimento ? new Date(contrato.dt_nascimento).toLocaleDateString("pt-BR") : "",
      endereco: (() => {
        // Priorizar dados da API SaudeECor se disponíveis
        if (dadosUsuarioCompletos) {
          if (dadosUsuarioCompletos.dsc_endereco_completo) {
            return dadosUsuarioCompletos.dsc_endereco_completo;
          }
          // Se não tem endereço completo, construir com cidade e UF da API
          const enderecoParts = [];
          if (dadosUsuarioCompletos.dsc_cidade) enderecoParts.push(dadosUsuarioCompletos.dsc_cidade);
          if (dadosUsuarioCompletos.dsc_uf) enderecoParts.push(dadosUsuarioCompletos.dsc_uf);
          return enderecoParts.length > 0 ? enderecoParts.join(", ") : "";
        }
        
        // Fallback: usar dados do banco se API falhar
        const enderecoParts = [];
        if (contrato.cidade) enderecoParts.push(contrato.cidade);
        if (contrato.uf) enderecoParts.push(contrato.uf);
        return enderecoParts.length > 0 ? enderecoParts.join(", ") : "";
      })(),
      // Campos para assinatura na página 7 - sempre mostrar as datas
      dataAssinaturaBrasilia: new Date(dataAssinatura).toLocaleDateString("pt-BR"),
      diaAssinatura: new Date(dataAssinatura).getDate().toString(),
      mesAssinatura: new Date(dataAssinatura).toLocaleDateString("pt-BR", { month: "long" }),
      anoAssinatura: new Date(dataAssinatura).getFullYear().toString(),
      // Dados para o bloco de assinatura digital - garantir que não seja undefined
      assinaturaDigital: !!assinaturaDigital, // true se houver assinatura
      imagemAssinatura: assinaturaDigital ? assinaturaPath : "", // Para campo {{%imagemAssinatura}}
      assinaturaImagem: assinaturaDigital ? assinaturaPath : "", // Para campo {{%assinaturaImagem}}
      mensagemAssinatura: assinaturaDigital ? 
        `Assinado digitalmente por CPF: ${contrato.cpf}, em ${new Date(dataAssinatura).toLocaleDateString("pt-BR")} às ${new Date(dataAssinatura).toLocaleTimeString("pt-BR")}` : "",
      // Campos legados também com valores seguros
      dataAssinatura: new Date(dataAssinatura).toLocaleDateString("pt-BR"),
      horaAssinatura: new Date(dataAssinatura).toLocaleTimeString("pt-BR")
    };

    console.log("Dados do contrato para template:", {
      nome: dadosContrato.nomeseg,
      cpf: dadosContrato.cpf,
      endereco: dadosContrato.endereco,
      enderecoFonte: dadosUsuarioCompletos ? "API SaudeECor" : "Banco de dados",
      imagemAssinatura: `${assinaturaPath} (existe: ${fs.existsSync(assinaturaPath)})`
    });

    // Caminho do template
    const templatePath = path.join(process.cwd(), "templates", "modelo_contrato_vita.docx");
    
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: "Template do contrato não encontrado" });
    }

    console.log("Template encontrado:", templatePath);

    // Ler o template
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [new ImageModule(imageOpts)]
    });

    console.log("Docxtemplater configurado com ImageModule");

    // Preencher o template com os dados (incluindo os novos campos de data)
    try {
      doc.render(dadosContrato);
    } catch (error) {
      console.error("Erro ao processar template:", error);
      return res.status(500).json({ error: "Erro ao processar template do contrato" });
    }

    const buf = doc.getZip().generate({ type: "nodebuffer" });

    const tempDocxPath = path.join(tempDir, `${timestamp}.docx`);
    const tempPdfPath = path.join(tempDir, `${timestamp}.pdf`);

    fs.writeFileSync(tempDocxPath, buf);

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
      
      console.log("Conversão PDF bem-sucedida");
      console.log("Arquivos antes da limpeza:", {
        docx: fs.existsSync(tempDocxPath),
        pdf: fs.existsSync(tempPdfPath),
        assinatura: fs.existsSync(assinaturaPath)
      });
      
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
      
      console.log("Conversão falhou, retornando DOCX");
      console.log("Arquivos antes da limpeza:", {
        docx: fs.existsSync(tempDocxPath),
        assinatura: fs.existsSync(assinaturaPath)
      });
      
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
