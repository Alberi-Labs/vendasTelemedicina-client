import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';

interface DadosCarteirinhaDependente {
  nome: string;
  cpf: string;
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
    const dados: DadosCarteirinhaDependente = req.body;

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

    // Posições específicas para a carteirinha de dependente (simplificada)
    const positions = {
      dependente: { x: 100, y: 460 }, // Marcação de dependente
      nome: { x: 100, y: 500 }, // Posição aproximada do campo nome
      cpf: { x: 100, y: 540 },  // Posição aproximada do campo CPF
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

    // Adicionar marcação de DEPENDENTE
    ctx.font = 'bold 16px Arial';
    drawText('DEPENDENTE', positions.dependente.x, positions.dependente.y);

    // Adicionar textos na carteirinha com texto branco
    if (dados.nome) {
      ctx.font = 'bold 20px Arial'; // Fonte maior para o nome
      drawText(dados.nome.toUpperCase(), positions.nome.x, positions.nome.y);
    }
    
    if (dados.cpf) {
      ctx.font = 'bold 18px Arial'; // Fonte menor para CPF
      drawText(`CPF: ${dados.cpf}`, positions.cpf.x, positions.cpf.y);
    }

    // Converter para buffer
    const buffer = canvas.toBuffer('image/png');

    // Extrair primeiro nome para o arquivo
    const primeiroNome = dados.nome.split(' ')[0];
    const cpfLimpo = dados.cpf.replace(/[^\d]/g, ''); // Remove pontos e traços do CPF
    const nomeArquivo = `${primeiroNome}-${cpfLimpo}`;

    // Configurar headers para download forçado
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="carteirinha-dependente-${nomeArquivo}.png"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    // Enviar a imagem
    res.send(buffer);

  } catch (error) {
    console.error('Erro ao gerar carteirinha do dependente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
