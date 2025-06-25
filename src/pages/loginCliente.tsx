import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth, User } from "@/app/context/AuthContext";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import Loading from "@/components/loading/loading";

export default function LoginCliente() {
  const router = useRouter();
  const { login } = useAuth();
  const currentDomain = typeof window !== "undefined" ? window.location.hostname : "";
  console.log("currentDomain", currentDomain)
  const imagemFundo = currentDomain === "vitaclinica.saudeecor.com"
    ? "/uploads/vita.png"
    : "/image.png";

  const mapearImagemEmpresa = (nome: string): string | null => {
    console.log("nome", nome)
    const nomeNormalizado = nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    console.log("nome", nomeNormalizado)

    if (nomeNormalizado.includes("vita")) return "/vita.png";
    if (nomeNormalizado.includes("clinica abc")) return "/uploads/clinicaabc.png";
    if (nomeNormalizado.includes("medic center")) return "/uploads/mediccenter.png";

    return null;
  };

  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const formatarDataNascimento = (data: string) => {
    return data.replace(/^(\d{2})(\d{2})(\d{4})$/, "$1/$2/$3");
  };

  const handleDataNascimentoChange = (e: { target: { value: any; }; }) => {
    const valor = e.target.value;
    const formatado = formatarDataNascimento(valor);
    setDataNascimento(formatado);
  };

  const formatarData = (data: string) => {
    const numeros = data.replace(/\D/g, "");

    const dataFormatada = numeros
      .slice(0, 8) 
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d{1,2})$/, "$1/$2"); 

    return dataFormatada;
  };



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const rota = "/api/clienteSaudeecor/buscarDados";

    const formatarCpf = (cpf: string) => {
      return cpf.replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    };

    const cpfFormatado = formatarCpf(cpf);
    const senhaFormatada = formatarData(dataNascimento); // apenas visual
    const payload = { cpf: cpfFormatado, dataNascimento };

    try {
      const res = await fetch(rota, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const erroMensagem = data?.message || data?.error || "Erro inesperado.";
        throw new Error(erroMensagem);
      }

      // Verifica se a resposta é um array (CNPJ) ou objeto (CPF)
      const clienteRaw = Array.isArray(data)
        ? data.find((c: any) =>
          c.data_contrato_vigencia_inicio ||
          c.data_contrato_vigencia_final ||
          c.num_contrato_retorno_apolice ||
          c.num_contrato_retorno_certificado ||
          c.cod_contrato_retorno_operacao
        ) || data[0]
        : data;

      if (!clienteRaw) throw new Error("Cliente não encontrado na resposta da API.");

      if (clienteRaw.dsc_instituicao) {
        localStorage.setItem("nome_empresa", clienteRaw.dsc_instituicao);
        const imagem = mapearImagemEmpresa(clienteRaw.dsc_instituicao);
        localStorage.setItem("imagem_empresa", imagem || "");
      }

      localStorage.setItem("cliente", JSON.stringify(clienteRaw));

      const clienteData: User = {
        id: clienteRaw.seq_cliente,
        nome: clienteRaw.nom_cliente,
        role: ["EMPRESA", "IMPORTACAO"].includes(clienteRaw.tip_pagamento) ? "clientePJ" : "cliente",
        cpf: cpf,
        saude_cor: true,
        dt_nascimento: dataNascimento,
        dsc_instituicao: clienteRaw.dsc_instituicao,
        tip_pagamento: clienteRaw.tip_pagamento,
        data_contrato_vigencia_inicio: clienteRaw.dat_contrato_vigencia_inicio,
        data_contrato_vigencia_final: clienteRaw.dat_contrato_vigencia_final,
        num_contrato_retorno_apolice: clienteRaw.num_contrato_retorno_apolice,
        num_contrato_retorno_certificado: clienteRaw.num_contrato_retorno_certificado,
        cod_contrato_retorno_operacao: clienteRaw.cod_contrato_retorno_operacao,
        dsc_email: clienteRaw.dsc_email,
        num_celular: clienteRaw.num_celular,
        cobrancas: clienteRaw.cobranca ?? [],
      };

      login(clienteData, true);

      setTimeout(() => {
        router.push("/paginaInicial");
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
      setError(msg);
      setLoading(false);
    }
  };


  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        padding: "1rem",

      }}
    >
      <div
        className="row shadow-lg rounded overflow-hidden w-100 mx-3 mx-md-0"
        style={{
          maxWidth: "960px",
          backgroundColor: "white",
          borderRadius: "12px",
          minHeight: "660px",
        }}
      >


        {/* Lado da imagem */}
        <div
          className="col-md-6 d-none d-md-block p-0"
          style={{
            backgroundImage: `url('${imagemFundo}')`,
            backgroundColor: currentDomain === "vitaclinica.saudeecor.com" ? "rgb(22, 22, 33)" : "white",
            backgroundSize: "80%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        ></div>

        {/* Lado do formulário */}
        <div
          className="col-md-6 p-5 d-flex flex-column justify-content-center"
          style={{ minHeight: "100%" }}
        >
          <div className="mb-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-link text-primary text-decoration-none d-flex align-items-center gap-1 p-0"
            >
              <i className="bi bi-arrow-left"></i>
              Voltar
            </button>
          </div>

          {error && <AvisoAlerta mensagem={error} tipo="danger" />}

          <div className="text-center mb-3">
            <i className="bi bi-person-circle" style={{ fontSize: "2rem", color: "#2563eb" }}></i>
          </div>

          <h4 className="fw-bold text-center mb-2">Bem-vindo à área do cliente</h4>
          <p className="text-muted text-center mb-4">Acesse sua conta para continuar.</p>

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Digite seu CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="DD/MM/YYYY"
                value={dataNascimento}
                onChange={handleDataNascimentoChange}
                required
                maxLength={10}
              />
            </div>

            <button
              type="submit"
              className="btn w-100 d-flex justify-content-center align-items-center gap-2 text-white"
              style={{
                backgroundColor: "#8dc63f", // verde parecido
                height: "45px",
                fontWeight: 500,
                borderRadius: "8px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#79b92f")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8dc63f")}
              disabled={loading}
            >
              <i className="bi bi-box-arrow-in-right"></i>
              {loading ? <Loading /> : "Entrar"}
            </button>
          </form>

          <div className="text-center mt-4">
            <a href="#" className="me-3 small text-primary text-decoration-none">
              <i className="bi bi-question-circle me-1"></i>Precisa de ajuda?
            </a>

          </div>
        </div>
      </div>
    </div>
  );

}