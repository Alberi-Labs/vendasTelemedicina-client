import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Nav } from "react-bootstrap";

export default function Sidebar() {
  const router = useRouter();
  const [vendasOpen, setVendasOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bgColor, setBgColor] = useState("#161621");
  const [userName, setUserName] = useState<string | null>(null);


  useEffect(() => {
    const storedUserName = localStorage.getItem("user");
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  const handleMenuClick = () => {
    setMenuOpen(false);
    setTimeout(() => {
      setBgColor("#edeade");
    }, 300); // Aguarda o tempo da transição antes de mudar a cor
  };

  // Abre o menu e mantém a cor escura
  const handleToggleMenu = () => {
    if (!menuOpen) {
      setBgColor("#161621");
    }
    setMenuOpen(!menuOpen);
  };

  return (
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
            <div>
              <button
                className="btn btn-link text-start w-100"
                onClick={() => setVendasOpen(!vendasOpen)}
                style={{ textDecoration: "none", color: "#FFF" }}
              >
                <i className="bi bi-cart me-2" style={{ color: "#FFF" }}></i>Vendas
              </button>
              {vendasOpen && (
                <div className="ps-3">
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
                    <i className="bi bi-person me-2" style={{ color: router.pathname === "/cadastroPf" ? "#000" : "#FFF" }}></i>Venda PF
                  </Nav.Link>
                  <Nav.Link as={Link} href="/cadastroPj" onClick={handleMenuClick}
                    style={{
                      color: router.pathname === "/cadastroPj" ? "#000" : "#FFF",
                      backgroundColor: router.pathname === "/cadastroPj" ? "#b5cd00" : "transparent",
                      borderRadius: "10px",
                      padding: "10px",
                      transition: "background-color 0.3s ease-in-out"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = router.pathname === "/cadastroPj" ? "#b5cd00" : "transparent"}>
                    <i className="bi bi-building me-2" style={{ color: router.pathname === "/cadastroPj" ? "#000" : "#FFF" }}></i>Venda PJ
                  </Nav.Link>
                </div>
              )}
            </div>
            <Nav.Link as={Link} href="/relatorios" onClick={handleMenuClick}
              style={{
                color: router.pathname === "/relatorios" ? "#000" : "#FFF",
                backgroundColor: router.pathname === "/relatorios" ? "#b5cd00" : "transparent",
                borderRadius: "10px",
                padding: "10px",
                transition: "background-color 0.3s ease-in-out"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = router.pathname === "/relatorios" ? "#b5cd00" : "transparent"}>
              <i className="bi bi-clipboard-data me-2" style={{ color: router.pathname === "/relatorios" ? "#000" : "#FFF" }}></i>Relatórios e Gestão
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
          <button className="btn btn-danger w-100" style={{ borderRadius: "10px", padding: "10px" }}>
            <i className="bi bi-box-arrow-right me-2"></i>Sair
          </button>
        </div>
      </div>
      <div style={{ marginLeft: menuOpen ? "250px" : "0", transition: "margin-left 0.3s ease-in-out", flexGrow: 1, padding: "10px" }}>
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
            backgroundColor: "#edeade",
            borderColor: "#edeade"
          }}
        >
          <i className="bi bi-list" style={{ fontSize: "1.5rem" }}></i>
          <span style={{ marginLeft: "10px", fontSize: "1.2rem", fontWeight: "bold" }}>Menu</span>
        </button>
      </div>
    </div>
  );
}

