import "bootstrap/dist/css/bootstrap.min.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Layout from "@/components/layout/layout";
import { AuthProvider } from "@/app/context/AuthContext";
import "animate.css";
import Head from "next/head";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideSidebarRoutes = ["/"];
  const [pageTitle, setPageTitle] = useState("Sistema de Vendas");

  const isVita = typeof window !== "undefined" && window.location.hostname === "vitaclinica.saudeecor.com";

  return (
    <AuthProvider>
      <Head>
        <title>{isVita ? "Vita Clínica Médica" : pageTitle}</title>
        <link rel="icon" href={isVita ? "/uploads/favicon-vita.ico" : "/favicon.ico"} />
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
