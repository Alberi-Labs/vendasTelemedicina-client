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
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const storedUserName = localStorage.getItem("user");
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  const handleNavigation = (path: string) => {
    setLoading(true);
    router.push(path);
  };

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
            justifyContent: "space-between"
          }}
        >
          <div>
            <h2 style={{ color: "#FFF", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "20px", textAlign: "center", borderBottom: "2px solid #FFF", paddingBottom: "10px" }}>
              <Link href="/paginaInicial" style={{ textDecoration: "none", color: "#FFF" }} onClick={handleMenuClick}>
                Farmacia
              </Link>
            </h2>
            <Nav className="flex-column">
              <Nav.Link as={Link} href="/cadastroPf" onClick={handleMenuClick}
                style={{
                  color: router.pathname === "/cadastroPf" ? "#000" : "#FFF",
                  backgroundColor: router.pathname === "/cadastroPf" ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = router.pathname === "/cadastroPf" ? "#b5cd00" : "transparent"}>
                <i className="bi bi-cart me-2" style={{ color: router.pathname === "/cadastroPf" ? "#000" : "#FFF" }}></i>Vendas
              </Nav.Link>
              <button
                className="btn btn-link text-start w-100"
                onClick={() => {
                  if (vendasOpen) setVendasOpen(false); // Fecha o menu Vendas se estiver aberto
                  setRelatoriosOpen(!relatoriosOpen); // Abre/fecha o menu Relatórios
                }}
                style={{
                  textDecoration: "none",
                  color: "#FFF",
                  backgroundColor: relatoriosOpen ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out",
                  marginBottom: "5px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = relatoriosOpen ? "#b5cd00" : "transparent"}
              >
                <i className="bi bi-clipboard-data me-2" style={{ color: "#FFF" }}></i>Relatórios e Gestão
              </button>
              {relatoriosOpen && (
                <div className="ps-3">
                  <Nav.Link as={Link} href="/gestaoDeClientesCadatrados" onClick={handleMenuClick}
                    style={{
                      color: router.pathname === "/gestaoDeClientesCadatrados" ? "#000" : "#FFF",
                      backgroundColor: router.pathname === "/gestaoDeClientesCadatrados" ? "#b5cd00" : "transparent",
                      borderRadius: "10px",
                      padding: "10px",
                      transition: "background-color 0.3s ease-in-out",
                      marginBottom: "5px"

                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = router.pathname === "/gestaoDeClientesCadatrados" ? "#b5cd00" : "transparent"}>
                    <i className="bi bi-house-door me-2" style={{ color: router.pathname === "/gestaoDeClientesCadatrados" ? "#000" : "#FFF" }}></i>Gestão de Clientes Cadastradas
                  </Nav.Link>

                  <Nav.Link as={Link} href="/relatorioVendas" onClick={handleMenuClick}
                    style={{
                      color: router.pathname === "/relatorioVendas" ? "#000" : "#FFF",
                      backgroundColor: router.pathname === "/relatorioVendas" ? "#b5cd00" : "transparent",
                      borderRadius: "10px",
                      padding: "10px",
                      transition: "background-color 0.3s ease-in-out",
                      marginBottom: "5px"

                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = router.pathname === "/relatorioVendas" ? "#b5cd00" : "transparent"}>
                    <i className="bi bi-file-earmark-bar-graph me-2" style={{ color: router.pathname === "/relatorioVendas" ? "#000" : "#FFF" }}></i>Relatório de Vendas
                  </Nav.Link>
                </div>
              )}


              <Nav.Link as={Link} href="/consulta" onClick={handleMenuClick}
                style={{
                  color: router.pathname === "/consulta" ? "#000" : "#FFF",
                  backgroundColor: router.pathname === "/consulta" ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = router.pathname === "/consulta" ? "#b5cd00" : "transparent"}>
                <i className="bi bi-clipboard-heart me-2" style={{ color: router.pathname === "/consulta" ? "#000" : "#FFF" }}></i>Consultar com médico onlline
              </Nav.Link>
              <Nav.Link as={Link} href="/suporte" onClick={handleMenuClick}
                style={{
                  color: router.pathname === "/suporte" ? "#000" : "#FFF",
                  backgroundColor: router.pathname === "/suporte" ? "#b5cd00" : "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  transition: "background-color 0.3s ease-in-out"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = router.pathname === "/suporte" ? "#b5cd00" : "transparent"}>
                <i className="bi bi-question-circle me-2" style={{ color: router.pathname === "/suporte" ? "#000" : "#FFF" }}></i>Suporte e Ajuda
              </Nav.Link>
            </Nav>
          </div>
          <div style={{ textAlign: "center", padding: "20px", borderTop: "1px solid #FFF", width: "100%", position: "absolute", bottom: "0", left: "0" }}>
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
            marginLeft: menuOpen ? "250px" : "0",
            transition: "margin-left 0.3s ease-in-out, background-color 0.3s ease",
            flexGrow: 1,
            padding: "10px",
          }}
        >
          <button
            className="btn btn-light d-flex align-items-center"
            onClick={handleToggleMenu}
            style={{
              position: "fixed",
              top: "10px",
              left: menuOpen ? "260px" : "10px",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              transition: "left 0.3s ease-in-out",
              backgroundColor: "rgb(22 22 33)",
              borderColor: "rgb(22 22 33)",
            }}
          >
            <i className="bi bi-list" style={{
              fontSize: "1.5rem", color: "white"
            }}></i>
            <span
              style={{
                marginLeft: "10px",
                fontSize: "1.2rem",
                fontWeight: "bold",
                transition: "color 0.3s ease",
                color: "white"
              }}

            >
              Menu
            </span>
          </button>
        </div>

      </div>
    </>

  );
}

