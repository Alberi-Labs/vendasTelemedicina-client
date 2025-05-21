import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth, User } from "@/app/context/AuthContext";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import Loading from "@/components/loading/loading";

export default function LoginForm() {
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
    console.log("nome",nomeNormalizado)

    if (nomeNormalizado.includes("vita")) return "/uploads/vita.png";
    if (nomeNormalizado.includes("clinica abc")) return "/uploads/clinicaabc.png";
    if (nomeNormalizado.includes("medic center")) return "/uploads/mediccenter.png";

    return null; // fallback se não encontrar
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
    // Remove tudo o que não for número
    const numeros = data.replace(/\D/g, "");

    // Restringe para 8 caracteres no máximo
    const dataFormatada = numeros
      .slice(0, 8) // Limita o tamanho da string para 8 caracteres
      .replace(/(\d{2})(\d)/, "$1/$2") // Adiciona "/" após os dois primeiros dígitos (dia)
      .replace(/(\d{2})(\d{1,2})$/, "$1/$2"); // Adiciona a barra entre mês e ano (ex: 14/12/2003)

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
    const senhaFormatada = formatarData(dataNascimento); // Formata a data visualmente

    const payload = { cpf: cpfFormatado, dataNascimento: dataNascimento }; // A data enviada deve ser sem formatação

    try {
      const res = await fetch(rota, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.usuario?.dsc_instituicao) {
        localStorage.setItem("nome_empresa", data.usuario.instituicao.nomeInstituicao);
        const imagem = mapearImagemEmpresa(data.usuario.instituicao.nomeInstituicao);
        localStorage.setItem("imagem_empresa", imagem || "")
      }

      const clienteRaw = data.find((c: any) =>
        c.data_contrato_vigencia_inicio ||
        c.data_contrato_vigencia_final ||
        c.num_contrato_retorno_apolice ||
        c.num_contrato_retorno_certificado ||
        c.cod_contrato_retorno_operacao
      ) || data[0];

      if (!clienteRaw) throw new Error("Cliente não encontrado na resposta da API.");

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
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
      setLoading(false);
    }
  };

  return (
<div
  className="container d-flex justify-content-center align-items-center vh-100"
>
      <div className="row shadow rounded overflow-hidden" style={{ width: "1100px", height: "600px", background: "white" }}>
        <div
          className="col-md-7 d-none d-md-block p-0"
          style={{
            backgroundImage: `url('${imagemFundo}')`,
            backgroundPosition: "center",
            backgroundSize: "80%",
            backgroundRepeat: "no-repeat",
            backgroundColor: currentDomain === "vitaclinica.saudeecor.com" ? "rgb(22, 22, 33)" : "white",

          }}
        ></div>

        <div className="col-md-5 p-4 d-flex flex-column justify-content-center" style={{ minHeight: "100%" }}>
          {error && <AvisoAlerta mensagem={error} tipo="danger" />}

          {/* Título de boas-vindas */}
          <h2 className="mb-4">Bem-vindo à área do cliente</h2>

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="cpf" className="form-label">CPF</label>
              <input
                type="text"
                id="cpf"
                className="form-control"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
                placeholder="Digite seu CPF"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="dataNascimento" className="form-label">Data de Nascimento</label>
              <input
                type="text"
                id="dataNascimento"
                className="form-control"
                value={dataNascimento}
                onChange={handleDataNascimentoChange}
                required
                placeholder="Digite sua data de nascimento (DD/MM/YYYY)"
                maxLength={10} // Limita a entrada a 10 caracteres (DD/MM/YYYY)
              />
            </div>

            <button
              type="submit"
              className="btn w-100 text-white"
              style={{
                backgroundColor: "rgb(181, 205, 0)",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(150, 180, 0)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
              disabled={loading}
            >
              {loading ? <Loading /> : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}