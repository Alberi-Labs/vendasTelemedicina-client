import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Nav } from "react-bootstrap";
import Loading from "../loading/loading";

export default function Sidebar() {
  const router = useRouter();
  const [vendasOpen, setVendasOpen] = useState(false);
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bgColor, setBgColor] = useState("#161621");
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    try {
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        // ✅ Verifica se o objeto contém 'nome' e 'role' corretamente
        if (parsedUser?.nome && parsedUser?.role) {
          setUserName(parsedUser.nome); // 🔹 Corrigido de 'name' para 'nome'
          setUserRole(parsedUser.role);
        } else {
          console.error("Formato inválido para usuário:", parsedUser);
        }
      }
    } catch (error) {
      console.error("Erro ao parsear JSON do usuário:", error);
    }
  }, []);


  console.log("userName:", userName);
  console.log("userRole:", userRole);


  const handleMenuClick = () => {
    setMenuOpen(false);
    setTimeout(() => {
      setBgColor("#edeade");
    }, 300);
  };

  const handleToggleMenu = () => {
    if (!menuOpen) {
      setBgColor("#161621");
    }
    setMenuOpen(!menuOpen);
  };

  const canAccess = {
    vendas: userRole === "admin" || userRole === "vendedor",
    relatorios: userRole === "admin",
    consulta: userRole === "admin" || userRole === "cliente",
    apolice: userRole === "admin" || userRole === "cliente",
    controleDependentes: userRole === "admin" || userRole === "cliente",
    controleDePagamento: userRole === "admin" || userRole === "cliente",
    cancelamento: userRole === "admin" || userRole === "cliente",
    dashboard: userRole === "admin" || userRole === "gerente",
    suporte: true,
  };

  return (
    <>
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
        >
          <Loading />
        </div>
      )}

      <div style={{ display: "flex" }}>
        <div
          style={{
            width: "250px",
            height: "100vh",
            backgroundColor: bgColor,
            padding: "20px",
            boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
            position: "fixed",
            left: menuOpen ? "0" : "-250px",
            top: "0",
            transition: "left 0.3s ease-in-out",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 999,
          }}
        >
          <div>
            <h2
              style={{
                color: "#FFF",
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginBottom: "20px",
                textAlign: "center",
                borderBottom: "2px solid #FFF",
                paddingBottom: "10px",
              }}
            >
              <Link href="/paginaInicial" style={{ textDecoration: "none", color: "#FFF" }} onClick={handleMenuClick}>
                Farmacia
              </Link>
            </h2>
            <Nav className="flex-column">
              {canAccess.vendas && (
                <Nav.Link
                  as={Link}
                  href="/paginaCadastroPf"
                  onClick={handleMenuClick}
                  style={{
                    color: router.pathname === "/paginaCadastroPf" ? "#000" : "#FFF",
                    backgroundColor: router.pathname === "/paginaCadastroPf" ? "#b5cd00" : "transparent",
                    borderRadius: "10px",
                    padding: "10px",
                    transition: "background-color 0.3s ease-in-out",
                    marginBottom: "5px"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/paginaCadastroPf" ? "#b5cd00" : "transparent")}
                >
                  <i className="bi bi-cart me-2"></i>Vendas
                </Nav.Link>
              )}

              {canAccess.relatorios && (
                <>
                  <button
                    className="btn btn-link text-start w-100"
                    onClick={() => setRelatoriosOpen(!relatoriosOpen)}
                    style={{
                      textDecoration: "none",
                      color: "#FFF",
                      backgroundColor: relatoriosOpen ? "#b5cd00" : "transparent",
                      borderRadius: "10px",
                      padding: "10px",
                      transition: "background-color 0.3s ease-in-out",
                      marginBottom: "5px"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/paginaRelatorioVendas" || router.pathname === "/paginaGestaoClientes" ? "#b5cd00" : "transparent")}
                  >
                    <i className="bi bi-clipboard-data me-2"></i>Relatórios e Gestão
                  </button>

                  {relatoriosOpen && (
                    <div className="ps-3">
                      {/* 🔹 Link para Relatório de Vendas */}
                      <Nav.Link
                        as={Link}
                        href="/paginaRelatorioVendas"
                        onClick={handleMenuClick}
                        style={{
                          color: "#FFF",
                          borderRadius: "10px",
                          marginBottom: "5px",
                          backgroundColor: router.pathname === "/paginaRelatorioVendas" ? "#b5cd00" : "transparent"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/paginaRelatorioVendas" ? "#b5cd00" : "transparent")}
                      >
                        <i className="bi bi-file-earmark-bar-graph me-2"></i>Relatório de Vendas
                      </Nav.Link>

                      {/* 🔹 Link para Gestão de Clientes */}
                      <Nav.Link
                        as={Link}
                        href="/paginaGestaoClientes"
                        onClick={handleMenuClick}
                        style={{
                          color: "#FFF",
                          borderRadius: "10px",
                          marginBottom: "5px",
                          backgroundColor: router.pathname === "/paginaGestaoClientes" ? "#b5cd00" : "transparent"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/paginaGestaoClientes" ? "#b5cd00" : "transparent")}
                      >
                        <i className="bi bi-people me-2"></i>Gestão de Clientes
                      </Nav.Link>
                      <Nav.Link as={Link} href="/paginaDashboardFinanceiro" onClick={handleMenuClick} style={{
                        color: "#FFF",
                        borderRadius: "10px",
                        marginBottom: "5px",
                        backgroundColor: router.pathname === "/paginaDashboardFinanceiro" ? "#b5cd00" : "transparent"
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/paginaDashboardFinanceiro" ? "#b5cd00" : "transparent")}>
                        <i className="bi-bar-chart-line me-2"></i>Dashboard Financeiro
                      </Nav.Link>
                    </div>
                  )}
                </>
              )}


              {canAccess.consulta && (
                <Nav.Link as={Link} href="/paginaTelemedicina" onClick={handleMenuClick} style={{
                  color: router.pathname === "/paginaTelemedicina" ? "#000" : "#FFF",
                  backgroundColor: router.pathname === "/paginaTelemedicina" ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out",
                  marginBottom: "5px"

                }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/paginaTelemedicina" ? "#b5cd00" : "transparent")}>
                  <i className="bi bi-clipboard-heart me-2"></i>Consultar com médico online
                </Nav.Link>
              )}

              {canAccess.apolice && (
                <Nav.Link as={Link} href="/paginaApolice" onClick={handleMenuClick} style={{
                  color: router.pathname === "/paginaApolice" ? "#000" : "#FFF",
                  backgroundColor: router.pathname === "/paginaApolice" ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out",
                  marginBottom: "5px"

                }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/paginaApolice" ? "#b5cd00" : "transparent")}>
                  <i className="bi-download me-2"></i>Baixar Apólice
                </Nav.Link>
              )}

              {canAccess.controleDependentes && (
                <Nav.Link as={Link} href="/paginaControleDependentes" onClick={handleMenuClick} style={{
                  color: router.pathname === "/paginaControleDependentes" ? "#000" : "#FFF",
                  backgroundColor: router.pathname === "/paginaControleDependentes" ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out",
                  marginBottom: "5px"

                }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/paginaControleDependentes" ? "#b5cd00" : "transparent")}>
                  <i className="bi-people-fill me-2"></i>Controle de Dependentes
                </Nav.Link>
              )}
              {canAccess.suporte && (
                <Nav.Link as={Link} href="/paginaControlePagamento" onClick={handleMenuClick} style={{
                  color: router.pathname === "/paginaControlePagamento" ? "#000" : "#FFF",
                  backgroundColor: router.pathname === "/paginaControlePagamento" ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out",
                  marginBottom: "5px"

                }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/paginaControlePagamento" ? "#b5cd00" : "transparent")}>
                  <i className="bi-credit-card me-2"></i>Controle de Pagamento
                </Nav.Link>
              )}
              {canAccess.cancelamento && (
                <Nav.Link as={Link} href="/paginaCancelamento" onClick={handleMenuClick} style={{
                  color: router.pathname === "/paginaCancelamento" ? "#000" : "#FFF",
                  backgroundColor: router.pathname === "/paginaCancelamento" ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out",
                  marginBottom: "5px"

                }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/paginaCancelamento" ? "#b5cd00" : "transparent")}>
                  <i className="bi-x-circle me-2"></i>Cancelamento
                </Nav.Link>
              )}

              {canAccess.suporte && (
                <Nav.Link
                  as="a"
                  href="https://wa.me/5561998565628"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#FFF",
                    backgroundColor: "transparent",
                    borderRadius: "10px",
                    padding: "10px",
                    transition: "background-color 0.3s ease-in-out",
                    marginBottom: "5px"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <i className="bi bi-question-circle me-2"></i>Suporte e Ajuda
                </Nav.Link>

              )}
            </Nav>
          </div>

          <div style={{ textAlign: "center", padding: "20px", borderTop: "1px solid #FFF", width: "100%" }}>
            <p style={{ color: "#FFF", marginBottom: "10px" }}>Usuário: {userName}</p>
            <button
              className="btn btn-danger w-100"
              style={{ borderRadius: "10px", padding: "10px" }}
              onClick={() => {
                localStorage.removeItem("user");
                router.push("/");
              }}
            >
              <i className="bi bi-box-arrow-right me-2"></i>Sair
            </button>
          </div>
        </div>

        <div
          style={{
            position: "fixed",
            top: "10px",
            left: menuOpen ? "260px" : "10px", // Move junto com a Sidebar
            transition: "left 0.3s ease-in-out",
            zIndex: 1000,
          }}
        >
          <button
            className="btn btn-light d-flex align-items-center"
            onClick={handleToggleMenu}
            style={{
              backgroundColor: "rgb(22 22 33)",
              borderColor: "rgb(22 22 33)",
            }}
          >
            <i className="bi bi-list" style={{ fontSize: "1.5rem", color: "white" }}></i>
            <span style={{ marginLeft: "10px", fontSize: "1.2rem", fontWeight: "bold", color: "white" }}>
              Menu
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
