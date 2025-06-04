"use client";

import { useRouter } from "next/router";

export default function LoginForm() {
  const router = useRouter();

  const redirecionar = (tipo: "cliente" | "funcionario") => {
    router.push(tipo === "cliente" ? "/loginCliente" : "/loginFuncionario");
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        padding: "1rem"
      }}
    >
      <div
        className="shadow-lg p-4"
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          maxWidth: "360px",
          width: "100%",
          textAlign: "center"
        }}
      >
        <div className="mb-3">
          <i className="bi bi-box-arrow-in-right" style={{ fontSize: "2rem", color: "#2563eb" }}></i>
        </div>
                <h2 className="fw-bold mb-5">Bem vindo(a)</h2>

        <h4 className="fw-bold mb-2">Escolha o tipo de acesso</h4>
        <p className="text-muted mb-4">Selecione como você gostaria de prosseguir.</p>

        <button
          className="btn btn-primary w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
          style={{ borderRadius: "8px", height: "45px" }}
          onClick={() => redirecionar("cliente")}
        >
          <i className="bi bi-person-fill"></i> Cliente
        </button>

        <button
          className="btn btn-secondary w-100 d-flex align-items-center justify-content-center gap-2"
          style={{ borderRadius: "8px", height: "45px", backgroundColor: "#4b5563", border: "none" }}
          onClick={() => redirecionar("funcionario")}
        >
          <i className="bi bi-briefcase-fill"></i> Colaborador
        </button>

        <a href="#" className="d-block mt-4 small" style={{ color: "#2563eb" }}>
          Precisa de ajuda?
        </a>
      </div>
    </div>
  );
}
