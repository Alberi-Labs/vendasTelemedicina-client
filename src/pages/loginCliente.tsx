import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth, User } from "@/app/context/AuthContext";
import { clientesApi } from "@/lib/api-client";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import Loading from "@/components/loading/loading";

export default function LoginCliente() {
  const router = useRouter();
  const { login } = useAuth();
  const currentDomain = typeof window !== "undefined" ? window.location.hostname : "";
  const imagemFundo = currentDomain === "vitaclinica.saudeecor.com"
    ? "/uploads/vita.png"
    : "/image.png";

  const mapearImagemEmpresa = (nome: string): string | null => {
    const nomeNormalizado = nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

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
  // Nova API do backend
  const resp = await clientesApi.buscarDadosSaudeECor(payload.cpf);
  const data = resp?.data ?? resp;

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

      // Adiciona a cobrança principal (pagamento inicial) ao array de cobranças, se não estiver presente
      let cobrancas = Array.isArray(clienteRaw.cobranca) ? [...clienteRaw.cobranca] : [];
      // Verifica se já existe cobrança RECEIVED igual ao pagamento inicial
      const temCobrancaInicial = cobrancas.some(
        (c: any) => c.ind_status_pagamento === "RECEIVED" && c.dat_vencimento === clienteRaw.dat_contrato_vigencia_inicio
      );
      if (!temCobrancaInicial && clienteRaw.ind_status_pagamento === "RECEIVED" && clienteRaw.dat_contrato_vigencia_inicio) {
        cobrancas.unshift({
          seq_cobranca: "contrato-inicial",
          dat_vencimento: clienteRaw.dat_contrato_vigencia_inicio,
          vlr_pagamento: clienteRaw.vlr_pagamento || "39,90",
          ind_status_pagamento: "RECEIVED",
          dsc_link_pagamento: clienteRaw.dsc_link_pagamento,
          dsc_instituicao: clienteRaw.dsc_instituicao,
          tip_pagamento: clienteRaw.tip_pagamento,
        });
      }

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
        ind_uf: clienteRaw.ind_uf,
        uf: clienteRaw.uf,
        cidade: clienteRaw.cidade,
        cobrancas,
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
        background: "#0f172a",
        padding: "1rem"
      }}
    >
      <div
        className="shadow p-4 p-md-5 w-100"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          maxWidth: "480px",
          width: "100%",
          border: "1px solid #e2e8f0"
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg,#2563eb,#3b82f6)",
            height: 4,
            borderRadius: 4,
            marginBottom: 24
          }}
        />
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-link text-primary text-decoration-none d-flex align-items-center gap-1 p-0 mb-3"
          style={{ fontSize: ".85rem" }}
        >
          <i className="bi bi-arrow-left"></i>
          Voltar
        </button>

        {error && <AvisoAlerta mensagem={error} tipo="danger" />}

        <div className="text-center mb-3">
          <i className="bi bi-person-circle" style={{ fontSize: "2.2rem", color: "#2563eb" }}></i>
        </div>
        <h4 className="fw-bold text-center mb-2" style={{ fontSize: "1.4rem" }}>Área do Cliente</h4>
        <p className="text-muted text-center mb-4" style={{ fontSize: ".85rem" }}>Informe seus dados para continuar.</p>

        <form onSubmit={handleLogin} noValidate>
          <div className="mb-3">
            <label className="form-label small text-muted">CPF</label>
            <input
              type="text"
              className="form-control"
              placeholder="Digite seu CPF"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
              aria-label="CPF"
            />
          </div>

          <div className="mb-4">
            <label className="form-label small text-muted">Data de Nascimento</label>
            <input
              type="text"
              className="form-control"
              placeholder="DD/MM/AAAA"
              value={dataNascimento}
              onChange={handleDataNascimentoChange}
              required
              maxLength={10}
              aria-label="Data de nascimento"
            />
          </div>

          <button
            type="submit"
            className="btn w-100 d-flex justify-content-center align-items-center gap-2 text-white"
            style={{
              backgroundColor: "#8dc63f",
              height: "46px",
              fontWeight: 600,
              borderRadius: "10px",
              fontSize: ".95rem"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#79b92f")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8dc63f")}
            disabled={loading}
          >
            <i className="bi bi-box-arrow-in-right" />
            {loading ? <Loading /> : "Entrar"}
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="#" className="small text-primary text-decoration-none">
            <i className="bi bi-question-circle me-1"></i>Precisa de ajuda?
          </a>
        </div>
      </div>
    </div>
  );
}