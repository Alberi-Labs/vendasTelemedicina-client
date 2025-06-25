"use client";

import { useEffect } from "react";

export default function Manutencao() {
  useEffect(() => {
    document.title = "Sistema em Manutenção";
  }, []);

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
        className="shadow-lg p-4"
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          maxWidth: "380px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div className="mb-4">
          <i
            className="bi bi-tools"
            style={{ fontSize: "2.5rem", color: "#f59e0b" }}
          ></i>
        </div>
        <h2 className="fw-bold mb-3">Estamos em manutenção</h2>
        <p className="text-muted mb-4">
          O sistema está temporariamente indisponível para melhorias. Retornaremos em breve!
        </p>
        <div className="mb-2">
          <span className="badge bg-warning text-dark">Status: em atualização</span>
        </div>
        <p className="small text-muted mt-4">
          Se precisar de suporte, fale conosco pelo WhatsApp:
        </p>
        <a
          href="https://wa.me/5561996364787"
          target="_blank"
          rel="noopener noreferrer"
          className="small fw-bold"
          style={{ color: "#2563eb", textDecoration: "none" }}
        >
          (61) 99636-4787
        </a>
      </div>
    </div>
  );
}
