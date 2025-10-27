import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import QuadroComparativo from "@/components/quadroComparativo/QuadroComparativo";
import Loading from "@/components/loading/loading";
import axios from "axios";
import PreviewUpload from "@/components/previewUpload/PreviewUpload";

dayjs.extend(customParseFormat);

type ClienteCobrancas = {
  nome: string;
  documento?: string;
  valor?: number;
  valor_liquido?: number;
  transacoes?: any[];
  [mes: string]: string | string[] | number | any[] | undefined;
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
  const [instituicoes, setInstituicoes] = useState<any[]>([]); // Para armazenar as instituições
  const [dados, setDados] = useState<ClienteCobrancas[]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [instituicaoSelecionada, setInstituicaoSelecionada] = useState<string>(""); // Para armazenar a instituição selecionada
  const [mes, setMes] = useState<string>(""); // Para armazenar o mês selecionado
  const [ano, setAno] = useState<string>(""); // Para armazenar o ano selecionado
  const [filtroNome, setFiltroNome] = useState("");
  const [filtrosStatus, setFiltrosStatus] = useState<string[]>([]); 
  const [filtrosMeses, setFiltrosMeses] = useState<string[]>([]); 
  const [limite, setLimite] = useState(1000); 
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [fileUploaded, setFileUploaded] = useState<File | null>(null); // Guardar o arquivo carregado

  useEffect(() => {
    axios.get("/api/instituicoes/buscarInstituicao").then(res => {
      setInstituicoes(res.data.instituicoes); // <- extrai corretamente o array
    });
  }, []);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);

      try {
        // Busca os dados dos clientes via API
        const resClientes = await fetch("/api/cliente/consultar");
        const jsonClientes = await resClientes.json();

        // Busca os dados de cobranças via API com os filtros de instituição, mês e ano
        const resCobrancas = await fetch(`/api/cobranca/buscarCobranca?mes=${mes}&ano=${ano}&idEmpresa=${instituicaoSelecionada}`);
        const jsonCobrancas = await resCobrancas.json();

        const mesesUnicos = new Set<string>();
        const agrupado: { [chave: string]: ClienteCobrancas } = {};

        jsonClientes.clientes.forEach((cliente: any) => {
          const nome = cliente.nome.trim().toUpperCase();
          const documentoBruto = cliente.cpf.replace(/\D/g, "");

          jsonCobrancas.forEach((cobranca: any) => {
            if (cobranca.id_cliente === cliente.idCliente || cobranca.id_empresa === cliente.idCliente) {
              const venc = cobranca.dt_vencimento;
              const pagamento = cobranca.dt_pagamento;
              const dataRef = pagamento || venc;
              const dataMes = dayjs(dataRef, "DD/MM/YYYY");
              const mes = dataMes.isValid() ? dataMes.format("MM/YYYY") : "Desconhecido";

              const chave = `${nome}_${documentoBruto}`;

              if (!agrupado[chave]) {
                agrupado[chave] = {
                  nome,
                  documento: documentoBruto,
                  valor: 0,
                  valor_liquido: 0,
                };
              }

              agrupado[chave].valor = (agrupado[chave].valor || 0) + cobranca.valor_pg;
              agrupado[chave].valor_liquido = (agrupado[chave].valor_liquido || 0) + cobranca.valor_pg_asass;

              const status = gerarStatus(venc, pagamento);
              const novaLinha = `Venc: ${venc}\nPag: ${pagamento || "-"}\n${status}`;

              if (agrupado[chave][mes]) {
                agrupado[chave][mes] += `\n\n${novaLinha}`;
              } else {
                agrupado[chave][mes] = novaLinha;
              }

              mesesUnicos.add(mes);
            }
          });
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
        setUltimaAtualizacao(new Date().toLocaleString());
      } catch (err) {
        console.warn("Erro ao carregar dados", err);
        setDados([]);
        setMeses([]);
      }

      setCarregando(false);
    };

    if (instituicaoSelecionada && mes && ano) {
      carregarDados();
    }
  }, [instituicaoSelecionada, mes, ano]);

  const exportarExcel = () => {
    const linhas = dados.map((cliente) => {
      const linha: any = { Cliente: cliente.nome };
      meses.forEach((mes) => {
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
      setFileUploaded(file); // Atualiza o arquivo carregado
    } else {
      alert("Erro ao fazer upload.");
    }
  };

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

      {/* Input de upload de arquivo */}
       <input
        type="file"
        className="form-control"
        accept=".xlsx"
        onChange={handleFileUpload}
      />
      {ultimaAtualizacao && (
        <div className="text-muted small">
          📅 Último upload: <strong>{ultimaAtualizacao}</strong>
        </div>
      )}

      {/* Mostrar o componente PreviewUpload após o upload do arquivo */}
      {fileUploaded && <PreviewUpload file={fileUploaded} />},
      
      <div className="row mb-2">
        <div className="col-md-3 mb-2">
          <select
            className="form-control"
            value={instituicaoSelecionada}
            onChange={(e) => setInstituicaoSelecionada(e.target.value)}
          >
            <option value="">Selecione a Instituição</option>
            {instituicoes.map(inst => (
              <option key={inst.idInstituicao} value={inst.idInstituicao}>
                {inst.nomeInstituicao}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3 mb-2">
          <input
            type="month"
            className="form-control"
            value={mes && ano ? `${ano}-${mes.padStart(2, "0")}` : ""}
            onChange={(e) => {
              const [ano, mes] = e.target.value.split("-");
              setMes(mes);
              setAno(ano);
            }}
          />
        </div>
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
              <th>CPF/CNPJ</th>
              <th>Valor</th>
              <th>Valor com desconto</th>

              {meses.map((mes) => (
                <th key={mes}>{mes}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {dados.map((cliente, i) => (
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

                {meses.map((mes) => (
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
