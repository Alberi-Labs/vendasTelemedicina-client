import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import QuadroComparativo from "@/components/quadroComparativo/QuadroComparativo";
import Loading from "@/components/loading/loading";

dayjs.extend(customParseFormat);

type Cobranca = {
  nome: string;
  mes: string;
  vencimento: string;
  pagamento?: string;
};

type ClienteCobrancas = {
  nome: string;
  documento?: string;
  valor?: number;
  valor_liquido?: number;
  [mes: string]: string | string[] | number | undefined;
};


const gerarStatus = (vencimento: string, pagamento?: string) => {
  const dataVenc = dayjs(vencimento, "DD/MM/YYYY");
  const dataPag = pagamento ? dayjs(pagamento, "DD/MM/YYYY") : null;

  if (dataPag) {
    if (dataPag.isAfter(dataVenc)) return "🟪 Pago com atraso";
    return "✅ Pago";
  }
  if (dataVenc.isBefore(dayjs())) return "🟥 Vencido";
  return "🟡 Aguardando";
};

export default function RelatorioAsaasUpload() {
  const [dados, setDados] = useState<ClienteCobrancas[]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtrosStatus, setFiltrosStatus] = useState<string[]>([]);
  const [filtrosMeses, setFiltrosMeses] = useState<string[]>([]);
  const [limite, setLimite] = useState(1000);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    // Carrega o arquivo XLSX se existir
    fetch("/uploads/relatorio_cobrancas.xlsx")
      .then((res) => {
        if (!res.ok) throw new Error("Arquivo não encontrado");
        return res.arrayBuffer();
      })
      .then((buffer) => {
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        const mesesUnicos = new Set<string>();
        const agrupado: { [chave: string]: ClienteCobrancas } = {};

        json.forEach((row) => {
          const nome = String(row["Nome"] || "").trim().toUpperCase();
          const documentoBruto = String(row["CPF ou CNPJ"] || "").replace(/\D/g, "");
          const venc = row["Vencimento"];
          const pagamento = row["Data de crédito"];
          const dataRef = pagamento || venc;
          const dataMes = dayjs(dataRef, "DD/MM/YYYY");
          const mes = dataMes.isValid() ? dataMes.format("MM/YYYY") : "Desconhecido";

          const valorBruto = parseFloat(String(row["Valor"] || "0").replace(",", "."));
          const valorLiquido = parseFloat(String(row["Valor Líquido"] || "0").replace(",", "."));

          const chave = `${nome}_${documentoBruto}`;

          if (!agrupado[chave]) {
            agrupado[chave] = {
              nome,
              documento: documentoBruto,
              valor: 0,
              valor_liquido: 0,
            };
          }

          agrupado[chave].valor = (agrupado[chave].valor || 0) + valorBruto;
          agrupado[chave].valor_liquido = (agrupado[chave].valor_liquido || 0) + valorLiquido;

          const status = gerarStatus(venc, pagamento);
          const novaLinha = `Venc: ${venc}\nPag: ${pagamento || "-"}\n${status}`;

          if (agrupado[chave][mes]) {
            agrupado[chave][mes] += `\n\n${novaLinha}`;
          } else {
            agrupado[chave][mes] = novaLinha;
          }

          mesesUnicos.add(mes);
        });

        const resultado = Object.values(agrupado).sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );

        setMeses(
          Array.from(mesesUnicos).sort((a, b) =>
            dayjs("01/" + a, "DD/MM/YYYY").isAfter(dayjs("01/" + b, "DD/MM/YYYY")) ? 1 : -1
          )
        );

        setDados(resultado);
      })
      .catch((err) => {
        console.warn("Nenhum arquivo XLSX encontrado ainda ou inválido.");
        setMeses([]);
        setDados([]);
      });

    // Carrega o timestamp da última atualização, se existir
    fetch("/uploads/relatorio_cobrancas_timestamp.txt")
      .then((res) => {
        if (!res.ok) throw new Error("Sem timestamp");
        return res.text();
      })
      .then(setUltimaAtualizacao)
      .catch(() => {
        setUltimaAtualizacao(null);
      });
  }, []);


  const exportarExcel = () => {
    const linhas = clientesFiltrados.map((cliente) => {
      const linha: any = { Cliente: cliente.nome };
      mesesVisiveis.forEach((mes) => {
        linha[mes] = cliente[mes] || "-";
      });
      return linha;
    });

    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "relatorio-cobrancas.xlsx");
  };

  const exportarPDF = async () => {
    const input = document.getElementById("tabela-cobrancas");
    if (!input) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
    pdf.save("relatorio-cobrancas.pdf");
  };

  const toggleMesFiltro = (mes: string) => {
    setFiltrosMeses((prev) =>
      prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes]
    );
  };

  const toggleStatusFiltro = (status: string) => {
    setFiltrosStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/relatorioAsaas/uploadArquivo", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { timestamp } = await res.json();
      setUltimaAtualizacao(timestamp);
      location.reload();
    } else {
      alert("Erro ao fazer upload.");
    }
  };

  const copiarDadosDosClientes = async () => {
    setCarregando(true);
    const documentos = new Set<string>();

    dados.forEach((cliente) => {
      const doc = cliente.documento?.replace(/\D/g, "");
      if (doc) documentos.add(doc);
    });

    const todosDocumentos = Array.from(documentos);
    const cpfs = todosDocumentos.filter((doc) => doc.length === 11).slice(0, 1000);
    const cnpjs = todosDocumentos.filter((doc) => doc.length === 14).slice(0, 5000);
    const documentosLimitados = [...cpfs, ...cnpjs];

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const clientesParaInserir: any[] = [];

    let clientesExistentes: string[] = [];
    let empresasExistentes: string[] = [];

    try {
      const resClientes = await fetch("/api/cliente/consultar");
      const jsonClientes = await resClientes.json();
      clientesExistentes = jsonClientes.clientes?.map((c: any) => c.cpf?.replace(/\D/g, "")) || [];

      const resEmpresas = await fetch("/api/empresas/listarEmpresas");
      const jsonEmpresas = await resEmpresas.json();
      empresasExistentes = jsonEmpresas.empresas?.map((e: any) => e.cnpj?.replace(/\D/g, "")) || [];
    } catch (err) {
      console.error("❌ Erro ao buscar dados existentes:", err);
      alert("Erro ao buscar dados existentes. Veja o console.");
      setCarregando(false);
      return;
    }

    for (const doc of documentosLimitados) {
      const isCNPJ = doc.length === 14;
      const jaExiste = isCNPJ
        ? empresasExistentes.includes(doc)
        : clientesExistentes.includes(doc);

      if (jaExiste) {
        console.log(`🔁 Já existente: ${doc}`);
        continue;
      }

      try {
        const res = await fetch("/api/clienteSaudeecor/buscarDados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: doc }),
        });

        if (!res.ok) throw new Error("Erro na requisição");

        const dadosCompletosArray = await res.json();
        const dadosCompletos = Array.isArray(dadosCompletosArray)
          ? dadosCompletosArray[0]
          : dadosCompletosArray;

        if (!dadosCompletos || (!dadosCompletos.nom_cliente && !dadosCompletos.nom_empresa)) {
          console.warn(`⚠️ Documento ${doc} não retornou dados válidos.`);
          continue;
        }

        const clienteParaVincular = {
          nom_cliente: dadosCompletos.nom_cliente || dadosCompletos.nom_empresa,
          num_cpf: isCNPJ ? null : dadosCompletos.num_cpf?.replace(/\D/g, ""),
          num_cnpj: isCNPJ ? dadosCompletos.num_cnpj?.replace(/\D/g, "") : null,
          dsc_email: dadosCompletos.dsc_email || null,
          num_celular: dadosCompletos.num_celular || null,
          dsc_instituicao: dadosCompletos.dsc_instituicao || dadosCompletos.dsc_empresa,
          quantidade_vidas: dadosCompletos.qtd_vidas || 0
        };

        clientesParaInserir.push(clienteParaVincular);
        console.log(`✅ Processado: ${doc}`);
      } catch (err) {
        console.error(`❌ Erro ao buscar ${doc}`, err);
      }

      await delay(2000);
    }

    if (clientesParaInserir.length === 0) {
      alert("Nenhum novo cliente ou empresa para inserir.");
      setCarregando(false);
      return;
    }

    try {
      const res = await fetch("/api/relatorioAsaas/vincularCliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientesParaInserir),
      });

      if (!res.ok) throw new Error(await res.text());

      console.log("📌 Dados vinculados com sucesso.");
      alert("Clientes e empresas vinculados com sucesso!");
    } catch (err) {
      console.error("❌ Erro ao enviar dados para vincularCliente", err);
      alert("Erro ao vincular dados. Veja o console.");
    }
    setCarregando(false);
  };

  const sincronizarCobrancas = async () => {
    setCarregando(true);
    const cobrancasParaInserir: any[] = [];

    dados.forEach((cliente) => {
      const documento = cliente.documento?.replace(/\D/g, "");
      if (!documento) return;

      meses.forEach((mes) => {
        const info = cliente[mes];
        if (typeof info !== "string") return;

        const linhas = info.split("\n\n");
        linhas.forEach((linha) => {
          const vencMatch = linha.match(/Venc:\s*(\d{2}\/\d{2}\/\d{4})/);
          const pagMatch = linha.match(/Pag:\s*(\d{2}\/\d{2}\/\d{4}|-)/);

          const vencimento = vencMatch?.[1];
          const pagamento = pagMatch?.[1] === "-" ? null : pagMatch?.[1];

          if (vencimento) {
            const mesReferencia = dayjs(vencimento, "DD/MM/YYYY").format("MM/YYYY");
            cobrancasParaInserir.push({
              cpf: documento,
              mesReferencia,
              dt_vencimento: vencimento,
              dt_pagamento: pagamento,
              valor_pg: cliente.valor || 0,
              valor_pg_asaas: cliente.valor_liquido || 0,
            });
          }
        });
      });
    });

    if (cobrancasParaInserir.length === 0) {
      alert("Nenhuma cobrança encontrada para sincronizar.");
      setCarregando(false);
      return;
    }

    try {
      const res = await fetch("/api/cobranca/uploadCobranca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cobrancasParaInserir),
      });

      if (!res.ok) throw new Error(await res.text());

      console.log("✅ Cobranças sincronizadas com sucesso.");
      alert("Cobranças sincronizadas com sucesso!");
    } catch (err) {
      console.error("❌ Erro ao sincronizar cobranças:", err);
      alert("Erro ao sincronizar cobranças. Veja o console.");
    }
    setCarregando(false);
  };


  const mesesVisiveis = filtrosMeses.length > 0 ? filtrosMeses : meses;

  const clientesFiltrados = dados
    .map((cliente) => {
      const novoCliente: ClienteCobrancas = {
        nome: cliente.nome,
        documento: cliente.documento,
        valor: cliente.valor,               // 🔹 mantém o valor bruto
        valor_liquido: cliente.valor_liquido, // 🔹 mantém o valor líquido
      };

      mesesVisiveis.forEach((mes) => {
        const conteudo = cliente[mes];
        if (!conteudo) return;
        if (
          filtrosStatus.length === 0 ||
          (typeof conteudo === "string" && filtrosStatus.some((status) => conteudo.includes(status))) ||
          (Array.isArray(conteudo) && conteudo.some((item) => typeof item === "string" && filtrosStatus.some((status) => item.includes(status))))
        ) {
          novoCliente[mes] = conteudo;
        }
      });

      return novoCliente;
    })
    .filter((cliente) => {
      const temMesComStatus = mesesVisiveis.some((mes) => cliente[mes]);
      const nomeCombina = cliente.nome.includes(filtroNome.toUpperCase());
      return temMesComStatus && nomeCombina;
    })
    .slice(0, limite);

  const formatarDocumento = (doc: string) => {
    if (doc.length === 11) {
      return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4"); // CPF
    } else if (doc.length === 14) {
      return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"); // CNPJ
    }
    return doc;
  };


  return (
    <div className="container mt-4">
          {carregando && <Loading />}

      <h4 className="text-center mb-4 mt-5">📋 Relatório de Split de Pagamento </h4>

      <QuadroComparativo />

      <h4 className="text-center mb-4 mt-5">📋 Relatório de Cobranças</h4>

      <div className="row mb-2">
        <div className="col-md-3 mb-2">
          <input
            type="file"
            className="form-control"
            accept=".xlsx"
            onChange={handleFileUpload}
          />
        </div>

        <div className="col-md-9 mb-2 d-flex align-items-center">
          {ultimaAtualizacao && (
            <div className="text-muted small">
              📅 Último upload: <strong>{ultimaAtualizacao}</strong>
            </div>
          )}
        </div>
      </div>
      <button
        className="btn btn-outline-primary mb-3"
        onClick={async () => {
          setCarregando(true);
          console.log("Iniciando cópia de dados...");
          await copiarDadosDosClientes();
          setCarregando(false);
        }}
      >
        📋 Sincronizar Clientes
      </button>

      <button
        className="btn btn-outline-success mb-3 ms-2"
        onClick={async () => {
          setCarregando(true);
          console.log("🔄 Iniciando sincronização de cobranças...");
          await sincronizarCobrancas();
          setCarregando(false);
        }}
      >
        🔄 Sincronizar Cobranças
      </button>


      <div className="row mb-3">
        <div className="col-md-3 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Filtrar por nome"
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
          />
        </div>

        <div className="col-md-3 mb-2">
          <div className="dropdown">
            <button
              className="form-control text-start d-flex justify-content-between align-items-center"
              type="button"
              data-bs-toggle="dropdown"
            >
              <span>📋 Filtrar meses</span>
              <span className="dropdown-toggle"></span>
            </button>
            <ul
              className="dropdown-menu p-2 w-100"
              style={{ maxHeight: "200px", overflowY: "auto" }}
            >
              {meses.map((mes) => (
                <li key={mes}>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={filtrosMeses.includes(mes)}
                      onChange={() => toggleMesFiltro(mes)}
                      id={`check-${mes.replace("/", "-")}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`check-${mes.replace("/", "-")}`}
                    >
                      {mes}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-md-3 mb-2">
          <div className="dropdown">
            <button
              className="form-control text-start d-flex justify-content-between align-items-center"
              type="button"
              data-bs-toggle="dropdown"
            >
              <span>🎯 Filtrar status</span>
              <span className="dropdown-toggle"></span>
            </button>
            <ul
              className="dropdown-menu p-2 w-100"
              style={{ maxHeight: "200px", overflowY: "auto" }}
            >
              {["✅ Pago", "🟪 Pago com atraso", "🟥 Vencido", "🟡 Aguardando"].map((status) => (
                <li key={status}>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={filtrosStatus.includes(status)}
                      onChange={() => toggleStatusFiltro(status)}
                      id={`status-${status}`}
                    />
                    <label className="form-check-label" htmlFor={`status-${status}`}>
                      {status}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="col-md-3 mb-2 d-flex justify-content-end">
          <div className="dropdown">
            <button className="btn btn-success dropdown-toggle" data-bs-toggle="dropdown">
              📅 Download
            </button>
            <ul className="dropdown-menu">
              <li>
                <button className="dropdown-item" onClick={exportarPDF}>📄 Exportar PDF</button>
              </li>
              <li>
                <button className="dropdown-item" onClick={exportarExcel}>📊 Exportar Excel</button>
              </li>
            </ul>
          </div>
        </div>

      </div>

      <div className="table-responsive" id="tabela-cobrancas">
        <table className="table table-bordered table-hover align-middle text-center small">
          <thead className="table-dark">
            <tr>
              <th>Cliente</th>
              <th>CPF/CNPJ</th>
              <th>Valor</th>
              <th>Valor com desconto</th>


              {mesesVisiveis.map((mes) => (
                <th key={mes}>{mes}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {clientesFiltrados.map((cliente, i) => (
              <tr key={i}>
                <td className="text-start fw-semibold">{cliente.nome}</td>
                <td style={{ fontSize: "0.85rem" }}>
                  {cliente.documento ? formatarDocumento(cliente.documento) : "-"}
                </td>
                <td>
                  {cliente.valor ? `R$ ${cliente.valor.toFixed(2).replace(".", ",")}` : "-"}
                </td>
                <td>
                  {cliente.valor_liquido ? `R$ ${cliente.valor_liquido.toFixed(2).replace(".", ",")}` : "-"}
                </td>

                {mesesVisiveis.map((mes) => (
                  <td key={mes} style={{ whiteSpace: "pre-line", fontSize: "0.85rem" }}>
                    {cliente[mes] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}