import { useState } from "react";
import { useRouter } from "next/router";
import Loading from "@/components/loading/loading";

export default function PaginaInicial() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleNavigation = (path: string) => {
    setLoading(true);
    router.push(path);
  };

  return (
    <div className="container text-center mt-5">
      {loading && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
        >
          <Loading />
        </div>
      )}

      <h1>Olá, seja bem-vindo ao nosso sistema de vendas!</h1>
      <p>
        Aqui você pode efetuar vendas de consultas individuais, consultar relatórios de vendas realizadas e configuração do acesso as consultas.
      </p>
      <div className="d-flex justify-content-center gap-3 mt-4">
        <div 
          className="card p-3 text-center"
          style={{ width: "200px", cursor: "pointer", transition: "background-color 0.3s ease-in-out" }}
          onClick={() => handleNavigation("/cadastroPf")}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""} 
        >
          <i className="bi bi-person fs-1"></i>
          <h5 className="mt-2">Venda Individual</h5>
        </div>
        <div 
          className="card p-3 text-center"
          style={{ width: "200px", cursor: "pointer", transition: "background-color 0.3s ease-in-out" }}
          onClick={() => handleNavigation("/consultarRelatorios")}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""} 
        >
          <i className="bi bi-clipboard-data fs-1"></i>
          <h5 className="mt-2">Consultar Relatórios</h5>
        </div>
        <div 
          className="card p-3 text-center"
          style={{ width: "200px", cursor: "pointer", transition: "background-color 0.3s ease-in-out" }}
          onClick={() => handleNavigation("/consulta")}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""} 
        >
          <i className="bi bi-clipboard-heart fs-1"></i>
          <h5 className="mt-2">Consultar com médico onlline</h5>
        </div>
      </div>
    </div>
  );
}
