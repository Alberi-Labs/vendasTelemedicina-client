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
  const { user, isAuthLoaded } = useAuth(); 

  // Verifica se a página é uma das que não devem exibir o Sidebar ou FooterBar
  const isLoginPage = router.pathname === '/' || router.pathname === '/loginCliente' || router.pathname === '/loginFuncionario' || router.pathname === '/vendaOnlline';

  useEffect(() => {
    if (isAuthLoaded && !user && !isLoginPage) {
      console.log("Usuário não autenticado, redirecionando...");
      // Redireciona para a página de login, exceto se já estiver na página de login
      router.push("/");
    }
  }, [user, isAuthLoaded, router, isLoginPage]);
  
  if (!isAuthLoaded) {
    return <div style={{ textAlign: "center", paddingTop: "50px" }}>Carregando...</div>;
  }
  
  if (!user && !isLoginPage) {
    return <div style={{ textAlign: "center", paddingTop: "50px" }}>Redirecionando...</div>;
  }

  return (
    <AtendimentoProvider>
      <div style={{ display: "flex", minHeight: "100vh", width: "100vw", backgroundColor: "white" }}>
        {!isLoginPage && <Sidebar />}
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
