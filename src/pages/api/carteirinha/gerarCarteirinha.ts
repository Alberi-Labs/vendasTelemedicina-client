import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';

interface DadosCarteirinha {
  nome: string;
  cpf: string;
  vigenciaInicio: string;
  vigenciaFinal: string;
  apolice: string;
  operacao: string;
  certificado: string;
  empresa: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const dados: DadosCarteirinha = req.body;

    // Criar canvas com as dimensões da carteirinha
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');
    // Determinar qual template usar baseado na empresa
    const isVita = dados.empresa?.toLowerCase().includes('vita');
    const templatePath = isVita 
      ? path.join(process.cwd(), 'public', 'Final-Vitta-Card.png')
      : path.join(process.cwd(), 'public', 'default.jpg');

    // Carregar a imagem de fundo
    const backgroundImage = await loadImage(templatePath);
    
    // Ajustar canvas para o tamanho da imagem
    canvas.width = backgroundImage.width;
    canvas.height = backgroundImage.height;
    ctx.drawImage(backgroundImage, 0, 0);

    // Configurar fonte para melhor legibilidade
    ctx.fillStyle = '#FFFFFF'; // Texto branco para contraste no fundo azul
    ctx.font = 'bold 18px Arial';
    ctx.textBaseline = 'top';

    // Posições específicas para a carteirinha Vita baseadas na imagem
    // A carteirinha tem campos específicos que precisam ser preenchidos
    const positions = {
      nome: { x: 100, y: 500 }, // Posição aproximada do campo nome
      cpf: { x: 100, y: 540 },  // Posição aproximada do campo CPF
      vigencia: { x: 1364, y: 125 }, // Posição aproximada da vigência
      apolice: { x: 800, y: 500 }, // Posição do número da apólice
      operacao: { x: 800, y: 530 }, // Posição da operação (abaixo da apólice)
      certificado: { x: 800, y: 560 }, // Posição do certificado (ao lado da operação)
    };

    // Função para quebrar texto se for muito longo
    const drawText = (text: string, x: number, y: number, maxWidth: number = 400) => {
      ctx.fillStyle = '#FFFFFF'; // Garantir que o texto seja branco
      const words = text.split(' ');
      let line = '';
      let lineY = y;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line, x, lineY);
          line = words[i] + ' ';
          lineY += 25; // Aumentar espaçamento entre linhas
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, lineY);
    };

    // Adicionar textos na carteirinha com texto branco
    if (dados.nome) {
      ctx.font = 'bold 20px Arial'; // Fonte maior para o nome
      drawText(dados.nome.toUpperCase(), positions.nome.x, positions.nome.y);
    }
    
    ctx.font = 'bold 18px Arial'; // Fonte menor para os outros campos
    
    if (dados.cpf) {
      drawText(`CPF: ${dados.cpf}`, positions.cpf.x, positions.cpf.y);
    }
    
    if (dados.vigenciaInicio && dados.vigenciaFinal) {
      drawText(`Vigência: ${dados.vigenciaInicio} - ${dados.vigenciaFinal}`, positions.vigencia.x, positions.vigencia.y);
    }
    
    if (dados.apolice && dados.apolice !== '—') {
      drawText(`Apólice: ${dados.apolice}`, positions.apolice.x, positions.apolice.y);
    }

    if (dados.certificado && dados.certificado !== '—') {
      drawText(`Certificado: ${dados.certificado}`, positions.certificado.x, positions.certificado.y);
    }
    
    if (dados.operacao && dados.operacao !== '—') {
      drawText(`Operação: ${dados.operacao}`, positions.operacao.x, positions.operacao.y);
    }
    
    


    // Converter para buffer
    const buffer = canvas.toBuffer('image/png');

    // Extrair primeiro nome para o arquivo
    const primeiroNome = dados.nome.split(' ')[0];
    const cpfLimpo = dados.cpf.replace(/[^\d]/g, ''); // Remove pontos e traços do CPF
    const nomeArquivo = `${primeiroNome}-${cpfLimpo}`;

    // Configurar headers para download forçado
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="carteirinha-${nomeArquivo}.png"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    // Enviar a imagem
    res.send(buffer);

  } catch (error) {
    console.error('Erro ao gerar carteirinha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
