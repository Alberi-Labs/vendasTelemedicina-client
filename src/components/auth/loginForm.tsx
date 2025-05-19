"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth, User } from "@/app/context/AuthContext";
import Loading from "../loading/loading";
import AvisoAlerta from "../avisoAlerta/avisoAlerta";
import Image from "next/image";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [tipoLogin, setTipoLogin] = useState<"cliente" | "funcionario">("cliente");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagemEmpresa, setImagemEmpresa] = useState<string | null>(null);

  const mapearImagemEmpresa = (nome: string): string | null => {
    const nomeNormalizado = nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    console.log(nomeNormalizado)

    if (nomeNormalizado.includes("vita")) return "/uploads/vita.png";
    if (nomeNormalizado.includes("clinica abc")) return "/uploads/clinicaabc.png";
    if (nomeNormalizado.includes("medic center")) return "/uploads/mediccenter.png";

    return null; // fallback se não encontrar
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const rota = tipoLogin === "cliente" ? "/api/clienteSaudeecor/buscarDados" : "/api/login";

    const formatarCpf = (cpf: string) => {
      return cpf.replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    };

    const cpfFormatado = tipoLogin === "cliente" ? formatarCpf(cpf) : cpf;

    const payload =
      tipoLogin === "cliente"
        ? { cpf: cpfFormatado, dataNascimento: password }
        : { cpf, password };

    try {
      const res = await fetch(rota, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      let nomeEmpresa = "";

      if (data.usuario?.empresa) {
        nomeEmpresa = data.usuario.empresa.nomeEmpresa;
        localStorage.setItem("nome_empresa", nomeEmpresa);
        localStorage.setItem("imagem_empresa", data.usuario.empresa.imagem_perfil);
      }

      if (tipoLogin === "cliente") {
        const clienteRaw = data.find((c: any) =>
          c.data_contrato_vigencia_inicio ||
          c.data_contrato_vigencia_final ||
          c.num_contrato_retorno_apolice ||
          c.num_contrato_retorno_certificado ||
          c.cod_contrato_retorno_operacao
        ) || data[0];

        if (!clienteRaw) throw new Error("Cliente não encontrado na resposta da API.");

        nomeEmpresa = clienteRaw.dsc_instituicao;
        localStorage.setItem("cliente", JSON.stringify(clienteRaw));

        const clienteData: User = {
          id: clienteRaw.seq_cliente,
          nome: clienteRaw.nom_cliente,
          role: ["EMPRESA", "IMPORTACAO"].includes(clienteRaw.tip_pagamento) ? "clientePJ" : "cliente",
          cpf: cpf,
          saude_cor: true,
          dt_nascimento: password,
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
          dsc_link_pagamento: clienteRaw.dsc_link_pagamento,
          ind_status_pagamento: clienteRaw.ind_status_pagamento,
          tip_status_pagamento: clienteRaw.tip_status_pagamento,
        };

        login(clienteData, true);
      }

      if (nomeEmpresa) {
        const imagem = mapearImagemEmpresa(nomeEmpresa);
        setImagemEmpresa(imagem);
        localStorage.setItem("imagem_empresa", imagem || "")
      }

      setTimeout(() => {
        router.push("/paginaInicial");
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="row shadow rounded overflow-hidden" style={{ width: "1000px", height: "600px", background: "white" }}>
        <div className="col-md-6 d-none d-md-block p-0" style={{ background: "url('/image.png') center/cover no-repeat" }}></div>

        <div className="col-md-6 p-4 d-flex flex-column justify-content-center" style={{ minHeight: "100%" }}>
          {error && <AvisoAlerta mensagem={error} tipo="danger" />}

          {imagemEmpresa && (
            <div className="mb-3 text-center">
              <Image
                src={imagemEmpresa}
                alt="Logo da empresa"
                width={180}
                height={80}
                onError={() => setImagemEmpresa(null)}
              />
            </div>
          )}

          <div className="d-flex mb-4">
            <button
              className={`btn flex-fill ${tipoLogin === "cliente" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setTipoLogin("cliente");
                setPassword("");
              }}
            >
              Cliente
            </button>
            <button
              className={`btn flex-fill ms-2 ${tipoLogin === "funcionario" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setTipoLogin("funcionario");
                setPassword("");
              }}
            >
              Funcionário
            </button>
          </div>

          <h2 className="mb-4">Login - {tipoLogin === "cliente" ? "Cliente" : "Funcionário"}</h2>

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
              <label htmlFor="campo2" className="form-label">
                {tipoLogin === "cliente" ? "Data de Nascimento" : "Senha"}
              </label>
              <input
                type={tipoLogin === "cliente" ? "date" : "password"}
                id="campo2"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={tipoLogin === "cliente" ? "Selecione sua data de nascimento" : "Digite sua senha"}
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
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)") }
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
