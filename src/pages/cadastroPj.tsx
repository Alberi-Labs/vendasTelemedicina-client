import { useState, useEffect } from "react";
import { Button, Table, Row, Col } from "react-bootstrap";
import ConferenciaPopup from "../components/conferencia/ConferenciaPopup";

export default function CadastroPj() {
  const [file, setFile] = useState<File | null>(null);
  const [pessoas, setPessoas] = useState<{ nome: string; cpf: string; nascimento: string; uf: string; genero: string }[]>([]);
  const [novaPessoa, setNovaPessoa] = useState({ nome: "", cpf: "", nascimento: "", uf: "", genero: "" });
  const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  // Buscar estados do Brasil pela API do IBGE
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then((res) => res.json())
      .then((data) => {
        setEstados(data.map((estado: any) => ({ sigla: estado.sigla, nome: estado.nome })));
      });
  }, []);

  // Formatação do CPF
  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // Formatação da Data de Nascimento
  const formatDate = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 10);
  };

  // Atualiza os campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (name === "cpf") value = formatCpf(value);
    if (name === "nascimento") value = formatDate(value);
    setNovaPessoa({ ...novaPessoa, [name]: value });
  };

  // Upload de Planilha Simulado
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const fakeData = [
        { nome: "João Silva", cpf: "123.456.789-00", nascimento: "12/05/1985", uf: "SP", genero: "Masculino" },
        { nome: "Maria Souza", cpf: "987.654.321-00", nascimento: "08/10/1990", uf: "RJ", genero: "Feminino" },
        { nome: "Carlos Oliveira", cpf: "852.741.963-02", nascimento: "27/09/2003", uf: "MG", genero: "Masculino" },
        { nome: "Ana Lima", cpf: "369.258.147-07", nascimento: "14/02/1991", uf: "BA", genero: "Feminino" },
        { nome: "Pedro Santos", cpf: "456.123.789-03", nascimento: "30/06/1985", uf: "RS", genero: "Masculino" },    
      ];
      setPessoas(fakeData);
      setShowPopup(true);
    }
  };

  // Adiciona pessoa manualmente
  const handleAddPessoa = () => {
    if (novaPessoa.nome && novaPessoa.cpf && novaPessoa.nascimento && novaPessoa.uf && novaPessoa.genero) {
      setPessoas([...pessoas, novaPessoa]);
      setNovaPessoa({ nome: "", cpf: "", nascimento: "", uf: "", genero: "" });
    } else {
      alert("Preencha todos os campos antes de adicionar!");
    }
  };

  // Exibir popup antes da confirmação
  const handleEnviarDados = () => {
    if (pessoas.length > 0) {
      setShowPopup(true);
    } else {
      alert("Nenhuma pessoa adicionada!");
    }
  };

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="p-4 rounded shadow-lg" style={{ backgroundColor: "#FFF", width: "75%" }}>
        <h2 className="text-center mb-4">Venda Empresarial</h2>
        <p className="text-center">Realize a venda empresarial preenchendo a planilha ou inserindo manualmente.</p>

        {/* Upload de Planilha */}
        <div className="w-75 mx-auto">
          <div className="mb-3">
            <label className="form-label">Upload de Planilha</label>
            <input type="file" className="form-control" accept=".csv, .xlsx" onChange={handleFileUpload} />
          </div>
          {file && (
            <Button variant="primary" className="w-100" onClick={() => setShowPopup(true)}>
              Enviar Planilha
            </Button>
          )}
        </div>

        <hr className="my-4" />

        {/* Adicionar Pessoa Manualmente */}
        <h4 className="text-center mb-3">Adicionar Pessoa Manualmente</h4>
        <Row className="align-items-center g-2">
          <Col>
            <input type="text" className="form-control" placeholder="Nome" name="nome" value={novaPessoa.nome} onChange={handleChange} />
          </Col>
          <Col>
            <input type="text" className="form-control" placeholder="CPF" name="cpf" value={novaPessoa.cpf} onChange={handleChange} maxLength={14} />
          </Col>
          <Col>
            <input type="text" className="form-control" placeholder="Data de Nascimento" name="nascimento" value={novaPessoa.nascimento} onChange={handleChange} maxLength={10} />
          </Col>
          <Col>
            <select className="form-control" name="uf" value={novaPessoa.uf} onChange={handleChange}>
              <option value="">UF</option>
              {estados.map((estado) => (
                <option key={estado.sigla} value={estado.sigla}>
                  {estado.nome}
                </option>
              ))}
            </select>
          </Col>
          <Col>
            <select className="form-control" name="genero" value={novaPessoa.genero} onChange={handleChange}>
              <option value="">Gênero</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outro">Outro</option>
            </select>
          </Col>
          <Col xs="auto">
            <Button variant="success" onClick={handleAddPessoa}>
              <i className="bi bi-plus-circle"></i>
            </Button>
          </Col>
        </Row>

        {/* Lista de Pessoas Adicionadas */}
        {pessoas.length > 0 && (
          <>
            <h5 className="text-center mt-4">Pessoas Adicionadas</h5>
            <div className="p-3 mt-3 rounded shadow-sm" style={{ backgroundColor: "#FFF" }}>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Data de Nascimento</th>
                    <th>UF</th>
                    <th>Gênero</th>
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
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}

        <div className="text-center mt-4">
          <Button variant="success" className="w-50" onClick={handleEnviarDados}>
            Enviar Dados
          </Button>
        </div>
      </div>

      {/* Popup de Conferência */}
      <ConferenciaPopup show={showPopup} onHide={() => setShowPopup(false)} pessoas={pessoas} onConfirm={() => alert("Venda Confirmada!")} />
    </div>
  );
}
