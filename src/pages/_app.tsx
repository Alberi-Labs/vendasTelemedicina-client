import "bootstrap/dist/css/bootstrap.min.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Layout from "@/components/layout/layout";
import { AuthProvider } from "@/app/context/AuthContext"; // 🔹 Importa o AuthProvider
import "animate.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideSidebarRoutes = ["/"]; // Rota que não exibe sidebar

  return (
    <AuthProvider> {/* 🔹 Envolvendo a aplicação no AuthProvider */}
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
