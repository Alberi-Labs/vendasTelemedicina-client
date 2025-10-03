import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth, User } from "@/app/context/AuthContext";
import { authApi } from "@/lib/api-client";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import Loading from "@/components/loading/loading";

export default function LoginFuncionario() {
  const router = useRouter();
  const { login } = useAuth();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Função para limpar CPF removendo pontos e traços
  const cleanCpf = (cpf: string) => {
    return cpf.replace(/[.\-]/g, '');
  };

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Limpa o CPF antes de enviar para a API
      const cleanedCpf = cleanCpf(cpf);
      
  // Nova API do backend
  const data = await authApi.login(cleanedCpf, password);
  if (!data?.success) throw new Error(data?.error || 'Falha no login');
      const clienteData: User = {
  id: data.user.id,
  nome: data.user.nome,
  perfil: data.user.perfil,
  id_instituicao: data.user.id_instituicao,
  dsc_instituicao: data.user.nomeInstituicao,
  imagem_empresa: data.user.imagem_perfil,
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
      background: "#0f172a",
      padding: "1rem"
    }}
  >
    <div
      className="shadow p-4 p-md-5 w-100"
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        maxWidth: "480px",
        width: "100%",
        border: "1px solid #e2e8f0"
      }}
    >
      <div
        style={{
          background: "linear-gradient(90deg,#2563eb,#3b82f6)",
          height: 4,
          borderRadius: 4,
          marginBottom: 24
        }}
      />
      <button
        type="button"
        onClick={() => router.back()}
        className="btn btn-link text-primary text-decoration-none d-flex align-items-center gap-1 p-0 mb-3"
        style={{ fontSize: ".85rem" }}
      >
        <i className="bi bi-arrow-left"></i>
        Voltar
      </button>

      {error && <AvisoAlerta mensagem={error} tipo="danger" />}

      <div className="text-center mb-3">
        <i className="bi bi-person-badge" style={{ fontSize: "2rem", color: "#2563eb" }}></i>
      </div>
      <h4 className="fw-bold text-center mb-2" style={{ fontSize: "1.4rem" }}>Login Colaborador</h4>
      <p className="text-muted text-center mb-4" style={{ fontSize: ".85rem" }}>Acesse com seu CPF e senha.</p>

      <form onSubmit={handleLogin} noValidate>
        <div className="mb-3">
          <label className="form-label small text-muted">CPF</label>
          <input
            type="text"
            id="cpf"
            className="form-control"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            required
            placeholder="Digite seu CPF"
            aria-label="CPF"
          />
        </div>

        <div className="mb-4">
          <label className="form-label small text-muted">Senha</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Digite sua senha"
            aria-label="Senha"
          />
        </div>

        <button
          type="submit"
          className="btn w-100 d-flex justify-content-center align-items-center gap-2 text-white"
          style={{
            backgroundColor: "#8dc63f",
            height: "46px",
            fontWeight: 600,
            borderRadius: "10px",
            fontSize: ".95rem"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#79b92f")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8dc63f")}
          disabled={loading}
        >
          <i className="bi bi-box-arrow-in-right"></i>
          {loading ? <Loading /> : "Entrar"}
        </button>
      </form>

      <div className="text-center mt-4">
        <a href="#" className="small text-primary text-decoration-none">
          <i className="bi bi-question-circle me-1"></i>Precisa de ajuda?
        </a>
      </div>
    </div>
  </div>
);

}
