import LoginForm from "@/components/auth/loginForm";

export default function LoginPage() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">Bem-vindo ao nosso sistema interno de vendas!</h3>
        <p className="text-center">Aqui você pode fazer o login para acessar o sistema e realizar suas vendas de forma rápida e segura.</p>
        <LoginForm />
      </div>
    </div>
  );
}
