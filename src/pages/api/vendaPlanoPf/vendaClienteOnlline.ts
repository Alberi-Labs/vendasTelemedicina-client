import { NextApiRequest, NextApiResponse } from "next";
import puppeteer, { Page } from "puppeteer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const {
    nomeCliente,
    email,
    cpf,
    celular,
    dataNascimento,
    cep,
    endereco,
    sexo,
    uf,
    cidade,
  } = req.body;

  const instituicao = "Fernando Card";
  const produto = "Plano Telemedicina Básico";

  try {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--window-size=1920,1080"
        ],
      });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto("https://saudeecor.i9.dev.br/white/login.php", { waitUntil: "networkidle2" });

    page.on('dialog', async (dialog) => {
      console.log(`Alerta detectado: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // Faz login fixo
    await page.type('input[name="usuario"]', '020.314.821-57');
    await page.type('input[name="senha"]', '102030');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    // Abre menu lateral
    await page.waitForSelector('a[data-widget="pushmenu"]', { visible: true });
    await page.click('a[data-widget="pushmenu"]');

    // Clica em "Compra online" e captura nova aba
    await page.waitForSelector('a.nav-link', { visible: true });
    const [newPage] = await Promise.all([
      new Promise<Page>((resolve) =>
        browser.once('targetcreated', async (target) => {
          const page = await target.page();
          if (page) {
            await page.bringToFront();
            resolve(page);
          }
        })
      ),
      page.evaluate(() => {
        const compraLink = Array.from(document.querySelectorAll('a.nav-link')).find(
          (el) => el.textContent?.trim() === "Compra online"
        );
        if (compraLink) (compraLink as HTMLElement).click();
      }),
    ]);

    await newPage.waitForSelector('form#formulario', { visible: true });

    // Preenche dados enviados pelo body
    await newPage.type('#nom_cliente', nomeCliente);
    await newPage.type('#dsc_email', email);
    await newPage.type('#num_cpf', cpf);
    await newPage.type('#num_celular', celular);
    await newPage.type('#dat_nascimento', dataNascimento);
    await newPage.type('#num_cep', cep);
    await newPage.type('#dsc_endereco', endereco);

    // Seleciona sexo e UF
    await newPage.select('#ind_sexo', sexo);
    await newPage.select('#ind_uf', uf);

    // Aguarda carregar cidades
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Seleciona cidade pelo nome
    await newPage.evaluate((cidade) => {
        const normalizeString = (str: string) =>
          str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
      
        const cidadeSelect = document.querySelector<HTMLSelectElement>('#ind_cidade');
        if (cidadeSelect) {
          const option = Array.from(cidadeSelect.options).find(opt => 
            normalizeString(opt.textContent || "") === normalizeString(cidade)
          );
          if (option) {
            cidadeSelect.value = option.value;
            cidadeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }, cidade);
      
    console.log("Formulário preenchido dinamicamente!");

    // Seleciona Instituição pelo nome
    await newPage.waitForSelector('#seq_instituicao', { visible: true });
    await newPage.evaluate((instituicao) => {
      const instituicaoSelect = document.querySelector<HTMLSelectElement>('#seq_instituicao');
      if (instituicaoSelect) {
        const option = Array.from(instituicaoSelect.options).find(opt =>
          opt.textContent?.trim() === instituicao
        );
        if (option) {
          instituicaoSelect.value = option.value;
          instituicaoSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }, instituicao);

    // Espera produtos carregarem
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Seleciona Produto pelo nome
    await newPage.waitForSelector('#seq_produto', { visible: true });
    await newPage.evaluate((produto) => {
      const produtoSelect = document.querySelector<HTMLSelectElement>('#seq_produto');
      if (produtoSelect) {
        const option = Array.from(produtoSelect.options).find(opt =>
          opt.textContent?.includes(produto)
        );
        if (option) {
          produtoSelect.value = option.value;
          produtoSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }, produto);

    // Aceita termos
    await newPage.waitForSelector('#termo_condicao', { visible: true });
    const isChecked = await newPage.$eval('#termo_condicao', (checkbox) => (checkbox as HTMLInputElement).checked);
    if (!isChecked) {
      await newPage.click('#termo_condicao');
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Clica no botão de pagamento
    await newPage.waitForSelector('#btn_pagamento:not([disabled])', { visible: true });
    await newPage.click('#btn_pagamento');

    // Aguarda o link de pagamento
    await newPage.waitForSelector('a[href*="asaas.com/i/"]', { timeout: 15000 });

    // Pega o link do pagamento
    const pagamentoLink = await newPage.$eval('a[href*="asaas.com/i/"]', (a) => (a as HTMLAnchorElement).href);

    console.log("Link de pagamento capturado:", pagamentoLink);

    await browser.close();

    return res.status(200).json({
      message: "Compra gerada com sucesso!",
      pagamentoLink: pagamentoLink,
    });

  } catch (error) {
    console.error("Erro ao executar Puppeteer:", error);
    return res.status(500).json({ error: "Erro ao executar integração" });
  }
}
