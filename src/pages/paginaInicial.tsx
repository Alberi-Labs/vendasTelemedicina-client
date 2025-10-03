import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Loading from "@/components/loading/loading"; // Importando o componente de loading
import { useAuth } from "@/app/context/AuthContext";
import { homepageModules } from "@/config/modulesConfig";

export default function PaginaInicial() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);  // Estado para controlar o loading
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleNavigation = (item: { path?: string; href?: string }) => {
    setLoading(true);
    if (item.href) {
      window.open(item.href, "_blank");
      setLoading(false);
    } else if (item.path) {
      router.push(item.path);
      setLoading(false);
    }
  };

  const visibleModules = homepageModules(user?.perfil).filter(m => m.path || m.href);

  return (
  <div
    className="container text-center d-flex flex-column justify-content-center min-vh-100"
    
  >
      {loading && (
        <div
          className=" position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
        >
          <Loading />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >

        {(user?.perfil === "cliente" || user?.perfil === "clientePJ") ? (
          <motion.div
            className="d-flex align-items-start gap-3 p-4 shadow-sm rounded-3 mx-auto mt-4"
            style={{
              background: "#f9f9f9",
              borderLeft: "6px solid #0d6efd",
              maxWidth: "680px",
              textAlign: "left",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <i className="bi bi-info-circle-fill fs-3 text-primary mt-1"></i>
            <div>
              <h5 className="fw-bold mb-2">Informações importantes</h5>
              <ul className="mb-2">
                <li>
                  <strong>Assistência Funeral / Seguro de Acidentes Pessoais:</strong> Ligue para o número informado no seu guia do usuário.
                </li>
                <li>
                  <strong>Suporte ao cliente:</strong>{" "}
                  <a href="https://wa.me/5561996363963" target="_blank" rel="noreferrer">
                    (61) 99636-3963
                  </a>{" "}
                  — disponível via WhatsApp ou ligação.
                </li>
                <li>
                  <strong>Atendimento:</strong> Segunda a sexta, das 8h às 18h.
                </li>
              </ul>
              <p className="mb-0">
                Em caso de dúvidas, acesse a aba <strong>“Suporte e Ajuda”</strong> abaixo.
              </p>
            </div>
          </motion.div>
        ) : null}

      </motion.div>

      <div className="d-flex flex-wrap justify-content-center gap-4 mt-4">
        {visibleModules.map((item, index) => (
          <motion.div
            key={item.key}
            className="card p-4 text-center shadow-lg border-0"
            style={{
              width: "250px",
              cursor: "pointer",
              borderRadius: "12px",
              backgroundColor: "#f8f9fa",
              transition: "transform 0.2s, background-color 0.2s",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            onClick={() => handleNavigation({ path: item.path, href: item.href })}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e9ecef";
              e.currentTarget.style.transform = "scale(1.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
              e.currentTarget.style.transform = "scale(1)";
            }}

          >
            <i
              className={`bi ${item.icon} fs-1 mb-2`}
              style={{
                color:
                  item.label === "Cancelamento"
                    ? "#dc3545" // vermelho
                    : item.label === "Suporte e Ajuda"
                      ? "#ffc107" // amarelo
                      : "#0d6efd" // padrão azul
              }}
            ></i>
            <h6 className="fw-semibold" style={{ fontSize: "16px" }}>{item.label}</h6>
            <p className="text-sm text-slate-500">{item.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.button
        className="btn btn-warning position-fixed bottom-0 end-0 mb-4 me-4 shadow-lg"
        style={{ borderRadius: "50px", padding: "10px 20px" }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <i className="bi bi-chat-dots me-2"></i> Suporte
      </motion.button>
    </div>
  );

}
