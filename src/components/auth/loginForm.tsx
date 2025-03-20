import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/app/context/AuthContext"; // ✅ Importa o contexto de autenticação
import Loading from "../loading/loading";
import AvisoAlerta from "../avisoAlerta/avisoAlerta";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth(); // ✅ Usa o login do contexto
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      login(data.token); // ✅ Usa o contexto para definir o usuário autenticado

      setTimeout(() => { // ✅ Garante que o estado seja atualizado antes da navegação
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
              <label htmlFor="email" className="form-label">E-mail</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Digite seu e-mail"
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
