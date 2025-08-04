import pool from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";
import bcrypt from "bcrypt";
import { useAuth } from "@/app/context/AuthContext";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }
      const { user } = useAuth(); 
    
    try {
        const { email, cpf, celular, cep, endereco, uf, cidade, nome, sexo, dataNascimento } = req.body;
        const instituicao = "Fernando Card";

        const browser = await puppeteer.launch({
            headless: true,
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
            const clienteLink = Array.from(document.querySelectorAll('a.nav-link')).find(
                (el) => el.textContent?.trim() === "Cliente"
            );
            if (clienteLink) (clienteLink as HTMLElement).click();
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
            }
        }

        // **Selecionar Instituição**
        if (instituicao) {
            await page.waitForSelector("#seq_instituicao", { visible: true });

            const selectedInstitution = await page.evaluate((instituicao) => {
                const normalize = (str: string) =>
                    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

                const instNormalized = normalize(instituicao);
                const options = Array.from(document.querySelectorAll("#seq_instituicao option"));

                const matchingOption = options.find(opt => normalize(opt.textContent || "") === instNormalized);
                return matchingOption ? (matchingOption as HTMLOptionElement).value : null;
            }, instituicao);

            if (selectedInstitution) {
                await page.select("#seq_instituicao", selectedInstitution);
                console.log(`Instituição "${instituicao}" selecionada com sucesso!`);
            } else {
                console.error(`Instituição "${instituicao}" não foi encontrada.`);
            }
        }

        await page.waitForSelector("#nom_cliente", { visible: true });
        await page.type("#nom_cliente", nome);
        await new Promise((resolve) => setTimeout(resolve, 500));

        await page.type("#dsc_email", email);
        await new Promise((resolve) => setTimeout(resolve, 500));

        await page.type("#num_cpf", cpf);
        await new Promise((resolve) => setTimeout(resolve, 500));

        await page.type("#num_celular", celular);
        await new Promise((resolve) => setTimeout(resolve, 500));

        await page.type("#dat_nascimento", dataNascimento);
        await new Promise((resolve) => setTimeout(resolve, 500));

        await page.type("#num_cep", cep);
        await new Promise((resolve) => setTimeout(resolve, 500));

        await page.type("#dsc_endereco", endereco);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // **Selecionar Sexo**
        if (sexo) {
            await page.waitForSelector("#ind_sexo", { visible: true });

            const selectedSex = await page.evaluate((sexo) => {
                const normalize = (str: string) =>
                    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

                const sexoNormalized = normalize(sexo);
                const options = Array.from(document.querySelectorAll("#ind_sexo option"));

                const matchingOption = options.find(opt => normalize(opt.textContent || "") === sexoNormalized);
                return matchingOption ? (matchingOption as HTMLOptionElement).value : null;
            }, sexo);

            if (selectedSex) {
                await page.select("#ind_sexo", selectedSex);
                console.log(`Sexo "${sexo}" selecionado com sucesso!`);
            } else {
                console.error(`Sexo "${sexo}" não foi encontrado.`);
            }
        }

        // Selecionar UF
        await page.select("#ind_uf", uf);
        console.log(`UF "${uf}" selecionado!`);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Selecionar Cidade
        const selectedCity = await page.evaluate((cidade) => {
            const normalize = (str: string) =>
                str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

            const cidadeNormalized = normalize(cidade);
            const options = Array.from(document.querySelectorAll("#ind_cidade option"));

            const matchingOption = options.find(opt => normalize(opt.textContent || "") === cidadeNormalized);
            return matchingOption ? (matchingOption as HTMLOptionElement).value : null;
        }, cidade);

        if (selectedCity) {
            await page.select("#ind_cidade", selectedCity);
            console.log(`Cidade "${cidade}" selecionada com sucesso!`);
        } else {
            console.error(`Cidade "${cidade}" não foi encontrada na lista.`);
        }

        await page.waitForSelector("#flg_ativo", { visible: true });
        await page.evaluate(() => {
            const checkbox = document.querySelector("#flg_ativo") as HTMLInputElement;
            if (!checkbox.checked) {
                checkbox.click();
            }
        });

        await page.waitForSelector("#btn_gravar", { visible: true });
        await page.click("#btn_gravar");

        console.log("Cadastro concluído com sucesso!");
        const data = new Date(dataNascimento);
        const senhaTexto = `${String(data.getDate()).padStart(2, '0')}${String(data.getMonth() + 1).padStart(2, '0')}${data.getFullYear()}`;

        const [usuarioResult]: any = await pool.query(
            `INSERT INTO tb_usuarios 
    (nome, email, senha, telefone, perfil, imagem, cpf, creditos, data_nascimento, id_instituicao, plano_telemedicina, cep, endereco, uf, cidade, sexo) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome,
                email,
                senhaTexto,  // senha em texto simples
                celular,
                "cliente",
                null,
                cpf,
                0,
                dataNascimento,
                1,
                1,
                cep,
                endereco,
                uf,
                cidade,
                sexo
            ]
        );


        const idUsuario = usuarioResult.insertId;
        console.log("Usuário inserido com id:", idUsuario);


        return res.status(200).json({
            message: "Integração concluída com sucesso!",
            idUsuario
        });
    } catch (error) {
        console.error("Erro ao executar Puppeteer:", error);
        return res.status(500).json({ error: "Erro ao executar integração" });
    }
}