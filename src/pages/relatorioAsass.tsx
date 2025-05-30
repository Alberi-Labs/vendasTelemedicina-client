import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

type Cobranca = {
  nome: string;
  mes: string;
  vencimento: string;
  pagamento?: string;
};

type ClienteCobrancas = {
  nome: string;
  [mes: string]: string | undefined;
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

        const cobrancas: Cobranca[] = json.map((row) => {
          const venc = row["Vencimento"];
const pagamento = row["Data de crédito"];
const dataRef = pagamento || venc;
const dataMes = dayjs(dataRef, "DD/MM/YYYY");

return {
  nome: String(row["Nome"] || "").trim().toUpperCase(),
  mes: dataMes.isValid() ? dataMes.format("MM/YYYY") : "Desconhecido",
  vencimento: venc || "",
  pagamento: pagamento || undefined,
};

        });

        const mesesUnicos = Array.from(new Set(cobrancas.map((c) => c.mes)))
          .filter((mes) => dayjs("01/" + mes, "DD/MM/YYYY").isValid())
          .sort((a, b) =>
            dayjs("01/" + a, "DD/MM/YYYY").isAfter(dayjs("01/" + b, "DD/MM/YYYY")) ? 1 : -1
          );

        const agrupado: { [nome: string]: ClienteCobrancas } = {};
        cobrancas.forEach(({ nome, mes, vencimento, pagamento }) => {
          if (!agrupado[nome]) agrupado[nome] = { nome };

          const status = gerarStatus(vencimento, pagamento);
          const novaLinha = `Venc: ${vencimento}\nPag: ${pagamento || "-"}\n${status}`;

          if (agrupado[nome][mes]) {
            agrupado[nome][mes] += `\n\n${novaLinha}`;
          } else {
            agrupado[nome][mes] = novaLinha;
          }
        });

        const resultado = Object.values(agrupado).sort((a, b) => a.nome.localeCompare(b.nome));
        setMeses(mesesUnicos);
        setDados(resultado);
      })
      .catch((err) => {
        console.warn("Nenhum arquivo XLSX encontrado ainda ou inválido.");
        // Aqui podemos limpar os dados se desejar:
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

  const mesesVisiveis = filtrosMeses.length > 0 ? filtrosMeses : meses;

  const clientesFiltrados = dados
    .map((cliente) => {
      const novoCliente: ClienteCobrancas = { nome: cliente.nome };
      mesesVisiveis.forEach((mes) => {
        const conteudo = cliente[mes];
        if (!conteudo) return;
        if (filtrosStatus.length === 0 || filtrosStatus.some((status) => conteudo.includes(status))) {
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

  return (
    <div className="container mt-4">
      <h4 className="text-center mb-4">📋 Relatório de Cobranças</h4>

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

      <div className="d-flex justify-content-end mb-3">

      </div>

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
              {mesesVisiveis.map((mes) => (
                <th key={mes}>{mes}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((cliente, i) => (
              <tr key={i}>
                <td className="text-start fw-semibold">{cliente.nome}</td>
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