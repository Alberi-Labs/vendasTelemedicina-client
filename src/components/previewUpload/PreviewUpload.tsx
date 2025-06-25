import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Loading from "@/components/loading/loading";
import axios from "axios";

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

const PreviewUpload = ({ file }: { file: File }) => {
  const [dadosPlanilha, setDadosPlanilha] = useState<ClienteCobrancas[]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [edicoes, setEdicoes] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    setCarregando(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const mesesUnicos = new Set<string>();
      const agrupado: { [chave: string]: ClienteCobrancas } = {};

      json.forEach((row: any) => {
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
            transacoes: [],
          };
        }

        // Criação de múltiplas cobranças se necessário
        const transacao = {
          mes,
          vencimento: venc,
          pagamento,
          valorBruto,
          valorLiquido,
          status: gerarStatus(venc, pagamento),
        };

        if (!Array.isArray(agrupado[chave].transacoes)) {
          agrupado[chave].transacoes = [];
        }
        agrupado[chave].transacoes.push(transacao);

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

      setDadosPlanilha(resultado);
      setCarregando(false);
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  const handleEdicao = (clienteId: string, mes: string, tipo: string, valor: string) => {
    setEdicoes((prevEdicoes) => ({
      ...prevEdicoes,
      [`${clienteId}_${mes}_${tipo}`]: valor, // Formato de chave: id_cliente_mes_tipo
    }));
  };

  const exportarExcel = () => {
    const linhas = dadosPlanilha.map((cliente) => {
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
      <h4 className="text-center mb-4 mt-5">📋 Pré-visualização do Relatório de Cobranças</h4>

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
            {dadosPlanilha.map((cliente, i) => (
              <tr key={i}>
                <td className="text-start fw-semibold">{cliente.nome}</td>
                <td>{formatarDocumento(cliente.documento || "")}</td>
                <td>{cliente.valor ? `R$ ${cliente.valor.toFixed(2).replace(".", ",")}` : "-"}</td>
                <td>{cliente.valor_liquido ? `R$ ${cliente.valor_liquido.toFixed(2).replace(".", ",")}` : "-"}</td>
                {meses.map((mes) => (
                  <td key={mes} style={{ whiteSpace: "pre-line", fontSize: "0.85rem" }}>
  {cliente.transacoes?.find(t => t.mes === mes)
    ? cliente.transacoes
        .filter(t => t.mes === mes)
        .map(t => `Venc: ${t.vencimento}\nPag: ${t.pagamento || "-"}\n${t.status}`)
        .join("\n\n")
    : "-"}
</td>

                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-success" onClick={exportarPDF}>📄 Exportar PDF</button>
        <button className="btn btn-primary ms-2" onClick={exportarExcel}>📊 Exportar Excel</button>
      </div>
    </div>
  );
};

export default PreviewUpload;
