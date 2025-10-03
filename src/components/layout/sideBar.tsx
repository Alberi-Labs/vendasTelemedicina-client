import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Nav } from "react-bootstrap";
import Loading from "../loading/loading";
import { useAuth } from "@/app/context/AuthContext";
import { sidebarModules } from "@/config/modulesConfig";

export default function Sidebar() {
  const router = useRouter();
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bgColor, setBgColor] = useState("#232230");
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [empresaNome, setEmpresaNome] = useState<string | null>(null);
  const [empresaImagem, setEmpresaImagem] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const empresaNome = user?.dsc_instituicao ?? null;
    const empresaImagem = user?.imagem_empresa || localStorage.getItem("imagem_empresa") || "/default2.png";

    try {
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.nome && parsedUser?.perfil) {
          setUserName(parsedUser.nome);
          setUserRole(parsedUser.perfil);
        } else {
          console.error("Formato inválido para usuário:", parsedUser);
        }
      }

      if (empresaNome) setEmpresaNome(empresaNome);
      if (empresaImagem) setEmpresaImagem(empresaImagem);
    } catch (error) {
      console.error("Erro ao parsear JSON do usuário ou dados da instituicao:", error);
    }
  }, [user]);

  // Escuta evento da TopBar para abrir/fechar
  useEffect(() => {
    const handler = () => setMenuOpen(m => !m);
    if (typeof window !== 'undefined') {
      window.addEventListener('toggle-sidebar', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('toggle-sidebar', handler);
      }
    };
  }, []);

  const handleMenuClick = () => {
    setMenuOpen(false);
    setTimeout(() => {
      setBgColor("#edeade");
    }, 300);
  };

  const handleToggleMenu = () => {
    if (!menuOpen) {
      setBgColor("#0d1b2a");
    }
    setMenuOpen(!menuOpen);
  };

  const modules = sidebarModules(userRole || undefined);
  const relatorioGroupKeys = new Set(["relatorioVendas","gestaoClientes","gestaoInstituicoes","gestaoUsuarios","dashboardFinanceiro","relatorioAsaas","crmVendas"]);
  const simpleModules = modules.filter(m => !relatorioGroupKeys.has(m.key));
  const relatorioModules = modules.filter(m => relatorioGroupKeys.has(m.key));

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
  padding: "1.5rem 1rem",
            boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
            position: "fixed",
            left: menuOpen ? "0" : "-250px",
            top: "54px", // abaixo da TopBar fixa
            transition: "left 0.3s ease-in-out",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 1050,
              borderTopRightRadius: "12px"

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
              <div className="text-center mb-4">
                {empresaImagem && empresaNome ? (
                  <Link href="/paginaInicial" passHref legacyBehavior>
                    <a onClick={handleMenuClick} style={{ textDecoration: "none" }}>
                      <img
                        src={empresaImagem}
                        alt="Logo da instituicao"
                        style={{ width: 120, height: 145, objectFit: "contain", borderRadius: 8 }}
                        className="mb-2"
                      />
                      <h5 style={{ color: "#FFF", fontSize: "1rem", marginTop: "0.5rem" }}>{empresaNome}</h5>
                    </a>
                  </Link>
                ) : (
                  <p style={{ color: "#ccc", fontStyle: "italic", fontSize: "0.9rem" }}>
                    Sem instituicao vinculada
                  </p>
                )}
              </div>

            </h2>
            <Nav className="flex-column">
              {simpleModules.map(mod => (
                <Nav.Link
                  key={mod.key}
                  as={mod.href ? 'a' : (Link as any)}
                  href={mod.href || mod.path}
                  target={mod.href ? '_blank' : undefined}
                  rel={mod.href ? 'noopener noreferrer' : undefined}
                  onClick={handleMenuClick}
                  style={{
                    color: router.pathname === mod.path ? "#000" : "#FFF",
                    backgroundColor: router.pathname === mod.path ? "#b5cd00" : "transparent",
                    borderRadius: "10px",
                    padding: "10px",
                    transition: "background-color 0.3s ease-in-out",
                    marginBottom: "5px"
                  }}
                  onMouseEnter={(e: any) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                  onMouseLeave={(e: any) => (e.currentTarget.style.backgroundColor = router.pathname === mod.path ? "#b5cd00" : "transparent")}
                >
                  <i className={`bi ${mod.icon} me-2`}></i>{mod.label}
                </Nav.Link>
              ))}

              {relatorioModules.length > 0 && (
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
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = relatoriosOpen ? "#b5cd00" : "transparent")}
                  >
                    <i className="bi bi-clipboard-data me-2"></i>Relatórios e Gestão
                  </button>
                  {relatoriosOpen && (
                    <div className="ps-3">
                      {relatorioModules.map(mod => (
                        <Nav.Link
                          key={mod.key}
                          as={Link as any}
                          href={mod.path}
                          onClick={handleMenuClick}
                          style={{
                            color: "#FFF",
                            borderRadius: "10px",
                            marginBottom: "5px",
                            backgroundColor: router.pathname === mod.path ? "#b5cd00" : "transparent"
                          }}
                          onMouseEnter={(e: any) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
                          onMouseLeave={(e: any) => (e.currentTarget.style.backgroundColor = router.pathname === mod.path ? "#b5cd00" : "transparent")}
                        >
                          <i className={`bi ${mod.icon} me-2`}></i>{mod.label}
                        </Nav.Link>
                      ))}
                    </div>
                  )}
                </>
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
                window.location.href = "/";
              }}
            >
              <i className="bi bi-box-arrow-right me-2"></i>Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
