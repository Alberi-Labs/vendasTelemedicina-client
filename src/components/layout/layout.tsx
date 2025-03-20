import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Container } from "react-bootstrap";
import "../../styles/globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import FooterBar from "./footerBar";
import Sidebar from "./sideBar";
import { AtendimentoProvider } from "@/app/context/AtendimentoContex";
import { useAuth } from "@/app/context/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth(); // 🔹 Obtém o usuário autenticado do contexto
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/"); // 🔹 Redireciona para login se não estiver autenticado
    }
    setLoading(false);
  }, [user, router]);

  if (loading) {
    return <div style={{ textAlign: "center", paddingTop: "50px" }}>Carregando...</div>;
  }

  if (!user) {
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
