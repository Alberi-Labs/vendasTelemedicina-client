import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Container } from "react-bootstrap";
import "../../styles/globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import FooterBar from "./footerBar";
import Sidebar from "./sideBar";
import AvisoManutencao from "../avisoManutencao/AvisoManutencao";
import { AtendimentoProvider } from "@/app/context/AtendimentoContex";
import { useAuth } from "@/app/context/AuthContext";
import TopBar from './TopBar';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthLoaded } = useAuth();

  const isLoginPage = router.pathname === '/' || router.pathname === '/loginCliente' || router.pathname === '/loginFuncionario' || router.pathname === '/vendaOnlline';

  // Verifica se o sistema está em manutenção baseado na variável de ambiente
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  useEffect(() => {
    if (isAuthLoaded && !user && !isLoginPage) {
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
    <AvisoManutencao show={isMaintenanceMode} />
    {!isLoginPage && <TopBar />}
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "white",
        marginTop: isMaintenanceMode ? "80px" : (!isLoginPage ? "54px" : "0px"), 
      }}
    >
      {!isLoginPage && <Sidebar />}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ backgroundColor: "#f1f5f9", flex: 1, display: "flex", flexDirection: "column" }}>
          <main style={{ flex: 1 }}>
            <Breadcrumbs />
            {children}
          </main>
        </div>

        {!isLoginPage && <FooterBar />}
      </div>
    </div>
  </AtendimentoProvider>
);

}
