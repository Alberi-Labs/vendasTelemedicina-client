import { useState } from "react";
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
  const hoje = dayjs();
  const dataVenc = dayjs(vencimento, "DD/MM/YYYY");
  const dataPag = pagamento ? dayjs(pagamento, "DD/MM/YYYY") : null;

  if (dataPag) return "✅ Pago";
  if (dataVenc.isBefore(hoje)) return "🟥 Vencido";
  return "🟡 Aguardando";
};

export default function RelatorioAsaasUpload() {
  const [dados, setDados] = useState<ClienteCobrancas[]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtrosMeses, setFiltrosMeses] = useState<string[]>([]);
  const [limite, setLimite] = useState(10);

  const toggleMesFiltro = (mes: string) => {
    setFiltrosMeses((prev) =>
      prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes]
    );
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      const cobrancas: Cobranca[] = json.map((row) => {
        const venc = row["Vencimento"];
        const dataVenc = dayjs(venc, "DD/MM/YYYY");

        return {
          nome: String(row["Nome"] || "").trim().toUpperCase(),
          mes: dataVenc.isValid() ? dataVenc.format("MM/YYYY") : "Desconhecido",
          vencimento: venc || "",
          pagamento: row["Data de crédito"] || undefined,
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
        agrupado[nome][mes] = `Venc: ${vencimento}\nPag: ${pagamento || "-"}\n${gerarStatus(
          vencimento,
          pagamento
        )}`;
      });

      const resultado = Object.values(agrupado).sort((a, b) => a.nome.localeCompare(b.nome));
      setMeses(mesesUnicos);
      setDados(resultado);
      setLimite(10);
    };

    reader.readAsBinaryString(file);
  };

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

    const canvas = await html2canvas(input, { scrollX: -window.scrollX });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
    pdf.save("relatorio-cobrancas.pdf");
  };

  const mesesVisiveis = filtrosMeses.length > 0 ? filtrosMeses : meses;

  const clientesFiltrados = dados
    .map((cliente) => {
      const novoCliente: ClienteCobrancas = { nome: cliente.nome };
      mesesVisiveis.forEach((mes) => {
        const conteudo = cliente[mes];
        if (!conteudo) return;
        if (!filtroStatus || conteudo.includes(filtroStatus)) {
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

      <div className="d-flex justify-content-end mb-3">
        <div className="dropdown">
          <button className="btn btn-success dropdown-toggle" data-bs-toggle="dropdown">
            📥 Download
          </button>
          <ul className="dropdown-menu">
            <li><button className="dropdown-item" onClick={exportarPDF}>📄 Exportar PDF</button></li>
            <li><button className="dropdown-item" onClick={exportarExcel}>📊 Exportar Excel</button></li>
          </ul>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3 mb-2">
          <input
            type="file"
            className="form-control"
            accept=".xlsx"
            onChange={handleUpload}
          />
        </div>

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
              <span>🗓️ Filtrar meses</span>
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
          <select
            className="form-control"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">🎯 Todos os status</option>
            <option value="✅ Pago">✅ Pago</option>
            <option value="🟥 Vencido">🟥 Vencido</option>
            <option value="🟡 Aguardando">🟡 Aguardando</option>
          </select>
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

      <div className="d-flex justify-content-between mt-3">
        <button
          className="btn btn-outline-primary"
          onClick={() => setLimite((prev) => prev + 10)}
          disabled={limite >= dados.length}
        >
          Mostrar mais
        </button>
      </div>
    </div>
  );
}
