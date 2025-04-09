import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/app/context/AuthContext"; // ✅ Importa o contexto de autenticação
import Loading from "../loading/loading";
import AvisoAlerta from "../avisoAlerta/avisoAlerta";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth(); // ✅ Usa o login do contexto
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, password }),
      });

      const data = await res.json();
      if (data.usuario?.empresa) {
        localStorage.setItem("nome_empresa", data.usuario.empresa.nomeEmpresa);
        localStorage.setItem("imagem_empresa", data.usuario.empresa.imagem_perfil);
      }
      
      
      if (!res.ok) throw new Error(data.error);

      login(data.token);
      setTimeout(() => {
        router.push("/paginaInicial");
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="row shadow rounded overflow-hidden" style={{ width: "1000px", height: "600px", background: "white" }}>
        <div className="col-md-6 d-none d-md-block p-0" style={{ background: "url('/image.png') center/cover no-repeat" }}></div>
        <div className="col-md-6 p-4 d-flex flex-column justify-content-center" style={{ minHeight: "100%" }}>
          {error && <AvisoAlerta mensagem={error} tipo="danger" />}
          <h2 className="mb-5">Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="cpf" className="form-label">CPF</label>
              <input
                type="text"
                id="cpf"
                className="form-control"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
                placeholder="Digite seu CPF"
              />
            </div>


            <div className="mb-3">
              <label htmlFor="password" className="form-label">Senha</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
              />
            </div>

            <button
              type="submit"
              className="btn w-100 text-white"
              style={{
                backgroundColor: "rgb(181, 205, 0)",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(150, 180, 0)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)")}
              disabled={loading}
            >
              {loading ? <Loading /> : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
