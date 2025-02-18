import { useState, useEffect } from "react";
import { Button, Table, Row, Col, Form } from "react-bootstrap";
import * as XLSX from "xlsx";
import ConferenciaPopup from "../components/conferencia/ConferenciaPopup";
import CadastroEmpresa from "../components/cadastroEmpresa/CadastroEmpresa";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import Loading from "@/components/loading/loading";

export default function CadastroPj() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pessoas, setPessoas] = useState<{ nome: string; cpf: string; nascimento: string; uf: string; genero: string }[]>([]);
  const [empresas, setEmpresas] = useState<{ idEmpresa: number; nomeEmpresa: string }[]>([]);
  const [novaPessoa, setNovaPessoa] = useState({ nome: "", cpf: "", nascimento: "", uf: "", genero: "" });
  const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showCadastroEmpresa, setShowCadastroEmpresa] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>("");
  const [erroMensagem, setErroMensagem] = useState("");
  const [mensagemAlerta, setMensagemAlerta] = useState<{ texto: string; tipo: "success" | "danger" | "warning" | "info" | "primary" }>({ texto: "", tipo: "danger" });
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);


  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then((res) => res.json())
      .then((data) => {
        setEstados(data.map((estado: any) => ({ sigla: estado.sigla, nome: estado.nome })));
      });
    fetch("/api/buscarEmpresa")
      .then((res) => res.json())
      .then((data) => {
        setEmpresas(data);
      });
  }, []);



  const handleEnviarDados = async () => {
    setMensagemAlerta({ texto: "", tipo: "danger" });
    setLoading(true);
    if (!empresaSelecionada) {
      setLoading(false);
      setMensagemAlerta({ texto: "⚠️ Você precisa selecionar uma empresa antes de enviar os dados!", tipo: "warning" });
      return;
    }

    try {
      const response = await fetch("/api/cadastroVida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idEmpresa: empresaSelecionada,
          vidas: pessoas,
        }),
      });

      if (!response.ok) {
        setLoading(false);
        const erroData = await response.json();
        setMensagemAlerta({ texto: erroData.error || "❌ Falha ao cadastrar vidas. Tente novamente!", tipo: "danger" });
        return;
      }
      setLoading(false);
      setPessoas([]);
      setEmpresaSelecionada("");
      setMensagemAlerta({ texto: "✅ Vidas cadastradas com sucesso!", tipo: "success" });
    } catch (error) {
      setLoading(false);
      console.error("Erro no envio:", error);
      setMensagemAlerta({ texto: "❌ Ocorreu um erro inesperado ao cadastrar vidas.", tipo: "danger" });
    }
  };




  const handleRemovePessoa = (index: number) => {
    setPessoas(pessoas.filter((_, i) => i !== index));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNovaPessoa({ ...novaPessoa, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();

      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { raw: true });

        const formattedData = jsonData.map((row) => ({
          nome: row["Nome"] || "",
          cpf: row["CPF"] || "",
          nascimento: convertExcelDate(row["Data de Nascimento"]),
          uf: row["UF"] || "",
          genero: row["Gênero"] || "",
        }));

        setPessoas(formattedData);
        setShowPopup(true);
      };

      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const convertExcelDate = (excelValue: any) => {
    if (!excelValue) return "";

    if (typeof excelValue === "number") {
      const excelStartDate = new Date(1900, 0, 0);
      const convertedDate = new Date(excelStartDate.getTime() + (excelValue - 1) * 86400000);
      return convertedDate.toLocaleDateString("pt-BR");
    }

    if (typeof excelValue === "string") {
      const date = new Date(excelValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("pt-BR");
      }
    }

    return "";
  };


  const handleAddPessoa = () => {
    if (novaPessoa.nome && novaPessoa.cpf && novaPessoa.nascimento && novaPessoa.uf && novaPessoa.genero) {
      setPessoas([...pessoas, novaPessoa]);
      setNovaPessoa({ nome: "", cpf: "", nascimento: "", uf: "", genero: "" });
    } else {
      alert("Preencha todos os campos antes de adicionar!");
    }
  };

  return (
    <>
      {mensagemAlerta.texto && (
        <AvisoAlerta
          mensagem={mensagemAlerta.texto}
          tipo={mensagemAlerta.tipo}
          onClose={() => setMensagemAlerta({ texto: "", tipo: "danger" })}
        />
      )}

      <div className="container d-flex justify-content-center mt-5">
        <div className="p-4 rounded shadow-lg" style={{ backgroundColor: "#FFF", width: "75%" }}>
          <h2 className="text-center mb-4">Venda Empresarial</h2>
          <p className="text-center">Realize a venda empresarial preenchendo a planilha ou inserindo manualmente.</p>

          <Row className="align-items-center mb-4">
            {/* Dropdown de seleção de cliente */}
            <Col md="8">
              <Form.Label>Selecionar Cliente</Form.Label>
              <Form.Select
                value={clienteSelecionado || ""}
                onChange={(e) => setClienteSelecionado(e.target.value)}
              >
                <option value="">Escolha um cliente</option>
                {empresas.map((empresa) => (
                  <option key={empresa.idEmpresa} value={empresa.idEmpresa}>
                    {empresa.nomeEmpresa}
                  </option>
                ))}
              </Form.Select>
            </Col>

            {/* Botão para cadastrar novo cliente */}
            <Col md="4" className="text-end">
              <Button variant="primary" onClick={() => setShowCadastroEmpresa(true)}>
                Cadastrar Cliente
              </Button>
            </Col>
          </Row>

          {clienteSelecionado && (
            <>
              <div className="w-75 mx-auto">
                <div className="mb-3">
                  <label className="form-label">Upload de Planilha</label>
                  <input type="file" className="form-control" accept=".csv, .xlsx" onChange={handleFileUpload} />
                </div>
              </div>

              <hr className="my-4" />

              <h4 className="text-center mb-3">Adicionar Pessoa Manualmente</h4>
              <Row className="align-items-center g-2">
                <Col>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nome"
                    name="nome"
                    value={novaPessoa.nome}
                    onChange={(e) => setNovaPessoa({ ...novaPessoa, nome: e.target.value })}
                  />
                </Col>
                <Col>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="CPF"
                    name="cpf"
                    value={novaPessoa.cpf}
                    onChange={(e) => setNovaPessoa({ ...novaPessoa, cpf: e.target.value })}
                  />
                </Col>
                <Col>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Data de Nascimento"
                    name="nascimento"
                    value={novaPessoa.nascimento}
                    onChange={(e) => setNovaPessoa({ ...novaPessoa, nascimento: e.target.value })}
                  />
                </Col>
                <Col>
                  <select
                    className="form-control"
                    name="uf"
                    value={novaPessoa.uf}
                    onChange={(e) => setNovaPessoa({ ...novaPessoa, uf: e.target.value })}
                  >
                    <option value="">UF</option>
                    {estados.map((estado) => (
                      <option key={estado.sigla} value={estado.sigla}>
                        {estado.nome}
                      </option>
                    ))}
                  </select>
                </Col>
                <Col>
                  <select
                    className="form-control"
                    name="genero"
                    value={novaPessoa.genero}
                    onChange={(e) => setNovaPessoa({ ...novaPessoa, genero: e.target.value })}
                  >
                    <option value="">Gênero</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </Col>
                <Col xs="auto">
                  <Button variant="success" onClick={handleAddPessoa}>
                    Adicionar
                  </Button>
                </Col>
              </Row>
              <div className="text-center mt-4">
            {loading ? (
              <Loading />
            ) : (
              <Button variant="success" className="w-50" onClick={handleEnviarDados}>
                Enviar Dados
              </Button>
            )}
          </div>
            </>
          )}

          <CadastroEmpresa
            isOpen={showCadastroEmpresa}
            onClose={() => setShowCadastroEmpresa(false)}
            onEmpresaCadastrada={(novaEmpresa) =>
              setEmpresas((prev) => [
                ...prev,
                { idEmpresa: Number(novaEmpresa.idEmpresa) || 0, nomeEmpresa: novaEmpresa.nomeEmpresa },
              ])
            }
          />

         
        </div>
      </div>
    </>
  );
}