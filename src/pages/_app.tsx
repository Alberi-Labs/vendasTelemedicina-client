import "bootstrap/dist/css/bootstrap.min.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Layout from "@/components/layout/layout";
import useAuth from "@/hook/useAuth";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { authenticated } = useAuth();

  const hideSidebarRoutes = ["/"];

  return hideSidebarRoutes.includes(router.pathname) ? (
    <Component {...pageProps} />
  ) : (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
