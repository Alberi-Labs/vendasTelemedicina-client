import { useRouter } from "next/router";
import Link from "next/link";
import { Navbar, Nav, Container } from "react-bootstrap";

export default function NavigationBar() {
  const router = useRouter();
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <Navbar style={{ backgroundColor: "#ffff", padding: "15px 0", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }} variant="light" expand="lg">
      <Container>
        <Navbar.Brand as={Link} href="/" style={{ position: "absolute", left: "50px", color: "#333", fontSize: "1.5rem", fontWeight: "bold" }}>TeleSaúde Municipal</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" style={{ justifyContent: "center" }}>
          <Nav className="gap-4">
            {[
              { href: "/login-profissional", label: "Login do Profissional de Saúde" },
              { href: "/telemedicina", label: "Telemedicina e Atendimento" },
              { href: "/banco-dados", label: "Banco de Dados Médico" },
              { href: "/relatorios", label: "Relatórios e Gestão" },
              { href: "/suporte", label: "Suporte e Ajuda" }
            ].map(({ href, label }) => (
              <Nav.Link 
                key={href} 
                as={Link} 
                href={href} 
                style={{ 
                  color: router.pathname === href ? "#9453a2" : "black", 
                  fontSize: "1.1rem", 
                  fontWeight: "500", 
                  transition: "color 0.3s" 
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#9453a2")}
                onMouseLeave={(e) => (e.currentTarget.style.color = router.pathname === href ? "#9453a2" : "black")}>
                {label}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
