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
    dados.empresa = 'saude e cor'
    const isVita = dados.empresa?.toLowerCase().includes('vita');
    const templatePath = isVita 
      ? path.join(process.cwd(), 'public', 'Final-Vitta-Card.png')
      : path.join(process.cwd(), 'templates', 'carteirinha-vita.jpeg'); // Usando vita.png como template para não-Vita

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

    // Posições específicas baseadas na imagem anexada com quadro azul
    // As posições são ajustadas para o template carteirinha-vita.png
    const positions = isVita ? {
      // Posições para template Vita (Final-Vitta-Card.png)
      nome: { x: 100, y: 500 },
      cpf: { x: 100, y: 540 },
      vigencia: { x: 1364, y: 125 },
      apolice: { x: 800, y: 500 },
      operacao: { x: 800, y: 530 },
      certificado: { x: 800, y: 560 },
    } : {
      // Posições para template não-Vita (carteirinha-vita.png) - baseado na área azul da imagem
      nome: { x: 850, y: 270 }, // Área do quadro azul superior
      cpf: { x: 850, y: 300 },  // Logo abaixo do nome
      vigencia: { x: 850, y: 330 }, // Terceira linha no quadro azul
      apolice: { x: 1350, y: 270 }, // Quarta linha
      operacao: { x: 1350, y: 300 }, // Quinta linha
      certificado: { x: 1350, y: 330 }, // Sexta linha
    };

    const drawText = (text: string, x: number, y: number, maxWidth: number = 400) => {
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

    // Adicionar textos na carteirinha
    if (dados.nome) {
      ctx.font = isVita ? 'bold 20px Arial' : 'bold 18px Arial'; // Fonte ajustada por template
      drawText(dados.nome.toUpperCase(), positions.nome.x, positions.nome.y);
    }
    
    ctx.font = isVita ? 'bold 18px Arial' : 'bold 16px Arial'; // Fonte menor para os outros campos
    
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
