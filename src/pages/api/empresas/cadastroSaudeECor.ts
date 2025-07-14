import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  let browser: any = null;

  try {
    const { nomeEmpresa, nomeFantasia, email, cnpj, inscricaoMunicipal, inscricaoEstadual, celular, cep, endereco, uf, cidade } = req.body;

    // Limpa CNPJ e CEP removendo pontos, barras e hífens para o banco
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    const cepLimpo = cep.replace(/[^\d]/g, '');

    // Mapeamento de siglas para nomes completos dos estados
    const estadosMap: { [key: string]: string } = {
      'AC': 'ACRE',
      'AL': 'ALAGOAS',
      'AP': 'AMAPA',
      'AM': 'AMAZONAS',
      'BA': 'BAHIA',
      'CE': 'CEARA',
      'DF': 'DISTRITO FEDERAL',
      'ES': 'ESPÍRITO SANTO',
      'GO': 'GOIAS',
      'MA': 'MARANHAO',
      'MT': 'MATO GROSSO',
      'MS': 'MATO GROSSO DO SUL',
      'MG': 'MINAS GERAIS',
      'PA': 'PARA',
      'PB': 'PARAIBA',
      'PR': 'PARANA',
      'PE': 'PERNAMBUCO',
      'PI': 'PIAUI',
      'RJ': 'RIO DE JANEIRO',
      'RN': 'RIO GRANDE DO NORTE',
      'RS': 'RIO GRANDE DO SUL',
      'RO': 'RONDONIA',
      'RR': 'RORAIMA',
      'SC': 'SANTA CATARINA',
      'SP': 'SAO PAULO',
      'SE': 'SERGIPE',
      'TO': 'TOCANTINS'
    };

    const nomeEstado = estadosMap[uf] || uf;

    browser = await puppeteer.launch({
      headless: false, slowMo: 5,
    });
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

    await page.type("#num_cnpj", cnpjLimpo);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Preenche Inscrição Municipal se fornecida
    if (inscricaoMunicipal) {
      await page.type("#num_inscricao_minicipal", inscricaoMunicipal);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Preenche Inscrição Estadual se fornecida
    if (inscricaoEstadual) {
      await page.type("#num_inscricao_estadual", inscricaoEstadual);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await page.type("#num_celular", celular);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.type("#num_cep", cepLimpo);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.type("#dsc_endereco", endereco);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.waitForSelector("#select2-ind_uf-container", { visible: true });
    await page.click("#select2-ind_uf-container");

    await page.waitForSelector("input.select2-search__field", { visible: true });

    // Usa o nome completo do estado ao invés da sigla
    await page.type("input.select2-search__field", nomeEstado);

    await page.keyboard.press("Enter");

    await page.waitForSelector("#btn_gravar", { visible: true });
    await page.click("#btn_gravar");

    console.log("Cadastro concluído com sucesso!");

    // Fecha o browser
    await browser.close();

    return res.status(200).json({ message: "Integração concluída com sucesso!" });
  } catch (error) {
    console.error("Erro ao executar Puppeteer:", error);

    // Fecha o browser em caso de erro
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Erro ao fechar browser:", closeError);
      }
    }

    return res.status(500).json({ error: "Erro ao executar integração" });
  }
}