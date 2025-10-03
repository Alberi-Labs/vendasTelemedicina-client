import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";
import type { ElementHandle } from "puppeteer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }
    
    try {
        let {instituicao, arquivoBase64 } = req.body;

        instituicao = "Fernando Card";

        // Salva o arquivo recebido em public/uploadVidaPj
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploadVidaPj');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        // Gera nome único para o arquivo
        const fileName = `vida_pj_${Date.now()}.csv`;
        const filePath = path.join(uploadDir, fileName);
        // arquivoBase64 vem como data:<type>;base64,<base64>
        const base64Data = arquivoBase64.split(',')[1];
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        console.log('Arquivo salvo em:', filePath);

        const browser = await puppeteer.launch({
            headless: false,
            slowMo: 10,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-gpu",
              "--window-size=1920,1080",
            ],
          });

        const page = await browser.newPage();
        page.on('dialog', async (dialog) => {
            console.log(`Alerta detectado: ${dialog.message()}`);
            await dialog.dismiss();
        });

        await page.goto("https://saudeecor.i9.dev.br/white/login.php", { waitUntil: "networkidle2" });
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
            const vendasLink = Array.from(document.querySelectorAll('a.nav-link')).find(
                (el) => el.textContent?.trim() === "Vendas"
            );
            if (vendasLink) (vendasLink as HTMLElement).click();
        });

        await page.waitForSelector('a.nav-link', { visible: true });
        await page.evaluate(() => {
            const importarCsv = Array.from(document.querySelectorAll('a.nav-link')).find(
                (el) => el.textContent?.trim() === "Importar CSV"
            );
            if (importarCsv) (importarCsv as HTMLElement).click();
        });

        if (instituicao) {
            await page.waitForSelector("#seq_instituicao", { visible: true });

            const selectedInstitution = await page.evaluate((instituicao) => {
                const normalize = (str: string) =>
                    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

                const instNormalized = normalize(instituicao);
                const options = Array.from(document.querySelectorAll("#seq_instituicao option"));
                const matchingOption = options.find(opt => normalize(opt.textContent || "").includes(instNormalized));
                return matchingOption ? (matchingOption as HTMLOptionElement).value : null;
            }, instituicao);

            if (selectedInstitution) {
                await page.select("#seq_instituicao", selectedInstitution);
                console.log(`Instituição "${instituicao}" selecionada com sucesso!`);
                await page.waitForSelector('#dat_importacao', { visible: true });
                await page.type('#dat_importacao', '07/2025');

                if (filePath) {
                    await page.waitForSelector('#arquivo', { visible: true });
                    const inputUploadHandle = await page.$('#arquivo');
                    if (inputUploadHandle) {
                        await (inputUploadHandle as ElementHandle<HTMLInputElement>).uploadFile(filePath);
                        console.log(`Arquivo anexado: ${filePath}`);
                        // Aguarda o upload e clica em Salvar
                        await page.waitForSelector('#btn_gravar', { visible: true });
                        await page.click('#btn_gravar');
                        console.log('Botão Salvar clicado!');
                    } else {
                        console.error('Input de arquivo não encontrado!');
                    }
                } else {
                    console.error('Caminho do arquivo não informado na requisição!');
                }
            } else {
                console.error(`Instituição "${instituicao}" não foi encontrada.`);
            }
        }

       

        return res.status(200).json({
            message: "Integração concluída com sucesso!",
        });
    } catch (error) {
        console.error("Erro ao executar Puppeteer:", error);
        return res.status(500).json({ error: "Erro ao executar integração" });
    }
}