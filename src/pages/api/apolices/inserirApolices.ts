import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import os from "os";
import fs from "fs";
import pool from "@/lib/db";
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFString } from "pdf-lib";
import pdfParse from "pdf-parse";
import path from "path";
import { readFile } from "fs/promises";
import { RowDataPacket } from "mysql2/promise";

export const config = {
    api: {
        bodyParser: false,
    },
};

// Função auxiliar para salvar em arquivo TXT
const saveToTxt = (filename: string, content: string) => {
    const txtPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(txtPath, content, "utf-8");
    return txtPath;
};

const parseForm = (req: NextApiRequest): Promise<{ fields: any; files: any }> => {
    const form = formidable({
        uploadDir: os.tmpdir(),
        keepExtensions: true,
        maxFiles: 1,
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
};

interface Segurado {
    nome: string;
    cpf: string;
    linkCertificado?: string;
    linkCarteirinha?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    try {
        const { files } = await parseForm(req);
        const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
        const filePath = uploadedFile.filepath;

        // Etapa 1: Ler arquivo PDF
        const fileBuffer = await readFile(filePath);
        saveToTxt("1_original_file_info.txt", `File path: ${filePath}\nSize: ${fileBuffer.length} bytes`);

        // Etapa 2: Extrair texto do PDF
        const parsedText = await pdfParse(fileBuffer);
        const textoExtraido = parsedText.text;
        const textoPath = saveToTxt("2_texto_extraido.txt", textoExtraido);

        // Etapa 3: Extrair estrutura do PDF
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const pages = pdfDoc.getPages();
        saveToTxt("3_pdf_structure.txt", `Número de páginas: ${pages.length}`);

        const segurados: Segurado[] = [];

        // Etapa 4: Extrair links (modificada para melhor agrupamento por página)
        // Etapa 4: Extrair links (modificada para ignorar o primeiro link de cada página)
        const linksPorPagina: string[][] = [];

        for (let p = 0; p < pages.length; p++) {
            const page = pages[p];
            let currentPageLinks: string[] = [];
            const allLinksInPage: string[] = []; // Armazena todos os links antes de filtrar

            const annotsRef = page.node.get(PDFName.of("Annots"));
            if (annotsRef) {
                const annots = pdfDoc.context.lookup(annotsRef);
                if (annots instanceof PDFArray) {
                    for (let i = 0; i < annots.size(); i++) {
                        const annotRef = annots.get(i);
                        const annot = pdfDoc.context.lookup(annotRef);

                        if (annot instanceof PDFDict) {
                            const actionRef = annot.get(PDFName.of("A"));
                            if (actionRef) {
                                const action = pdfDoc.context.lookup(actionRef);
                                if (action instanceof PDFDict) {
                                    const uri = action.get(PDFName.of("URI"));
                                    if (uri instanceof PDFString) {
                                        const link = uri.decodeText();
                                        if (link.startsWith("https://informe-documento.paas")) {
                                            allLinksInPage.push(link);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Se for a primeira página (p === 0), ignora o primeiro link; 
            // caso contrário, usa todos os links encontrados.
            if (p === 0) {
                if (allLinksInPage.length > 1) {
                    currentPageLinks = allLinksInPage.slice(1);
                } else {
                    currentPageLinks = [];
                }
            } else {
                currentPageLinks = allLinksInPage;
            }

            // Adiciona os links filtrados (ou não) da página ao array principal
            linksPorPagina.push(currentPageLinks);

            // Log dos links encontrados e filtrados na página
            const linksPath = saveToTxt(`4_links_pagina_${p + 1}.txt`,
                `Página ${p + 1} - Todos links encontrados: ${allLinksInPage.length}\n` +
                allLinksInPage.map((link, idx) => `${idx + 1}: ${link}`).join('\n') +
                `\n\nLinks utilizáveis ${p === 0 ? "(ignorando o primeiro)" : ""}: ${currentPageLinks.length}\n` +
                currentPageLinks.map((link, idx) => `${idx + 1}: ${link}`).join('\n')
            );
        }


        // Etapa 5: Processar texto e associar links (versão corrigida)
        const linhas = textoExtraido.split("\n");

        // Cria um array único com TODOS os links de todas as páginas
        const todosLinks: string[] = [];
        linksPorPagina.forEach(linksPagina => {
            todosLinks.push(...linksPagina);
        });

        let processLog = "Processamento de linhas:\n";
        processLog += `Links totais disponíveis: ${todosLinks.length}\n`;
        processLog += `Links por página:\n${linksPorPagina.map((links, idx) =>
            `Página ${idx + 1}: ${links.length} links`
        ).join('\n')}\n\n`;

        let cabecalhoEncontrado = false;
        let bufferNome: string[] = [];
        let cpfAtual = '';

        for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i].trim();
            if (!linha) continue;

            // Detecta o cabeçalho da tabela
            if (linha.includes("SubGrupo") && linha.includes("Nome do Segurado") && linha.includes("CPF/CNPJ")) {
                cabecalhoEncontrado = true;
                continue;
            }

            if (!cabecalhoEncontrado) continue;

            // Se a linha inicia com "1" ou "1 " - indicador de novo segurado
            if (/^1(\s|$)/.test(linha)) {
                // Processa o segurado anterior, caso haja dados completos (buffer e CPF)
                if (bufferNome.length > 0 && cpfAtual) {
                    processarSegurado(bufferNome.join(' ').trim(), cpfAtual);
                    bufferNome = [];
                    cpfAtual = '';
                }

                // Remove o marcador "1" e espaços iniciais
                let remainder = linha.replace(/^1\s*/, '');

                // Tenta extrair o CPF da própria linha, se presente
                const cpfMatch = remainder.match(/(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}-\d{2})/);
                if (cpfMatch) {
                    // O nome é o que vem antes do CPF (e opcionalmente, o que vem depois também)
                    bufferNome = [remainder.substring(0, cpfMatch.index).trim()];
                    cpfAtual = cpfMatch[0].replace(/[^\d]/g, "");

                    // Se houver texto após o CPF, pode ser parte do nome (opcional)
                    let afterCpf = remainder.substring((cpfMatch.index || 0) + cpfMatch[0].length).trim();
                    if (afterCpf) {
                        bufferNome.push(afterCpf);
                    }
                } else {
                    // Se não encontrou CPF, assume que a linha contém apenas parte do nome
                    bufferNome = [remainder.trim()];
                }
            } else {
                // Linha que não inicia com "1" é considerada continuação do registro atual
                // Verifica se a linha contém um CPF
                const cpfMatch = linha.match(/(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}-\d{2})/);
                if (cpfMatch) {
                    // Se ainda não temos CPF definido, define-o
                    if (!cpfAtual) {
                        cpfAtual = cpfMatch[0].replace(/[^\d]/g, "");
                    }

                    // Extrai o texto antes e depois do CPF (se houver) e adiciona ao buffer
                    let textBefore = '';
                    if (cpfMatch.index !== undefined) {
                        textBefore = linha.substring(0, cpfMatch.index).trim();
                    }
                    if (textBefore) {
                        bufferNome.push(textBefore);
                    }

                    let textAfter = linha.substring((cpfMatch.index || 0) + cpfMatch[0].length).trim();
                    if (textAfter) {
                        bufferNome.push(textAfter);
                    }
                } else {
                    // Caso a linha não contenha CPF, adiciona o seu conteúdo ao nome atual
                    bufferNome.push(linha);
                }
            }
        }

        // Processa o último segurado se ainda houver dados no buffer
        if (bufferNome.length > 0 && cpfAtual) {
            processarSegurado(bufferNome.join(' ').trim(), cpfAtual);
        }

        function processarSegurado(nomeCompleto: string, cpf: string) {
            // Limpa o nome removendo caracteres indesejados e normalizando espaços
            const nomeLimpo = nomeCompleto.replace(/[^\w\sÀ-ú]/g, '').replace(/\s+/g, ' ').trim();

            const segurado: Segurado = { nome: nomeLimpo, cpf };
            processLog += `\nNovo segurado detectado:\n`;
            processLog += `Nome: ${nomeLimpo} | CPF: ${cpf}\n`;

            // Associa um link se houver disponível
            if (todosLinks.length >= 1) {
                segurado.linkCertificado = todosLinks.shift();
                processLog += `Link atribuído: ${segurado.linkCertificado}\n`;
            } else {
                processLog += `ERRO: Sem links disponíveis\n`;
            }

            segurados.push(segurado);
            processLog += `Links restantes: ${todosLinks.length}\n`;
        }


        const processPath = saveToTxt("5_processamento.txt", processLog);
        const seguradosPath = saveToTxt("6_segurados_encontrados.txt", JSON.stringify(segurados, null, 2));
        const linksPath = saveToTxt("4_links_encontrados.txt", JSON.stringify(linksPorPagina, null, 2));

        // Etapa 6: Salvar apenas certificados no banco de dados
        let dbLog = "Registros inseridos no banco (apenas certificados):\n";
        let insercoesBemSucedidas = 0;
        let erros = 0;

        for (const segurado of segurados) {
            if (segurado.linkCertificado) {  // Use apenas o link do certificado
                try {
                    const [result] = await pool.query(
                        "SELECT COUNT(*) AS count FROM tb_apolices WHERE cpf = ?",
                        [segurado.cpf]
                    );

                    if (Array.isArray(result) && (result as RowDataPacket[])[0].count > 0) {
                        dbLog += `[AVISO] CPF ${segurado.cpf} já existe. Certificado não inserido para ${segurado.nome}\n`;
                        continue;
                    }

                    await pool.query(
                        "INSERT INTO tb_apolices (nome, cpf, arquivo) VALUES (?, ?, ?)",
                        [segurado.nome, segurado.cpf, segurado.linkCertificado]  // Apenas certificado
                    );
                    dbLog += `[SUCESSO] Certificado inserido para ${segurado.nome} - CPF: ${segurado.cpf}\n`;
                    insercoesBemSucedidas++;
                } catch (error) {
                    dbLog += `[ERRO] Ao inserir certificado para ${segurado.nome} - CPF: ${segurado.cpf}\n`;
                    dbLog += `       Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n`;
                    erros++;
                }
            } else {
                dbLog += `[AVISO] Sem link de certificado para ${segurado.nome} - CPF: ${segurado.cpf}\n`;
            }
        }

        // Adicionar resumo no final do log
        dbLog += `\nResumo da operação:\n`;
        dbLog += `- Total de segurados processados: ${segurados.length}\n`;
        dbLog += `- Certificados inseridos com sucesso: ${insercoesBemSucedidas}\n`;
        dbLog += `- Erros durante a inserção: ${erros}\n`;
        dbLog += `- Segurados sem link de certificado: ${segurados.filter(s => !s.linkCertificado).length}\n`;

        const dbPath = saveToTxt("7_insercao_banco.txt", dbLog);

        // Resultado final
        const resultado = {
            message: `${segurados.length} registros processados com sucesso.`,
            totalCertificados: segurados.filter(s => s.linkCertificado).length,
            totalCarteirinhas: segurados.filter(s => s.linkCarteirinha).length,
            debugFiles: {
                textoExtraido: textoPath,
                linksEncontrados: linksPath,
                processamento: processPath,
                segurados: seguradosPath,
                bancoDados: dbPath
            }
        };

        return res.status(200).json(resultado);

    } catch (error) {
        const errorPath = saveToTxt("0_erro.txt", `Erro ao processar PDF:\n${error instanceof Error ? error.stack : error}`);
        console.error("Erro ao processar PDF:", error);
        return res.status(500).json({
            error: "Erro ao processar PDF.",
            debugFile: errorPath
        });
    }
}