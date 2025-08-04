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
      : path.join(process.cwd(), 'templates', 'carteirinha-vita.jpeg');

    // Carregar a imagem de fundo
    const backgroundImage = await loadImage(templatePath);
    
    // Ajustar canvas para o tamanho da imagem
    canvas.width = backgroundImage.width;
    canvas.height = backgroundImage.height;
    ctx.drawImage(backgroundImage, 0, 0);

    // Configurar fonte para melhor legibilidade
    ctx.fillStyle = '#000000'; // Texto preto para contraste no fundo da carteirinha
    ctx.font = 'bold 16px Arial';
    ctx.textBaseline = 'top';

    // Posições específicas para a carteirinha de dependente baseadas no template
    const positions = isVita ? {
      // Posições para template Vita (Final-Vitta-Card.png)
      dependente: { x: 100, y: 460 },
      nome: { x: 100, y: 500 },
      cpf: { x: 100, y: 540 },
    } : {
      // Posições para template não-Vita (carteirinha-vita.jpeg) - baseado na área azul da imagem
      dependente: { x: 850, y: 240 }, // Marcação de dependente
      nome: { x: 850, y: 270 }, // Área do quadro azul superior
      cpf: { x: 850, y: 300 },  // Logo abaixo do nome
    };

    // Função para quebrar texto se for muito longo
    const drawText = (text: string, x: number, y: number, maxWidth: number = 400) => {
      // Definir cor do texto baseado no template
      ctx.fillStyle = '#FFFFFF'; // Branco para Vita, preto para outros
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
    ctx.font = isVita ? 'bold 16px Arial' : 'bold 14px Arial';
    drawText('DEPENDENTE', positions.dependente.x, positions.dependente.y);

    // Adicionar textos na carteirinha
    if (dados.nome) {
      ctx.font = isVita ? 'bold 20px Arial' : 'bold 18px Arial'; // Fonte ajustada por template
      drawText(dados.nome.toUpperCase(), positions.nome.x, positions.nome.y);
    }
    
    if (dados.cpf) {
      ctx.font = isVita ? 'bold 18px Arial' : 'bold 16px Arial'; // Fonte menor para CPF
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
