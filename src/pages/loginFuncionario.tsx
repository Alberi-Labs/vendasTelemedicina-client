import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth, User } from "@/app/context/AuthContext";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import Loading from "@/components/loading/loading";

export default function LoginFuncionario() {
  const router = useRouter();
  const { login } = useAuth();
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
      if (!res.ok) throw new Error(data.error);
      console.log("data", data);
      const clienteData: User = {
        id: data.usuario.id,
        nome: data.usuario.nome,
        role: data.usuario.role,
        id_instituicao: data.usuario.id_instituicao,
        login_sistema:data.usuario.login_sistema,
        senha_sistema:data.usuario.senha_sistema,
        dsc_instituicao: data.usuario.instituicao.nomeInstituicao,
        imagem_empresa: data.usuario.instituicao.imagem_perfil,
      }

      login(clienteData, false);
      setTimeout(() => {
        router.push("/paginaInicial");
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
      setLoading(false);
    }
  };

return (
  <div
    className="d-flex justify-content-center align-items-center"
    style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      padding: "1rem",
    }}
  >
    <div
      className="row shadow-lg rounded overflow-hidden w-100"
      style={{
        maxWidth: "960px",
        backgroundColor: "white",
        borderRadius: "12px",
        minHeight: "600px",
      }}
    >
      {/* Lado da imagem */}
      <div
        className="col-lg-6 d-none d-lg-block p-0"
        style={{
          backgroundImage: "url('/image.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "600px",
        }}
      ></div>

      {/* Formulário */}
      <div
        className="col-lg-6 col-12 p-3 p-md-4 p-lg-5 d-flex flex-column justify-content-center"
        style={{ minHeight: "600px" }}
      >
        <div className="mb-2 mb-md-3">
  <button
    type="button"
    onClick={() => router.back()}
    className="btn btn-link text-primary text-decoration-none d-flex align-items-center gap-1 p-0"
    style={{ fontSize: "0.9rem" }}
  >
    <i className="bi bi-arrow-left"></i>
    Voltar
  </button>
</div>

        {error && <AvisoAlerta mensagem={error} tipo="danger" />}

        <div className="text-center mb-2 mb-md-3">
          <i className="bi bi-person-badge" style={{ fontSize: "1.8rem", color: "#2563eb" }}></i>
        </div>

        <h4 className="fw-bold text-center mb-1 mb-md-2" style={{ fontSize: "1.5rem" }}>Login Colaborador</h4>
        <p className="text-muted text-center mb-3 mb-md-4" style={{ fontSize: "0.9rem" }}>Acesse com seu CPF e senha.</p>

        <form onSubmit={handleLogin}>
          <div className="mb-2 mb-md-3">
            <input
              type="text"
              id="cpf"
              className="form-control"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
              placeholder="Digite seu CPF"
              style={{ height: "45px", fontSize: "1rem" }}
            />
          </div>

          <div className="mb-3 mb-md-4">
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Digite sua senha"
              style={{ height: "45px", fontSize: "1rem" }}
            />
          </div>

          <button
            type="submit"
            className="btn w-100 d-flex justify-content-center align-items-center gap-2 text-white"
            style={{
              backgroundColor: "#8dc63f",
              height: "45px",
              fontWeight: 500,
              borderRadius: "8px",
              fontSize: "1rem",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#79b92f")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8dc63f")}
            disabled={loading}
          >
            <i className="bi bi-box-arrow-in-right"></i>
            {loading ? <Loading /> : "Entrar"}
          </button>
        </form>

        <div className="text-center mt-3 mt-md-4">
          <a href="#" className="small text-primary text-decoration-none" style={{ fontSize: "0.85rem" }}>
            <i className="bi bi-question-circle me-1"></i>Precisa de ajuda?
          </a>
        </div>
      </div>
    </div>
  </div>
);

}
