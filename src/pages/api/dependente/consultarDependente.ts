import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatCPF(cpf: string) {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  try {
    const { titularCpf, titularNascimento } = req.body;

    if (!titularCpf || !titularNascimento) {
      return res.status(400).json({ success: false, error: "Todos os campos são obrigatórios." });
    }

    const cpfFormatado = formatCPF(titularCpf);
    const dataFormatada = formatDate(titularNascimento);

    console.log("🆔 CPF Formatado:", cpfFormatado);
    console.log("📅 Data Formatada:", dataFormatada);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto("https://sulamericavida.docway.com.br/", { waitUntil: "networkidle2" });

    await page.waitForSelector("#cpfInput", { visible: true });
    await page.type("#cpfInput", cpfFormatado);

    await page.waitForSelector("#dataNascimentoTitular", { visible: true });
    await page.type("#dataNascimentoTitular", dataFormatada);

    await page.waitForSelector("#btn-validar", { visible: true });
    await page.click("#btn-validar");

    console.log("✅ Validação Bem-Sucedida!");

    await page.waitForFunction(() => {
      const activeItem = document.querySelector(".carousel-item.active");
      return activeItem && activeItem.querySelector("#btn-cadastrar");
    }, { timeout: 5000 });

    console.log("✅ Carrossel navegou para a tela de cadastro!");

    await page.waitForSelector("#btn-cadastrar", { visible: true });
    await page.click("#btn-cadastrar");

    // Verifica se existe a seção de dependentes
    const existeResumo = await page.$("#resumoDependente");

    if (!existeResumo) {
      await browser.close();
      return res.status(200).json({
        success: false,
        message: "Nenhum dependente encontrado!",
        dependentes: [],
      });
    }

    const dependentesRaw = await page.$eval("#resumoDependente", el => el.textContent || "");

    const dependentesFormatados = dependentesRaw
      .split("\n")
      .filter(linha => linha.trim() !== "")
      .map(linha => {
        const [nome, cpf, nascimento] = linha.split(",").map(p => p.trim());
        return { nome, cpf, nascimento };
      });

    console.log("📋 Dependentes extraídos:", dependentesFormatados);

    await browser.close();

    if (dependentesFormatados.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Nenhum dependente encontrado!",
        dependentes: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dependente cadastrado com sucesso!",
      dependentes: dependentesFormatados,
    });

  } catch (error) {
    console.error("🚨 Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return res.status(500).json({ success: false, error: errorMessage });
  }
}
