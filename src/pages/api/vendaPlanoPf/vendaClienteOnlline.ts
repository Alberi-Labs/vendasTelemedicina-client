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
        console.log("Iniciando navegador...");
        const browser = await puppeteer.launch({
            slowMo: 5,
            headless: true,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-gpu",
              "--window-size=1920,1080",
            ],
          });
          

        console.log("Abrindo nova aba...");
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log("Acessando página de login...");
        await page.goto("https://saudeecor.i9.dev.br/white/login.php", { waitUntil: "networkidle2" });

        page.on('dialog', async (dialog) => {
            console.log(`Alerta detectado: ${dialog.message()}`);
            await dialog.dismiss();
        });

        console.log("Realizando login...");
        await page.type('input[name="usuario"]', '020.314.821-57');
        await page.type('input[name="senha"]', '102030');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);

        console.log("Abrindo menu lateral...");
        await page.waitForSelector('a[data-widget="pushmenu"]', { visible: true });
        await page.click('a[data-widget="pushmenu"]');

        console.log("Preparando para abrir nova aba de compra...");
        const pagesBefore = await browser.pages();

        console.log("Clicando em 'Compra online'...");
        await page.evaluate(() => {
            const compraLink = Array.from(document.querySelectorAll('a.nav-link')).find(
                (el) => el.textContent?.trim() === "Compra online"
            );
            if (compraLink) (compraLink as HTMLElement).click();
        });

        let newPage: Page | undefined;
        for (let i = 0; i < 10; i++) {
            const pagesAfter = await browser.pages();
            newPage = pagesAfter.find(p => !pagesBefore.includes(p));
            if (newPage) break;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!newPage) {
            throw new Error("Nova aba não foi detectada.");
        }

        console.log("Nova aba aberta com sucesso!");
        await newPage.bringToFront();
        await newPage.waitForSelector('form#formulario', { visible: true });

        console.log("Preenchendo formulário com os dados do cliente...");
        await newPage.type('#nom_cliente', nomeCliente);
        await newPage.type('#dsc_email', email);
        await newPage.type('#num_cpf', cpf);
        await newPage.type('#num_celular', celular);
        await newPage.type('#dat_nascimento', dataNascimento);
        await newPage.type('#num_cep', cep);
        await newPage.type('#dsc_endereco', endereco);

        console.log("Selecionando sexo e UF...");
        await newPage.select('#ind_sexo', sexo);
        await newPage.select('#ind_uf', uf);

        console.log("Aguardando cidades carregarem...");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("Selecionando cidade...");
        await newPage.evaluate((cidade) => {
            const normalizeString = (str: string) =>
                str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

            const cidadeSelect = document.querySelector<HTMLSelectElement>('#ind_cidade');
            if (cidadeSelect) {
                const option = Array.from(cidadeSelect.options).find(opt =>
                    normalizeString(opt.textContent || "") === normalizeString(cidade)
                );
                if (option) {
                    (option as HTMLOptionElement).selected = true;
                    cidadeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }, cidade);

        console.log("Selecionando instituição...");
        await newPage.waitForSelector('#seq_instituicao', { visible: true });
        await newPage.evaluate((instituicao) => {
            const instituicaoSelect = document.querySelector<HTMLSelectElement>('#seq_instituicao');
            if (instituicaoSelect) {
                const option = Array.from(instituicaoSelect.options).find(opt =>
                    opt.textContent?.trim() === instituicao
                );
                if (option) {
                    (option as HTMLOptionElement).selected = true;
                    instituicaoSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }, instituicao);

        console.log("Aguardando produtos carregarem...");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("Selecionando produto...");
        await newPage.waitForSelector('#seq_produto', { visible: true });
        await newPage.evaluate((produto) => {
            const produtoSelect = document.querySelector<HTMLSelectElement>('#seq_produto');
            if (produtoSelect) {
                const option = Array.from(produtoSelect.options).find(opt =>
                    opt.textContent?.includes(produto)
                );
                if (option) {
                    (option as HTMLOptionElement).selected = true;
                    produtoSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }, produto);

        console.log("Aceitando termos...");
        await newPage.waitForSelector('#termo_condicao', { visible: true });
        const isChecked = await newPage.$eval('#termo_condicao', (checkbox) => (checkbox as HTMLInputElement).checked);
        if (!isChecked) {
            await newPage.click('#termo_condicao');
        }

        console.log("Aguardando antes de enviar pagamento...");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("Clicando no botão de pagamento...");
        await newPage.waitForSelector('#btn_pagamento:not([disabled])', { visible: true });
        await newPage.click('#btn_pagamento');
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("Capturando link de pagamento...");
        let pagamentoLink = "";

        try {
            await newPage.waitForSelector('.lockscreen-wrapper .text-center a[href]', { timeout: 3000 });

            pagamentoLink = await newPage.$eval('.lockscreen-wrapper .text-center a[href]', (a) => {
                return (a as HTMLAnchorElement).href;
            });

            if (!pagamentoLink.includes('asaas.com/i/')) {
                throw new Error("Link encontrado, mas não é o do pagamento.");
            }

            console.log("Link de pagamento capturado com sucesso:", pagamentoLink);
        } catch (err) {
            await browser.close();
            console.error("Erro ao capturar link:", err);
            return res.status(500).json({ error: "Não foi possível gerar a venda, tente novamente." });
        }

        await browser.close();
        console.log("Navegador fechado. Processo concluído.");

        return res.status(200).json({
            message: "Compra gerada com sucesso!",
            pagamentoLink: pagamentoLink,
        });

    } catch (error) {
        console.error("Erro ao executar Puppeteer:", error);
        return res.status(500).json({ error: "Erro ao executar integração" });
    }
}
