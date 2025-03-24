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
                  href="/cadastroPf"
                  onClick={handleMenuClick}
                  style={{
                    color: router.pathname === "/cadastroPf" ? "#000" : "#FFF",
                    backgroundColor: router.pathname === "/cadastroPf" ? "#b5cd00" : "transparent",
                    borderRadius: "10px",
                    padding: "10px",
                    transition: "background-color 0.3s ease-in-out",
                    marginBottom: "5px"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/cadastroPf" ? "#b5cd00" : "transparent")}
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
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/relatorioVendas" || router.pathname === "/gestaoClientes" ? "#b5cd00" : "transparent")}
                  >
                    <i className="bi bi-clipboard-data me-2"></i>Relatórios e Gestão
                  </button>

                  {relatoriosOpen && (
                    <div className="ps-3">
                      {/* 🔹 Link para Relatório de Vendas */}
                      <Nav.Link
                        as={Link}
                        href="/relatorioVendas"
                        onClick={handleMenuClick}
                        style={{
                          color: "#FFF",
                          borderRadius: "10px",
                          marginBottom: "5px",
                          backgroundColor: router.pathname === "/relatorioVendas" ? "#b5cd00" : "transparent"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/relatorioVendas" ? "#b5cd00" : "transparent")}
                      >
                        <i className="bi bi-file-earmark-bar-graph me-2"></i>Relatório de Vendas
                      </Nav.Link>

                      {/* 🔹 Link para Gestão de Clientes */}
                      <Nav.Link
                        as={Link}
                        href="/gestaoClientes"
                        onClick={handleMenuClick}
                        style={{
                          color: "#FFF",
                          borderRadius: "10px",
                          marginBottom: "5px",
                          backgroundColor: router.pathname === "/gestaoClientes" ? "#b5cd00" : "transparent"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/gestaoClientes" ? "#b5cd00" : "transparent")}
                      >
                        <i className="bi bi-people me-2"></i>Gestão de Clientes
                      </Nav.Link>
                    </div>
                  )}
                </>
              )}


              {canAccess.consulta && (
                <Nav.Link as={Link} href="/telemedicina" onClick={handleMenuClick} style={{
                  color: router.pathname === "/telemedicina" ? "#000" : "#FFF",
                  backgroundColor: router.pathname === "/telemedicina" ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out",
                  marginBottom: "5px"

                }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/cadastroPf" ? "#b5cd00" : "transparent")}>
                  <i className="bi bi-clipboard-heart me-2"></i>Consultar com médico online
                </Nav.Link>
              )}

              {canAccess.suporte && (
                <Nav.Link as={Link} href="/suporte" onClick={handleMenuClick} style={{
                  color: router.pathname === "/suporte" ? "#000" : "#FFF",
                  backgroundColor: router.pathname === "/suporte" ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out",
                  marginBottom: "5px"

                }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = router.pathname === "/cadastroPf" ? "#b5cd00" : "transparent")}>
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
