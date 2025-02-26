import { useState } from "react";
import { useRouter } from "next/router";
import Loading from "../loading/loading";
import AvisoAlerta from "../avisoAlerta/avisoAlerta";
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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

      if (!res.ok) {
        throw new Error(data.error);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", data.nome);

      router.push("/paginaInicial");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <>
      {error && <AvisoAlerta mensagem={error} tipo="danger" />}
      <form onSubmit={handleLogin}>
        <div className="input-group mb-3">
          <span className="input-group-text">
            <i className="bi bi-envelope-fill"></i>
          </span>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="E-mail"
          />
        </div>

        <div className="input-group mb-3">
          <span className="input-group-text">
            <i className="bi bi-key-fill"></i>
          </span>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Senha"
          />
        </div>

        <button type="submit" className="btn w-100" style={{ backgroundColor: "green", color: "white" }} disabled={loading}>
          {loading ? <Loading /> : "Entrar"}
        </button>
      </form>
    </>
  );
}