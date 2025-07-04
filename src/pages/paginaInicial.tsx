import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Loading from "@/components/loading/loading"; // Importando o componente de loading
import { useAuth } from "@/app/context/AuthContext";

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

  const cards = [
    {
      path: "/paginaCadastroPf",
      icon: "bi-person",
      text: "Venda de Consulta",
      allowedRoles: ["admin", "vendedorFarmacia", "gerente"],
      description: "Cadastre clientes e realize vendas de consultas avulsas."
    },
    {
      path: "/paginaVendaPj",
      icon: "bi-briefcase",
      text: "Venda Empresarial",
      allowedRoles: ["admin", "vendedor", "gerente"],
      description: "Gerencie vendas de planos para empresas com CNPJ."
    },
    {
      path: "/paginaVendaPf",
      icon: "bi-cash-coin",
      text: "Venda Plano Telemedicina",
      allowedRoles: ["admin", "vendedor", "gerente"],
      description: "Venda planos mensais com acesso à telemedicina."
    },
    {
      path: "/paginaRelatorioVendas",
      icon: "bi-file-earmark-bar-graph",
      text: "Relatório de Vendas",
      allowedRoles: ["admin", "gerente"],
      description: "Acompanhe os resultados das vendas por período e vendedor."
    },
    {
      path: "/paginaGestaoClientes",
      icon: "bi-people",
      text: "Gestão de Clientes",
      allowedRoles: ["admin", "vendedor", "gerente"],
      description: "Visualize, edite ou remova dados de clientes cadastrados."
    },
    {
      path: "/paginaTelemedicina",
      icon: "bi-clipboard-heart",
      text: "Consultar com médico online",
      allowedRoles: ["admin", "cliente", "clientePJ", "gerente"],
      description: "Acesse consultas online com médicos da plataforma."
    },
    {
      path: "/paginaApolice",
      icon: "bi-download",
      text: "Baixar Apólice/Guia Explicativo",
      allowedRoles: ["admin", "cliente", "clientePJ"],
      description: "Faça o download da sua apólice ou do guia do usuário."
    },
    {
      path: "/paginaControleDependentes",
      icon: "bi-people-fill",
      text: "Controle de Dependentes",
      allowedRoles: ["admin", "clientePJ", "cliente"],
      description: "Adicione e edite dependentes vinculados ao seu plano."
    },
    {
      path: "/paginaControlePagamento",
      icon: "bi-credit-card",
      text: "Controle de Pagamento",
      allowedRoles: ["admin", "gerente", "cliente"],
      description: "Visualize boletos, comprovantes e status de pagamentos."
    },
    {
      path: "/paginaCancelamento",
      icon: "bi-x-circle",
      text: "Cancelamento",
      allowedRoles: ["admin", "gerente", "cliente"],
      description: "Solicite o cancelamento do plano ou serviço contratado."
    },
    {
      path: "/paginaGestaoUsuarios",
      icon: "bi-person-gear",
      text: "Gestão de Usuários",
      allowedRoles: ["admin"],
      description: "Gerencie permissões e dados dos usuários do sistema."
    },
    {
      path: "/paginaDashboardFinanceiro",
      icon: "bi-bar-chart-line",
      text: "Dashboard Financeiro",
      allowedRoles: ["admin", "gerente"],
      description: "Visualize gráficos e indicadores financeiros atualizados."
    },
    {
      path: "/paginaGestaoEmpresas",
      icon: "bi-buildings",
      text: "Página Gestão de Empresas",
      allowedRoles: ["admin"],
      description: "Gerencie dados das empresas clientes com CNPJ."
    },
    {
      path: "/relatorioAsass",
      icon: "bi-file-earmark-medical",
      text: "Gestão de Pagamento Asaas",
      allowedRoles: ["admin"],
      description: "Visualize e sincronize pagamentos via plataforma Asaas."
    },
        {
      path: "/crmVendas",
      icon: "bi-file-earmark-medical",
      text: "CRM de Vendas",
      allowedRoles: ["vendedor", "gerente", "admin"],
      description: "Vizualize os dados de suas vendas."
    },
    {
      href: "https://wa.me/5561996364787",
      icon: "bi-question-circle",
      text: "Suporte e Ajuda",
      allowedRoles: ["admin", "cliente", "clientePJ", "vendedor", "gerente"],
      description: "Fale com nosso suporte via WhatsApp para tirar dúvidas."
    }
  ];


  const visibleCards = cards.filter(card => card.allowedRoles.includes(user?.role || ""));

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
        <h1 className="fw-bold">
          {user?.role === "cliente"
            ? "Olá, seja bem-vindo(a) à área do cliente!"
            : "Olá, seja bem-vindo ao nosso sistema de vendas!"}
        </h1>
        <p className="text-muted">
          {user?.role === "cliente" || user?.role === "clientePJ"
            ? "Aqui você pode realizar consultas, baixar apólices e acessar informações importantes do seu plano."
            : "Aqui você pode gerenciar vendas, clientes e relatórios do sistema."}
        </p>

        {user?.role === "cliente" || user?.role === "clientePJ" ? (
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
                  <a href="https://wa.me/5561996364787" target="_blank" rel="noreferrer">
                    (61) 99636-4787
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
        {visibleCards.map((item, index) => (
          <motion.div
            key={item.path || item.href}
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
            transition={{ duration: 0.5, delay: index * 0.2 }}
            onClick={() => handleNavigation(item)}
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
                  item.text === "Cancelamento"
                    ? "#dc3545" // vermelho
                    : item.text === "Suporte e Ajuda"
                      ? "#ffc107" // amarelo
                      : "#0d6efd" // padrão azul
              }}
            ></i>
            <h6 className="fw-semibold" style={{ fontSize: "16px" }}>{item.text}</h6>
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
