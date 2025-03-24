import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Loading from "@/components/loading/loading";
import { useAuth } from "@/app/context/AuthContext";

export default function PaginaInicial() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleNavigation = (path: string) => {
    setLoading(true);
    router.push(path);
  };

  const cards = [
    { path: "/cadastroPf", icon: "bi-person", text: "Venda Individual", allowedRoles: ["admin", "vendedor", "gerente"] },
    { path: "/relatorioVendas", icon: "bi-file-earmark-bar-graph", text: "Relatório de Vendas", allowedRoles: ["admin", "gerente"] },
    { path: "/gestaoClientes", icon: "bi-people", text: "Gestão de Clientes", allowedRoles: ["admin", "gerente"] },
    { path: "/telemedicina", icon: "bi-clipboard-heart", text: "Consultar com médico online", allowedRoles: ["admin", "cliente", "vendedor", "gerente"] },
    { path: "/paginaApolice", icon: "bi-download", text: "Baixar Apólice", allowedRoles: ["admin", "cliente"] },
    { path: "/paginaControleDependentes", icon: "bi-people-fill", text: "Controle de Dependentes", allowedRoles: ["admin", "cliente"] },
    { path: "/paginaControlePagamento", icon: "bi-credit-card", text: "Controle de Pagamento", allowedRoles: ["admin", "gerente", "vendedor"] },
    { path: "/cancelamento", icon: "bi-x-circle", text: "Cancelamento", allowedRoles: ["admin", "gerente"] },
  ];
  

  const visibleCards = cards.filter(card => card.allowedRoles.includes(user?.role || ""));

  return (
    <div className="container text-center d-flex flex-column justify-content-center min-vh-100">
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}>
          <Loading />
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="fw-bold">Olá, seja bem-vindo ao nosso sistema de vendas!</h1>
        <p className="text-muted">Aqui você pode efetuar vendas, consultar relatórios e configurar o acesso às consultas.</p>
      </motion.div>

      <div className="d-flex flex-wrap justify-content-center gap-4 mt-4">
        {visibleCards.map((item, index) => (
          <motion.div
            key={item.path}
            className="card p-4 text-center shadow-lg border-0"
            style={{ width: "250px", cursor: "pointer" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            onClick={() => handleNavigation(item.path)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <i className={`bi ${item.icon} fs-1`} style={{ color: "#1a1b29" }}></i>
            <h5 className="mt-3">{item.text}</h5>
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
