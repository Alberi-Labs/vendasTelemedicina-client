"use client";

import { useRouter } from "next/router";

export default function LoginForm() {
  const router = useRouter();

  const redirecionar = (tipo: "cliente" | "funcionario") => {
    if (tipo === "cliente") {
      router.push("/loginCliente");
    } else {
      router.push("/loginFuncionario");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div
        className="row shadow rounded overflow-hidden"
        style={{ width: "600px", height: "400px", background: "white" }}
      >
        <div className="col-12 p-4 d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "100%" }}>
          <h2 className="mb-4 text-center">Escolha o tipo de acesso</h2>

          <div className="d-flex gap-4">
            <button
              className="btn btn-primary px-4 py-2"
              onClick={() => redirecionar("cliente")}
            >
              Cliente
            </button>

            <button
              className="btn btn-secondary px-4 py-2"
              onClick={() => redirecionar("funcionario")}
            >
              Funcionário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
