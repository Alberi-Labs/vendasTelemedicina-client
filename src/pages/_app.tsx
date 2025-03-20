import "bootstrap/dist/css/bootstrap.min.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Layout from "@/components/layout/layout";
import { AuthProvider } from "@/app/context/AuthContext"; // 🔹 Importa o AuthProvider
import "animate.css";
import Head from "next/head";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideSidebarRoutes = ["/"]; // Rota que não exibe sidebar
  const [pageTitle, setPageTitle] = useState("Sistema de Vendas"); // 🔹 Título padrão



  return (
    <AuthProvider> {/* 🔹 Envolvendo a aplicação no AuthProvider */}
      <Head>
        <title>{pageTitle}</title> {/* 🔹 Define o título da aba */}
        <link rel="icon" href="/favicon.ico" /> {/* 🔹 Define o favicon */}
      </Head>

      {hideSidebarRoutes.includes(router.pathname) ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </AuthProvider>
  );
}
