import { useState, useEffect } from "react";
import { Button, Table, Row, Col, Form } from "react-bootstrap";
import * as XLSX from "xlsx";
import ConferenciaPopup from "../components/conferencia/ConferenciaPopup";
import CadastroEmpresa from "../components/cadastroEmpresa/CadastroEmpresa";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import Loading from "@/components/loading/loading";
import EscolherClientePopup from "@/components/escolherClientePopup.tsx/EscolherClientePoup";

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
  const [showEscolherCliente, setShowEscolherCliente] = useState(false);


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

    if (pessoas.length === 0) {
      setLoading(false);
      setMensagemAlerta({ texto: "⚠️ Você precisa adicionar pelo menos uma vida antes de enviar!", tipo: "warning" });
      return;
    }

    try {
      const response = await fetch("/api/cadastroVidaEmpresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idEmpresa: empresaSelecionada,
          vidas: pessoas,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setLoading(false);
        setMensagemAlerta({ texto: `❌ ${result.error || "Erro ao cadastrar vidas"}`, tipo: "danger" });
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

  const formatCPF = (cpf: string) => {
    return cpf
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatDate = (date: string) => {
    return date
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 10);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    if (name === "cpf") {
      value = formatCPF(value);
    }

    if (name === "nascimento") {
      value = formatDate(value);
    }

    setNovaPessoa({ ...novaPessoa, [name]: value });
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];

    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith(".xlsx") && !uploadedFile.name.endsWith(".csv")) {
      setMensagemAlerta({ texto: "❌ Formato inválido. Somente arquivos .xlsx ou .csv são permitidos!", tipo: "danger" });
      return;
    }

    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
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
      } catch (error) {
        setMensagemAlerta({ texto: "❌ Erro ao processar o arquivo. Verifique se ele está no formato correto.", tipo: "danger" });
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
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
          <div className="d-flex justify-content-center gap-3 mt-4">
            <div
              className="card p-3 text-center "
              style={{ width: "200px", cursor: "pointer", transition: "background-color 0.3s ease-in-out", marginBottom: "20px" }}
              onClick={() => setShowCadastroEmpresa(true)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
            >
              <i className="bi bi-plus-circle fs-1"></i>
              <h5 className="mt-2">Cadastrar Empresa</h5>
            </div>

            <div
              className="card p-3 text-center"
              style={{ width: "200px", cursor: "pointer", transition: "background-color 0.3s ease-in-out", marginBottom: "20px" }}
              onClick={() => setShowEscolherCliente(true)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
            >
              <i className="bi bi-person-check fs-1"></i>
              <h5 className="mt-2">Escolher Empresa para a venda</h5>
            </div>

          </div>

          {clienteSelecionado && (
            <>
              <hr className="my-4" />

              <h4 className="text-center mb-3">Upload de planilha contendo dados</h4>
              <div className="w-75 mx-auto">
                <div className="mb-3">
                  <label className="form-label">Seleciona uma planilha em formato .csv ou .xlxs contendo dados das vidas a serem adicionadas:</label>
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
                    onChange={handleChange}
                  />
                </Col>
                <Col>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Data de Nascimento"
                    name="nascimento"
                    value={novaPessoa.nascimento}
                    onChange={handleChange}
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

              </div>
            </>
          )}
          {pessoas.length > 0 && (
            <>
              <h4 className="text-center mt-4">Lista de Pessoas Adicionadas</h4>
              <Table striped bordered hover responsive className="mt-3">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Data de Nascimento</th>
                    <th>UF</th>
                    <th>Gênero</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pessoas.map((pessoa, index) => (
                    <tr key={index}>
                      <td>{pessoa.nome}</td>
                      <td>{pessoa.cpf}</td>
                      <td>{pessoa.nascimento}</td>
                      <td>{pessoa.uf}</td>
                      <td>{pessoa.genero}</td>
                      <td>
                        <Button variant="danger" size="sm" onClick={() => handleRemovePessoa(index)}>
                          Remover
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Botão de Enviar Dados Centralizado */}
              <div className="d-flex justify-content-center mt-4">
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

          <EscolherClientePopup
            show={showEscolherCliente}
            onClose={() => setShowEscolherCliente(false)}
            empresas={empresas}
            onSelect={(id) => setClienteSelecionado(id)}
          />


        </div>
      </div>
    </>
  );
}