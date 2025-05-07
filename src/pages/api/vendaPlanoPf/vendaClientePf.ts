import pool from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import puppeteer, { ElementHandle } from "puppeteer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { nomeCliente, formaDePagamento, idUsuario } = req.body;
  console.log("🔸 Requisição recebida:", req.body);

  try {
    const instituicao = "Fernando Card";
    console.log("🔸 Iniciando Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      slowMo: 10,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log("🔸 Acessando página de login...");
    await page.goto("https://saudeecor.i9.dev.br/white/login.php", { waitUntil: "networkidle2" });

    console.log("🔸 Preenchendo login...");
    await page.type('input[name="usuario"]', '020.314.821-57');
    await page.type('input[name="senha"]', '102030');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);
    console.log("✅ Login realizado!");

    console.log("🔸 Esperando botão de pesquisa...");
    await page.waitForSelector("#btn_pesquisar", { visible: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const button = await page.$("#btn_pesquisar");
    if (button) {
      const boundingBox = await button.boundingBox();
      if (boundingBox) {
        await page.mouse.click(
          boundingBox.x + boundingBox.width / 2,
          boundingBox.y + boundingBox.height / 2
        );
        console.log("✅ Botão de pesquisar clicado.");
      }
    } else {
      console.error("❌ Botão #btn_pesquisar não encontrado.");
    }
    console.log("🔸 Clicando no botão de menu (barras)...");

    await page.screenshot({ path: '/tmp/pagina_atual0.png', fullPage: true });

    await page.waitForSelector('a[data-widget="pushmenu"]', { visible: true });
    await page.click('a[data-widget="pushmenu"]');
    console.log("✅ Menu (barras) clicado.");

    console.log("🔸 Clicando no botão de fullscreen...");
    await page.waitForSelector('a[data-widget="fullscreen"]', { visible: true });
    await page.click('a[data-widget="fullscreen"]');
    console.log("✅ Botão de fullscreen clicado.");
    await page.screenshot({ path: '/tmp/pagina_atual01.png', fullPage: true });

    console.log("🔸 Clicando em cliente...");
    await page.waitForSelector('#divClienteVinculo .btn-primary', { visible: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const clienteButton = await page.$('#divClienteVinculo .btn-primary');
    if (clienteButton) {
      const boundingBox = await clienteButton.boundingBox();
      if (boundingBox) {
        await page.mouse.click(
          boundingBox.x + boundingBox.width / 2,
          boundingBox.y + boundingBox.height / 2
        );
        console.log("✅ Botão 'Escolher Cliente' clicado.");
      }
    } else {
      console.error("❌ Botão 'Escolher Cliente' não encontrado.");
    }

    console.log("🔸 Selecionando instituição do cliente...");
    await page.evaluate((instituicao) => {
      const options = Array.from(document.querySelectorAll('#seq_instituicao_cli option'));
      const optionToSelect = options.find(option => option.textContent?.trim() === instituicao);
      if (optionToSelect) {
        (optionToSelect as HTMLOptionElement).selected = true;
        const selectElement = document.querySelector('#seq_instituicao_cli');
        if (selectElement) {
          selectElement.dispatchEvent(new Event('change'));
        }
      } else {
        console.error(`Instituição "${instituicao}" não encontrada.`);
      }
    }, instituicao);

    console.log("🔸 Preenchendo nome do cliente...");
    await page.waitForSelector('#nom_cliente', { visible: true });
    await page.type('#nom_cliente', nomeCliente);
    await page.click('button[onclick="getCliente();"]');

    console.log("🔸 Selecionando cliente da tabela...");
    await page.waitForSelector('.table .btn-primary', { visible: true });
    await page.click('.table .btn-primary');

    console.log("🔸 Clicando em 'Escolher Produto'...");
    await page.waitForSelector('.timeline-footer .btn-warning', { visible: true });
    const escolherProduto = await page.$('.timeline-footer .btn-warning');
    if (escolherProduto) {
      await page.evaluate((element) => (element as HTMLElement).click(), escolherProduto);
      console.log("✅ Produto selecionado.");
    } else {
      console.error("❌ Botão para escolher produto não encontrado.");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await page.screenshot({ path: '/tmp/pagina_atual.png', fullPage: true });

    console.log("🔸 Procurando e clicando no botão do 'Plano Telemedicina Básico'...");
    const rows = await page.$$('#divHtmlProduto table tbody tr');
    let produtoClicado = false;

    for (const row of rows) {
      const nomeColuna = await row.$eval('td:first-child', el => el.textContent?.trim());
      if (nomeColuna === "Plano Telemedicina Básico") {
        const botao = await row.$('button.btn-primary.btn-sm');
        if (botao) {
          const boundingBox = await botao.boundingBox();
          if (boundingBox) {
            await page.mouse.click(
              boundingBox.x + boundingBox.width / 2,
              boundingBox.y + boundingBox.height / 2
            );
            produtoClicado = true;
            console.log("✅ Produto 'Plano Telemedicina Básico' vinculado com sucesso.");
            break;
          }
        }
      }
    }

    if (!produtoClicado) {
      console.error("❌ Produto 'Plano Telemedicina Básico' não encontrado ou botão não clicável.");
    }


    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("🔸 Rolando até forma de pagamento...");
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForSelector('#divPagamentoVinculoHtm .btn', { visible: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const pagamentoButton = await page.$('#divPagamentoVinculoHtm .btn');
    if (pagamentoButton) {
      const boundingBox = await pagamentoButton.boundingBox();
      if (boundingBox) {
        await page.mouse.click(
          boundingBox.x + boundingBox.width / 2,
          boundingBox.y + boundingBox.height / 2
        );
        console.log("✅ Botão 'Forma de pagamento' clicado.");
      }
    } else {
      console.error("❌ Botão 'Forma de pagamento' não encontrado.");
    }
    await new Promise(resolve => setTimeout(resolve, 4000));
    await page.screenshot({ path: '/tmp/pagina_atual2.png', fullPage: true });

    console.log(`🔸 Selecionando forma de pagamento: ${formaDePagamento}`);
    await page.evaluate((formaDePagamento) => {
      const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const normalizedFormaDePagamento = normalize(formaDePagamento);
      const inputs = Array.from(document.querySelectorAll('input[name="tip_pagamento"]'));
      const inputToSelect = inputs.find(input =>
        normalize((input as HTMLInputElement).value) === normalizedFormaDePagamento
      );
      if (inputToSelect) {
        (inputToSelect as HTMLElement).click();
      } else {
        console.error(`Forma de pagamento "${formaDePagamento}" não encontrada.`);
      }
    }, formaDePagamento);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const html = await page.content();
    console.log("📄 Texto visível da página:");
    console.log(html);
    console.log("🔸 Iniciando processo de pagamento...");
    await page.waitForSelector('#btn_iniciar_processo button', { visible: true });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.evaluate(() => {
      const btn = document.querySelector('#btn_iniciar_processo button') as HTMLElement;
      if (btn) btn.click();
    });

    await page.waitForSelector('p.text-muted.well a', { visible: true });
    const paymentLink = await page.evaluate(() => {
      const linkElement = document.querySelector('p.text-muted.well a');
      if (linkElement) {
        const onclickValue = linkElement.getAttribute('onclick');
        const match = onclickValue && onclickValue.match(/wiOpen\('([^']+)'/);
        return match ? match[1] : null;
      }
      return null;
    });

    if (paymentLink) {
      console.log("✅ Link de pagamento encontrado:", paymentLink);
      return res.status(200).json({
        message: "Integração concluída com sucesso!",
        paymentLink
      });
    } else {
      console.error("❌ Link de pagamento não encontrado.");
      return res.status(500).json({
        error: "Link de pagamento não encontrado."
      });
    }

  } catch (error) {
    console.error("❌ Erro ao executar Puppeteer:", error);
    return res.status(500).json({ error: "Erro ao executar integração" });
  }
}
