import { NextApiRequest, NextApiResponse } from "next";
import puppeteer, { ElementHandle } from "puppeteer";

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
    casa, 
    sexo, 
    uf, 
    cidade, 
    formaDePagamento, 
    instituicao, 
    idUsuario 
  } = req.body;
  console.log("🔸 Requisição recebida:", req.body);

  try {
    console.log("🔸 Iniciando Puppeteer...");
    const browser = await puppeteer.launch({
      headless: false,
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

    console.log("🔸 Clicando na isenção de pagamento (Sim)...");
    await page.waitForSelector('input[name="tip_venda"][value="S"]', { visible: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.click('input[name="tip_venda"][value="S"]');
    console.log("✅ Isenção de pagamento selecionada.");



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
    console.log("🔸 Clicando no botão Proposta...");
    await page.waitForSelector('#divBtnPropostaIsento .btn', { visible: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.click('#divBtnPropostaIsento .btn');
    console.log("✅ Botão Proposta clicado.");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("🔸 Esperando o modal abrir...");
    await page.waitForSelector('.modal.show, .modal.in', { visible: true });

    // seleciona o modal visível
    const modalHandle = await page.$('.modal.show, .modal.in');

    // clica no botão close *dentro* do modal
    console.log("🔸 Clicando no botão Close (X) dentro do modal...");
    if (modalHandle) {
      await modalHandle.$eval('button.close[aria-label="Close"]', btn => btn.click());
    } else {
      console.error("❌ Modal não encontrado para fechar.");
    }

    // espera o modal sumir
    await page.waitForSelector('.modal.show, .modal.in', { hidden: true });
    console.log("✅ Modal fechado.");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("🔸 Clicando no botão 'Próximo passo'...");
    await page.waitForSelector('#divBtnProximoPasso a', { visible: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.click('#divBtnProximoPasso a');
    console.log("✅ Botão 'Próximo passo' clicado.");

    console.log("🔸 Procurando botão 'Enviar proposta'...");

    const selector = '.timeline-footer a.btn.bg-purple[data-toggle="modal"][data-target="#modal-lg-contr"]';
    await page.waitForSelector(selector, { visible: true, timeout: 10000 });

    const btn = await page.$(selector);
    if (!btn) throw new Error("Botão 'Enviar proposta' não encontrado.");

    await page.evaluate((el) => {
      el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    }, btn);

    await page.evaluate((el) => el.click(), btn);

    console.log("🔸 Esperando modal de retorno da proposta...");
    await page.waitForSelector('#modal-lg-contr.show, #modal-lg-contr.in', { visible: true });

    await browser.close();
    return res.status(200).json({
      sucesso: true,
    });

  } catch (error) {
    console.error("❌ Erro ao executar Puppeteer:", error);
    return res.status(500).json({ error: "Erro ao executar integração" });
  }
}
