import { useRouter } from "next/router";

export default function PaginaInicial() {
  const router = useRouter();

  return (
    <div className="container text-center mt-5">
      <h1>Olá, seja bem-vindo ao nosso sistema!</h1>
      <p>
        Aqui você pode efetuar vendas individuais ou empresariais, além de consultar relatórios para acompanhar seu desempenho.
        O que você deseja fazer hoje?
      </p>
      <div className="d-flex justify-content-center gap-3 mt-4">
        <div 
          className="card p-3 text-center"
          style={{ width: "200px", cursor: "pointer", transition: "background-color 0.3s ease-in-out" }}
          onClick={() => router.push("/telemedicina")}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
        >
          <i className="bi bi-person fs-1"></i>
          <h5 className="mt-2">Acessar Telemedicina</h5>
        </div>
        <div 
          className="card p-3 text-center"
          style={{ width: "200px", cursor: "pointer", transition: "background-color 0.3s ease-in-out" }}
          onClick={() => router.push("/paginaInicial")}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgb(181, 205, 0)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
        >
          <i className="bi bi-building fs-1"></i>
          <h5 className="mt-2">Portal de Vendas</h5>
        </div>
      </div>
    </div>
  );
}
