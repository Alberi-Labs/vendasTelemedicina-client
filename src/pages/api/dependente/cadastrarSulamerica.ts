import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

// Utilitários
function formatDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatCPF(cpf: string) {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function isFormattedCPF(cpf: string) {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}

function isFormattedDate(date: string) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(date);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido" });
  }

  try {
    const {
      nomeDependente,
      cpfDependente,
      nascimentoDependente,
      cpfTitular,
      nascimentoTitular,
    } = req.body;

    if (!nomeDependente || !cpfDependente || !nascimentoDependente) {
      throw new Error("Campos do dependente são obrigatórios.");
    }

    const cpfFormatado = isFormattedCPF(cpfTitular) ? cpfTitular : formatCPF(cpfTitular);
    const dataFormatada = isFormattedDate(nascimentoTitular) ? nascimentoTitular : formatDate(nascimentoTitular);
    const cpfDependenteFormatado = isFormattedCPF(cpfDependente) ? cpfDependente : formatCPF(cpfDependente);
    const nascimentoDependenteFormatado = isFormattedDate(nascimentoDependente) ? nascimentoDependente : formatDate(nascimentoDependente);

    console.log("🆔 CPF Formatado:", cpfFormatado);
    console.log("📅 Data Formatada:", dataFormatada);

    const browser = await puppeteer.launch({ headless: true,             slowMo: 10,
 });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto("https://sulamericavida.docway.com.br/", { waitUntil: "networkidle2" });

    await page.type("#cpfInput", cpfFormatado);
    await page.type("#dataNascimentoTitular", dataFormatada);
    await page.click("#btn-validar");

    await page.waitForFunction(() => {
      const activeItem = document.querySelector(".carousel-item.active");
      return activeItem && activeItem.querySelector("#btn-cadastrar");
    }, { timeout: 10000 });

    await page.click("#btn-cadastrar");

    await page.waitForSelector("#dadosDependente", { visible: true });
    await page.type("#nomeDependente", nomeDependente);
    await page.type("#dataNascimentoDependente", nascimentoDependenteFormatado);
    await page.type("#cpfDependente", cpfDependenteFormatado);
    await page.click("#btn-proximo-dependente");

    // Esperar a mensagem de sucesso final
    const mensagemSucessoEsperada =
      "Agora você e seus dependentes podem utilizar o melhor serviço de saúde do Brasil";

    await page.waitForFunction(
      (textoEsperado) => {
        const activeItem = document.querySelector(".carousel-item.active");
        return activeItem && activeItem.textContent?.includes(textoEsperado);
      },
      { timeout: 10000 },
      mensagemSucessoEsperada
    );

    console.log("✅ Dependente Cadastrado e confirmado!");

    await browser.close();

    return res.status(200).json({ success: true, message: "Dependente cadastrado com sucesso!" });
  } catch (error: any) {
    console.error("❌ Erro:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
