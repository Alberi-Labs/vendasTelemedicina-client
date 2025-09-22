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
        background: "#0f172a",
        padding: "1rem"
      }}
    >
      <div
        className="shadow p-4"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          border: "1px solid #e2e8f0"
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg,#2563eb,#3b82f6)",
            height: 5,
            borderRadius: 4,
            marginBottom: 24,
          }}
        />
        <div className="mb-3">
          <i className="bi bi-box-arrow-in-right" style={{ fontSize: "2rem", color: "#2563eb" }}></i>
        </div>
        <h2 className="fw-bold mb-2" style={{ fontSize: "1.75rem" }}>Bem-vindo(a)</h2>
        <p className="text-muted mb-4" style={{ fontSize: ".9rem" }}>Escolha como deseja continuar:</p>

        <div className="d-grid gap-3 mb-3">
          <button
            className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
            style={{ borderRadius: "10px", height: "48px", fontWeight: 600 }}
            onClick={() => redirecionar("cliente")}
          >
            <i className="bi bi-person-fill" /> Cliente
          </button>
          <button
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
            style={{ borderRadius: "10px", height: "48px", fontWeight: 600 }}
            onClick={() => redirecionar("funcionario")}
          >
            <i className="bi bi-briefcase-fill" /> Colaborador
          </button>
        </div>

        <div style={{ fontSize: ".7rem", color: "#64748b" }}>v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</div>
        <a href="#" className="d-block mt-3 small" style={{ color: "#2563eb" }}>
          Precisa de ajuda?
        </a>
      </div>
    </div>
  );
}
