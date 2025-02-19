import { useState, useEffect } from "react";

export default function CadastroPf() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    celular: "",
    nascimento: "",
    cep: "",
    endereco: "",
    casa: "",
    sexo: "",
    uf: "",
    cidade: "",
  });

  const [erros, setErros] = useState<{ [key: string]: string }>({});
  const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then((res) => res.json())
      .then((data) => {
        setEstados(data.map((estado: any) => ({ sigla: estado.sigla, nome: estado.nome })));
      });
  }, []);

  useEffect(() => {
    if (formData.uf) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.uf}/municipios`)
        .then((res) => res.json())
        .then((data) => setCidades(data.map((cidade: any) => cidade.nome)));
    }
  }, [formData.uf]);

  useEffect(() => {
    if (/^\d{5}-\d{3}$/.test(formData.cep)) {
      fetch(`https://viacep.com.br/ws/${formData.cep.replace("-", "")}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            setFormData((prev) => ({
              ...prev,
              endereco: data.logradouro,
              uf: data.uf,
              cidade: data.localidade,
            }));
            setErros((prev) => ({ ...prev, cep: "" }));
          } else {
            setErros((prev) => ({ ...prev, cep: "CEP inválido!" }));
          }
        })
        .catch(() => setErros((prev) => ({ ...prev, cep: "Erro ao buscar CEP" })));
    } else {
      setFormData((prev) => ({ ...prev, endereco: "", uf: "", cidade: "" }));
    }
  }, [formData.cep]);

  const handleChangeFormat = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, uf: e.target.value, cidade: "" });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar dados");
      }

      alert("Cadastro realizado com sucesso!");
    } catch (error) {
      alert("Erro ao enviar os dados. Tente novamente.");
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="p-4 rounded shadow-lg" style={{ backgroundColor: "#FFF", width: "50%" }}>
        <h2 className="text-center mb-4">Venda Individual</h2>
        <p className="text-center">Por favor, preencha os dados do cliente para prosseguir com a venda individual.</p>
        <form onSubmit={handleSubmit}>
          {[
            { label: "Nome", name: "nome", type: "text" },
            { label: "E-mail", name: "email", type: "email" },
            { label: "CPF", name: "cpf", type: "text" },
            { label: "Celular", name: "celular", type: "text", placeholder: "(61) 99651-2722" },
            { label: "Data de nascimento", name: "nascimento", type: "text", placeholder: "14/12/2003" },
            { label: "CEP", name: "cep", type: "text" },
            { label: "Endereço", name: "endereco", type: "text", disabled: true },
            { label: "Casa", name: "casa", type: "text", placeholder: "Número da casa" },
          ].map(({ label, name, type, placeholder, disabled }) => (
            <div className="mb-3" key={name}>
              <label className="form-label">{label}</label>
              <input
                type={type}
                className="form-control"
                name={name}
                value={formData[name as keyof typeof formData]}
                onChange={handleChangeFormat}
                placeholder={placeholder}
                disabled={disabled}
                required
              />
            </div>
          ))}
          
          <div className="mb-3">
            <label className="form-label">UF</label>
            <select className="form-control" name="uf" value={formData.uf} onChange={handleUfChange} required>
              <option value="">-- Selecione --</option>
              {estados.map((estado) => (
                <option key={estado.sigla} value={estado.sigla}>{estado.nome}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Cidade</label>
            <select className="form-control" name="cidade" value={formData.cidade} onChange={handleChangeFormat} required>
              <option value="">-- Selecione --</option>
              {cidades.map((cidade) => (
                <option key={cidade} value={cidade}>{cidade}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Gênero</label>
            <select className="form-control" name="sexo" value={formData.sexo} onChange={handleChangeFormat} required>
              <option value="">-- Selecione --</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <button type="submit" className="btn w-100" style={{ backgroundColor: "rgb(181, 205, 0)" }}>
            Registrar e Prosseguir para pagamento
          </button>
        </form>
      </div>
    </div>
  );
}
