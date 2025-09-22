import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  let body: any = null;
  try {
    const rawBody = await getRawBody(req);
    body = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).json({ error: 'Body inválido' });
  }

  switch (body.event) {

    case 'PAYMENT_RECEIVED':
      // Trate o evento de pagamento recebido
      // Exemplo: await receivePayment(body.payment);
      break;
    // ... outros eventos do Asaas
    default:
      console.log(`Evento não tratado: ${body.event}`);
  }

  res.json({ received: true });
}
