import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { nomeEmpresa, nomeFantasia, email, cnpj, celular, cep, endereco, uf, cidade } = req.body;

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://saudeecor.i9.dev.br/white/login.php", { waitUntil: "networkidle2" });

    await page.type('input[name="usuario"]', '020.314.821-57');
    await page.type('input[name="senha"]', '102030');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);
    console.log("Login realizado com sucesso!");

    await page.waitForSelector('a[data-widget="pushmenu"]', { visible: true });
    await page.click('a[data-widget="pushmenu"]');
    console.log("Ícone de menu clicado!");

    await page.waitForSelector('a.nav-link', { visible: true });
    await page.evaluate(() => {
      const cadastroLink = Array.from(document.querySelectorAll('a.nav-link')).find(
        (el) => el.textContent?.trim() === "Cadastro"
      );
      if (cadastroLink) (cadastroLink as HTMLElement).click();
    });

    await page.waitForSelector('a.nav-link', { visible: true });
    await page.evaluate(() => {
      const empresaLink = Array.from(document.querySelectorAll('a.nav-link')).find(
        (el) => el.textContent?.trim() === "Empresa"
      );
      if (empresaLink) (empresaLink as HTMLElement).click();
    });

    await page.waitForSelector("#btn_voltar", { visible: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const button = await page.$("#btn_voltar");
    if (button) {
      const boundingBox = await button.boundingBox();
      if (boundingBox) {
        await page.mouse.click(
          boundingBox.x + boundingBox.width / 2,
          boundingBox.y + boundingBox.height / 2
        );
        console.log("Clique simulado via coordenadas no botão 'Voltar'.");
      } else {
        console.error("Não foi possível obter as coordenadas do botão.");
      }
    } else {
      console.error("Botão #btn_voltar não encontrado.");
    }

    await page.waitForSelector("#nom_empresa", { visible: true });
    await page.type("#nom_empresa", nomeEmpresa);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.type("#nom_fantasia", nomeFantasia);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.type("#dsc_email", email);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.type("#num_cnpj", cnpj);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.type("#num_celular", celular);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.type("#num_cep", cep);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.type("#dsc_endereco", endereco);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.waitForSelector("#select2-ind_uf-container", { visible: true });
    await page.click("#select2-ind_uf-container");

    await page.waitForSelector("input.select2-search__field", { visible: true });

    await page.type("input.select2-search__field", uf);

    await page.keyboard.press("Enter");

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const selectedValue = await page.evaluate((cidade: string) => {
      const normalize = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

      const cidadeNormalized = normalize(cidade);
      const options = Array.from(document.querySelectorAll("#ind_cidade option"));

      const listaOpcoes = options.map(opt => opt.textContent?.trim() || "");
      console.log("Opções disponíveis:", listaOpcoes);

      const matchingOption = options.find(opt => normalize(opt.textContent || "") === cidadeNormalized);

      return matchingOption ? (matchingOption as HTMLOptionElement).value : null;
    }, cidade);

    if (selectedValue) {
      await page.select("#ind_cidade", selectedValue);
      console.log(`Cidade "${cidade}" selecionada com sucesso!`);
    } else {
      console.error(`Cidade "${cidade}" não foi encontrada na lista.`);
    }

    await page.waitForSelector("#btn_gravar", { visible: true });
    await page.click("#btn_gravar");

    return res.status(200).json({ message: "Integração concluída com sucesso!" });
  } catch (error) {
    console.error("Erro ao executar Puppeteer:", error);
    return res.status(500).json({ error: "Erro ao executar integração" });
  }
}
