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
  const hideSidebarRoutes = ["/", "/manutencao"];
  const [pageTitle, setPageTitle] = useState("Sistema de Vendas");

  const isVita = typeof window !== "undefined" && window.location.hostname === "vitaclinica.saudeecor.com";

  // Importe o JS do Bootstrap apenas no lado do cliente
  useEffect(() => {
    // @ts-ignore
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" &&
      router.pathname !== "/manutencao"
    ) {
      router.push("/manutencao");
    }
  }, [router]);

  // Escala global via font-size do documento (sem alterar zoom do navegador)
  useEffect(() => {
    const raw = process.env.NEXT_PUBLIC_APP_FONT_SCALE;
    const scale = raw ? Number(raw) : 0.9; // default 90%
    const valid = isFinite(scale) && scale > 0 && scale <= 1 ? scale : 0.9;
    const prev = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = `${valid * 100}%`;
    return () => { document.documentElement.style.fontSize = prev; };
  }, []);

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