import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

interface DadosCadastroSaudeECor {
  nomeCliente: string;
  email: string;
  cpf: string;
  celular: string;
  dataNascimento: string;
  cep: string;
  endereco: string;
  casa: string;
  sexo: string;
  uf: string;
  cidade: string;
  formaDePagamento: string;
  instituicao: string;
  login_sistema: string;
  senha_sistema: string;
  idUsuario: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const dados: DadosCadastroSaudeECor = req.body;

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 8,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // await page.goto("https://saudeecor.i9.dev.br/white/login.php", { waitUntil: "networkidle2" });

    // await page.type('input[name="usuario"]', dados.login_sistema);
    // await page.type('input[name="senha"]', dados.senha_sistema);
    // await Promise.all([
    //   page.click('button[type="submit"]'),
    //   page.waitForNavigation({ waitUntil: "networkidle2" }),
    // ]);

    // await page.waitForSelector("#btn_pesquisar", { visible: true });
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    // const button = await page.$("#btn_pesquisar");
    // if (button) {
    //   const boundingBox = await button.boundingBox();
    //   if (boundingBox) {
    //     await page.mouse.click(
    //       boundingBox.x + boundingBox.width / 2,
    //       boundingBox.y + boundingBox.height / 2
    //     );
    //   }
    // }

    // await page.waitForSelector('a[data-widget="pushmenu"]', { visible: true });
    // await page.click('a[data-widget="pushmenu"]');

    // await page.waitForSelector('a[data-widget="fullscreen"]', { visible: true });
    // await page.click('a[data-widget="fullscreen"]');

    // await page.waitForSelector('#divClienteVinculo .btn-primary', { visible: true });
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // const clienteButton = await page.$('#divClienteVinculo .btn-primary');
    // if (clienteButton) {
    //   const boundingBox = await clienteButton.boundingBox();
    //   if (boundingBox) {
    //     await page.mouse.click(
    //       boundingBox.x + boundingBox.width / 2,
    //       boundingBox.y + boundingBox.height / 2
    //     );
    //   }
    // }

    // await page.evaluate((instituicao) => {
    //   const options = Array.from(document.querySelectorAll('#seq_instituicao_cli option'));
    //   const optionToSelect = options.find(option => option.textContent?.trim() === instituicao);
    //   if (optionToSelect) {
    //     (optionToSelect as HTMLOptionElement).selected = true;
    //     const selectElement = document.querySelector('#seq_instituicao_cli');
    //     if (selectElement) {
    //       selectElement.dispatchEvent(new Event('change'));
    //     }
    //   } else {
    //     console.error(`Instituição "${instituicao}" não encontrada.`);
    //   }
    // }, dados.instituicao);

    // await page.waitForSelector('#nom_cliente', { visible: true });
    // await page.type('#nom_cliente', dados.nomeCliente);
    // await page.click('button[onclick="getCliente();"]');

    // await new Promise((resolve) => setTimeout(resolve, 1000));

    // const nenhumRegistro = await page.evaluate(() => {
    //   const table = document.querySelector('.table tbody');
    //   if (!table) return false;
    //   return Array.from(table.querySelectorAll('tr')).some(tr => tr.innerText.includes('Nenhum registro encontrado!'));
    // });

    // if (nenhumRegistro) {
    //   await page.waitForSelector('#btn_novo_cliente', { visible: true });
    //   await page.click('#btn_novo_cliente');

    //   // Aguarda o formulário aparecer
    //   await page.waitForSelector('#formulario', { visible: true });

    //   // Preenche os campos do formulário
    //   await page.evaluate((instituicao) => {
    //     const options = Array.from(document.querySelectorAll('#seq_instituicao option'));
    //     const optionToSelect = options.find(option => option.textContent?.trim() === instituicao);
    //     if (optionToSelect) {
    //       (optionToSelect as HTMLOptionElement).selected = true;
    //       const selectElement = document.querySelector('#seq_instituicao');
    //       if (selectElement) {
    //         selectElement.dispatchEvent(new Event('change'));
    //       }
    //     } else {
    //       console.error(`Instituição "${instituicao}" não encontrada no formulário.`);
    //     }
    //   }, dados.instituicao);

    //   await page.type('#nom_cliente', dados.nomeCliente);
    //   await page.type('#dsc_email', dados.email);
    //   await page.type('#num_cpf', dados.cpf);
    //   await page.type('#num_celular', dados.celular);
    //   await page.type('#dat_nascimento', dados.dataNascimento);
    //   await page.type('#num_cep', dados.cep);
    //   await page.type('#dsc_endereco', dados.endereco);
    //   await page.select('#ind_sexo', dados.sexo);
    //   await page.select('#ind_uf', dados.uf);

    //   // Aguarda cidades carregarem e seleciona a cidade da requisição
    //   await page.waitForSelector('#ind_cidade', { visible: true });

    //   // Busca e seleciona a cidade pelo nome
    //   await page.evaluate((cidadeNome) => {
    //     const select = document.querySelector('#ind_cidade') as HTMLSelectElement;
    //     if (select) {
    //       const options = Array.from(select.options);
    //       const cidadeOption = options.find(option =>
    //         option.textContent?.trim().toUpperCase() === cidadeNome.toUpperCase()
    //       );

    //       if (cidadeOption) {
    //         select.value = cidadeOption.value;
    //         select.dispatchEvent(new Event('change'));
    //         console.log(`✅ Cidade selecionada: ${cidadeNome} (valor: ${cidadeOption.value})`);
    //       } else {
    //         console.error(`❌ Cidade "${cidadeNome}" não encontrada. Selecionando BRASÍLIA como fallback.`);
    //         // Fallback para BRASÍLIA se a cidade não for encontrada
    //         select.value = '743';
    //         select.dispatchEvent(new Event('change'));
    //       }
    //     }
    //   }, dados.cidade);

    //   // Marca o checkbox de ativo se não estiver marcado
    //   await page.evaluate(() => {
    //     const checkbox = document.querySelector('#flg_ativo') as HTMLInputElement;
    //     if (checkbox && !checkbox.checked) checkbox.click();
    //   });
    //   // Clica no botão salvar
    //   await page.click('#btn_gravar');
    // } else {
    //   await page.waitForSelector('.table .btn-primary', { visible: true });
    //   await page.click('.table .btn-primary');
    // }

    // // A partir daqui o fluxo é igual para ambos os casos
    // await page.waitForSelector('input[name="tip_venda"][value="S"]', { visible: true });
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // await page.click('input[name="tip_venda"][value="S"]');

    // // Aguarda e clica no botão "Escolher Produto"
    // await page.waitForSelector('a[data-target="#modal-lg-prod"]', { visible: true });
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // await page.click('a[data-target="#modal-lg-prod"]');
    // //aqiuio


    // await new Promise((resolve) => setTimeout(resolve, 1000));

    // await page.evaluate((instituicao) => {
    //   const options = Array.from(document.querySelectorAll('#seq_instituicao option'));
    //   const optionToSelect = options.find(option => option.textContent?.trim() === instituicao);
    //   if (optionToSelect) {
    //     (optionToSelect as HTMLOptionElement).selected = true;
    //     const selectElement = document.querySelector('select#seq_instituicao');
    //     console.log("elemento selecionado", selectElement);
    //     if (selectElement) {
    //       selectElement.dispatchEvent(new Event('change'));
    //     }
    //   } else {
    //     console.error(`Instituição "${instituicao}" não encontrada.`);
    //   }
    // }, dados.instituicao);

    // await new Promise((resolve) => setTimeout(resolve, 1000));

    // const rows = await page.$$('#divHtmlProduto table tbody tr');
    // let produtoClicado = false;

    // for (const row of rows) {
    //   const nomeColuna = await row.$eval('td:first-child', el => el.textContent?.trim());
    //   if (nomeColuna === "Plano Telemedicina Básico") {
    //     const botao = await row.$('button.btn-primary.btn-sm');
    //     if (botao) {
    //       const boundingBox = await botao.boundingBox();
    //       if (boundingBox) {
    //         await page.mouse.click(
    //           boundingBox.x + boundingBox.width / 2,
    //           boundingBox.y + boundingBox.height / 2
    //         );
    //         produtoClicado = true;
    //         break;
    //       }
    //     }
    //   }
    // }

    // if (!produtoClicado) {
    //   console.error("❌ Produto 'Plano Telemedicina Básico' não encontrado ou botão não clicável.");
    // }
    //  await new Promise(resolve => setTimeout(resolve, 500));
    //  await page.waitForSelector('#divBtnPropostaIsento a', { visible: true });
    //  await new Promise((resolve) => setTimeout(resolve, 1000));
    //  await page.click('#divBtnPropostaIsento a');

    //  await new Promise((resolve) => setTimeout(resolve, 1000));

    //  await page.waitForSelector('.modal.show, .modal.in', { visible: true });

    // // // seleciona o modal visível
    //  const modalHandle = await page.$('.modal.show, .modal.in');

    // // // clica no botão close *dentro* do modal
    //  if (modalHandle) {
    //    await modalHandle.$eval('button.close[aria-label="Close"]', btn => btn.click());
    //  } else {
    //    console.error("❌ Modal não encontrado para fechar.");
    //  }

    // // // espera o modal sumir
    //  await page.waitForSelector('.modal.show, .modal.in', { hidden: true });
    //  await new Promise((resolve) => setTimeout(resolve, 1000));

    //  await page.waitForSelector('#divBtnProximoPasso a', { visible: true });
    //  await page.click('#divBtnProximoPasso a');

    //  await new Promise((resolve) => setTimeout(resolve, 2000));

    //  const selector = '.timeline-footer a.btn.bg-purple[data-toggle="modal"][data-target="#modal-lg-contr"]';
    //  await page.waitForSelector(selector, { visible: true, timeout: 10000 });

    //  const btn = await page.$(selector);
    //  if (!btn) throw new Error("Botão 'Enviar proposta' não encontrado.");

    //  await page.evaluate((el) => {
    //   el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    // }, btn);

    //  await page.evaluate((el) => el.click(), btn);

    // await page.waitForSelector('#modal-lg-contr.show, #modal-lg-contr.in', { visible: true });

    return res.status(200).json({
      success: true,
      message: "Cliente cadastrado no sistema Saúde e Cor com sucesso!",
    });

  } catch (error) {
    console.error("❌ Erro no cadastro Saúde e Cor:", error);

    // if (browser) {
    //   try {
    //     await browser.close();
    //   } catch (closeError) {
    //     console.error("Erro ao fechar browser:", closeError);
    //   }
    // }

    return res.status(500).json({
      error: "Erro no cadastro Saúde e Cor",
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
