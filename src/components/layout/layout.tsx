import { useEffect, useState } from "react"; 
import { useRouter } from "next/router";
import { Container } from "react-bootstrap";
import "../../styles/globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import FooterBar from "./footerBar";
import Sidebar from "./sideBar";
import { AtendimentoProvider } from "@/app/context/AtendimentoContex";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setIsAuthenticated(true);
    } else {
      router.push("/");
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div style={{ textAlign: "center", paddingTop: "50px" }}>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AtendimentoProvider>
      <div style={{ display: "flex", minHeight: "100vh", width: "100vw", backgroundColor: "white" }}>
        <Sidebar />
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Container style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </Container>
          <FooterBar />
        </div>
      </div>
    </AtendimentoProvider>
  );
}
