import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { consultarDependente } from "./consultarDependente";


// Função para converter data de "aaaa-mm-dd" para "dd/mm/aaaa"
function formatDate(dateString: string) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}

// Função para formatar CPF para "###.###.###-##"
function formatCPF(cpf: string) {
    const cleaned = cpf.replace(/\D/g, ""); // Remove tudo que não for número
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export async function POST(req: Request) {
    try {
        // Lendo o corpo da requisição
        const { nomeDependente, cpfDependente, nascimentoDependente } = await req.json();

        if (!nomeDependente || !cpfDependente || !nascimentoDependente) {
          throw new Error("Campos do dependente são obrigatórios.");
        }
    
        // 🔹 Consulta o titular diretamente do banco
        const titular = await consultarDependente();
        const cpf = titular.cpf;
        const dataNascimento = titular.data_nascimento;

        // Converter CPF e data para os formatos corretos
        const cpfFormatado = formatCPF(cpf);
        const dataFormatada = formatDate(dataNascimento);
        const cpfDependenteFormatado = formatCPF(cpfDependente);
        const nascimentoDependenteFormatado = formatDate(nascimentoDependente);

        console.log("🆔 CPF Formatado:", cpfFormatado);
        console.log("📅 Data Formatada:", dataFormatada);

        
        const browser = await puppeteer.launch({ headless: false });
          

        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080,
          });
        await page.goto("https://sulamericavida.docway.com.br/", { waitUntil: "networkidle2" });

        // Preenchendo CPF e Data de Nascimento
        await page.waitForSelector("#cpfInput", { visible: true });
        await page.type("#cpfInput", cpfFormatado);

        await page.waitForSelector("#dataNascimentoTitular", { visible: true });
        await page.type("#dataNascimentoTitular", dataFormatada);

        // Clicando no botão "Validar Dados"
        const validarButtonSelector = "#btn-validar";
        await page.waitForSelector(validarButtonSelector, { visible: true });
        await page.click(validarButtonSelector);

        // Aguardar a próxima tela carregar

        // Verifica se a validação foi bem-sucedida

        console.log("✅ Validação Bem-Sucedida!");

        // Clicando no botão "Cadastrar Dependente"
        // Seleciona o botão "Cadastrar Dependente"

        // Aguarda o carrossel mudar e o botão aparecer
        await page.waitForFunction(() => {
            const activeItem = document.querySelector(".carousel-item.active");
            return activeItem && activeItem.querySelector("#btn-cadastrar");
        }, { timeout: 5000 });

        console.log("✅ Carrossel navegou para a tela de cadastro!");

        // Espera o botão "Cadastrar Dependente" ficar interativo
        await page.waitForSelector("#btn-cadastrar", { visible: true, timeout: 5000 });
        await page.click("#btn-cadastrar");
        console.log("✅ Botão 'Cadastrar Dependente' clicado!");


        // Espera a tela de cadastro do dependente carregar
        await page.waitForSelector("#dadosDependente", { visible: true });

        // Preenchendo Nome do Dependente
        await page.waitForSelector("#nomeDependente", { visible: true });
        await page.type("#nomeDependente", nomeDependente);

        // Preenchendo Data de Nascimento do Dependente
        await page.waitForSelector("#dataNascimentoDependente", { visible: true });
        await page.type("#dataNascimentoDependente", nascimentoDependenteFormatado);

        // Preenchendo CPF do Dependente
        await page.waitForSelector("#cpfDependente", { visible: true });
        await page.type("#cpfDependente", cpfDependenteFormatado);

        // Clicando no botão "Cadastrar Dependente"
        const cadastrarDependenteButtonSelector = "#btn-proximo-dependente";
        await page.waitForSelector(cadastrarDependenteButtonSelector, { visible: true });
        await page.click(cadastrarDependenteButtonSelector);


        console.log("✅ Dependente Cadastrado!");

        return NextResponse.json({ success: true, message: "Dependente cadastrado com sucesso!" });
    } catch (error) {
        console.error("🚨 Erro:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}