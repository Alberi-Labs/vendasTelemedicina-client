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
  const { user, isAuthLoaded } = useAuth(); // Obtém usuário e status de carregamento

  if (!isAuthLoaded) {
    return <div style={{ textAlign: "center", paddingTop: "50px" }}>Carregando...</div>;
  }

  useEffect(() => {
    if (isAuthLoaded && !user) {
      router.push("/");
    }
  }, [user, isAuthLoaded, router]);

  if (!isAuthLoaded || !user) {
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
