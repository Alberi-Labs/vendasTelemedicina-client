import React from 'react';
import Link from "next/link";

export default function FooterBar() {
  return (
    <footer
      style={{
        backgroundColor: "white",
        padding: "20px 0",
        textAlign: "center",
        marginTop: "20px",
        position: "relative",
        bottom: "0",
        width: "100vw",
        boxShadow: "0 0 4px 6px rgba(0, 0, 0, 0.1)",
        marginLeft: "-20px"
      }}
    >
      <p className="mb-2">
        <Link href="/politica-privacidade" passHref>
          <span style={{ marginRight: "15px", color: "#9453a2", textDecoration: "none", cursor: "pointer" }}>
            Política de Privacidade
          </span>
        </Link>
        |
        <Link href="/termos-uso" passHref>
          <span style={{ marginLeft: "15px", color: "#9453a2", textDecoration: "none", cursor: "pointer" }}>
            Termos de Uso
          </span>
        </Link>
      </p>
      <p style={{ color: "#666" }}>Desenvolvido por Extra Software para a modernização da saúde municipal.</p>
    </footer>
  );
}
