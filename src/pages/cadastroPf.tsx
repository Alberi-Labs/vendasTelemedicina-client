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
    if (formData.cep.length === 9) {
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
        });
    }
  }, [formData.cep]);

  const validateField = (name: string, value: string) => {
    let error = "";

    if (name === "cpf" && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value)) error = "CPF inválido!";
    if (name === "nascimento" && !/^\d{2}\/\d{2}\/\d{4}$/.test(value)) error = "Data inválida!";
    if (name === "cep" && !/^\d{5}-\d{3}$/.test(value)) error = "CEP inválido!";
    if (name === "email" && !/\S+@\S+\.\S+/.test(value)) error = "E-mail inválido!";
    if (name === "celular" && !/^\(\d{2}\)\d{5}-\d{4}$/.test(value)) error = "Telefone inválido!";
    
    setErros((prev) => ({ ...prev, [name]: error }));
  };

  const formatInput = (name: string, value: string) => {
    if (name === "cpf") return value.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (name === "cep") return value.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2");
    if (name === "email") return value.toLowerCase();
    if (name === "nascimento") return value.replace(/\D/g, "").replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
    if (name === "celular") return value.replace(/\D/g, "").replace(/(\d{2})(\d{5})(\d{4})/, "($1)$2-$3");
    return value;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatInput(name, value);
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    validateField(name, formattedValue);
  };

  const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, uf: e.target.value, cidade: "" });
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="p-4 rounded shadow-lg" style={{ backgroundColor: "#FFF", width: "50%" }}>
        <h2 className="text-center mb-4">Venda Individual</h2>
        <p className="text-center">Por favor, preencha os dados do cliente para prosseguir com a venda individual.</p>
        <form>
          {[
            { label: "Nome", name: "nome", type: "text" },
            { label: "E-mail", name: "email", type: "email" },
            { label: "CPF", name: "cpf", type: "text" },
            { label: "Celular", name: "celular", type: "text", placeholder: "(61)99651-2722" },
            { label: "Data de nascimento", name: "nascimento", type: "text", placeholder: "14/12/2003" },
            { label: "CEP", name: "cep", type: "text" },
            { label: "Endereço", name: "endereco", type: "text", disabled: true },
            { label: "Casa", name: "casa", type: "text", placeholder: "Número da casa" },
          ].map(({ label, name, type, placeholder, disabled }) => (
            <div className="mb-3" key={name}>
              {erros[name] && <div className="text-danger mb-1">{erros[name]}</div>}
              <label className="form-label">{label}</label>
              <input
                type={type}
                className={`form-control ${erros[name] ? "is-invalid" : ""}`}
                name={name}
                value={formData[name as keyof typeof formData]}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                required
              />
            </div>
          ))}

          <div className="mb-3">
            <label className="form-label">Sexo</label>
            <select className="form-control" name="sexo" value={formData.sexo} onChange={handleChange} required>
              <option value="">-- Selecione --</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">UF</label>
            <select className="form-control" name="uf" value={formData.uf} onChange={handleUfChange} required>
              <option value="">-- Selecione --</option>
              {estados.map((estado) => (
                <option key={estado.sigla} value={estado.sigla}>
                  {estado.nome}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn w-100" style={{ backgroundColor: "rgb(181, 205, 0)" }}>Registrar e Prosseguir para pagamento</button>
        </form>
      </div>
    </div>
  );
}
