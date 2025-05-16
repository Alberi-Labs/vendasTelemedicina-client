"use client";

import { useEffect, useState } from "react";
import { useAtendimento } from "@/app/context/AtendimentoContex";
import { useRouter, useSearchParams } from "next/navigation";
import Select from "react-select";
import { useAuth } from "@/app/context/AuthContext";


export default function Consulta() {
  const { setDados } = useAtendimento();
  const { user } = useAuth(); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAviso, setShowAviso] = useState(false);
  const [mensagemAviso, setMensagemAviso] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  interface Cliente {
    id: number;
    nome: string;
    cpf: string;
    telefone?: string;
    email?: string;
    data_nascimento?: string;
  }

  useEffect(() => {
    async function fetchClientes() {
      try {
        const res = await fetch("/api/usuario/buscarUsuario");
        const data = await res.json();
        console.log(data);
  
        if (data.success) {
          let clientesFiltrados = data.usuarios || [];
  
          if (user?.role === "cliente" || user?.role === "clientePJ") {
            clientesFiltrados = clientesFiltrados.filter((c: Cliente) => c.cpf === user.cpf);
  
            if (clientesFiltrados.length > 0) {
              const cliente = clientesFiltrados[0];
              const option = {
                value: cliente.id,
                label: `${cliente.nome} - ${cliente.cpf}`,
                ...cliente,
              };
              setClienteSelecionado(option);
              preencherDados(cliente);
            }
          }
  
          setClientes(clientesFiltrados);
  
          const cpfNaUrl = searchParams?.get("cpf");
          if (cpfNaUrl && user?.role !== "cliente" && user?.role !== "clientePJ") {
            const clienteEncontrado = clientesFiltrados.find(
              (cliente: Cliente) => cliente.cpf === cpfNaUrl
            );
            if (clienteEncontrado) {
              const option = {
                value: clienteEncontrado.id,
                label: `${clienteEncontrado.nome} - ${clienteEncontrado.cpf}`,
                ...clienteEncontrado,
              };
              setClienteSelecionado(option);
              preencherDados(clienteEncontrado);
            }
          }
        } else {
          console.error("Erro ao carregar clientes:", data.error);
        }
      } catch (error) {
        console.error("Erro ao conectar com a API:", error);
      } finally {
        setLoading(false);
      }
    }
  
    if (!user) return;
  
    if (user?.role === "cliente" || user?.role === "clientePJ"  && user?.saude_cor) {
      console.log(user);
      const clienteFake: Cliente = {
        id: user.id as number,
        nome: user.nome,
        cpf: user.cpf || "",
        telefone: user.num_celular,
        email: user.dsc_email,
        data_nascimento: user.dt_nascimento,
      };
  
      preencherDados(clienteFake);
  
      setClienteSelecionado({
        value: clienteFake.id,
        label: `${clienteFake.nome} - ${clienteFake.cpf}`,
        ...clienteFake,
      });
  
      setLoading(false);
      return; // ⛔ impede chamada da API
    }
  
    // ✅ só chama se user.saude_cor não for verdadeiro
    fetchClientes();
  }, [searchParams, user]);
  

  const preencherDados = (cliente: Cliente) => {
    console.log(cliente)

    setDados({
      nome: cliente.nome,
      cpf: cliente.cpf,
      telefone: cliente.telefone || "",
      email: cliente.email || "",
      nascimento: cliente.data_nascimento || "",
    });
  };

  // ✅ Atualiza quando o usuário seleciona um cliente manualmente
  const handleClienteChange = (selectedOption: any) => {
    setClienteSelecionado(selectedOption);
    if (selectedOption) preencherDados(selectedOption);
  };
  console.log(clienteSelecionado)

  const handleSubmit = () => {
    if (!clienteSelecionado) {
      alert("Selecione um cliente para continuar!");
      return;
    }

    const podeConsultar =
    (clienteSelecionado.plano_telemedicina && clienteSelecionado.creditos > 0) ||
    user?.saude_cor === true;
  
    if (!podeConsultar) {
      setMensagemAviso("Você não possui créditos ou o plano de telemedicina não está ativo.");
      setShowAviso(true);
      return;
    }
    const cpfLimpo = clienteSelecionado.cpf.replace(/\D/g, "");
    const url = `https://patient.docway.com.br/appointment/SulamericaVida/create?cartao=${cpfLimpo}`;
        router.push(url);
  };

  const formatarDataBR = (dataISO: string | undefined) => {
    console.log(dataISO)
    if (!dataISO) return "";  // Se a data não for fornecida, retorna uma string vazia
  
    const [ano, mes, dia] = dataISO.split("-");  // Divide a data no formato ISO (YYYY-MM-DD)
    
    // Retorna no formato DD/MM/YYYY
    return `${dia}/${mes}/${ano}`;
  };
  
  const formatarDataNascimento = (data: string | undefined): string => {
    if (!data) return "—";
  
    if (data.includes("/")) return data;
  
    if (data.includes("-")) {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    }
  
    return "Formato inválido";
  };
  

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center vh-100 px-3">
      <div className="row w-100 justify-content-center">
        <div className="col-sm-12 col-md-10 col-lg-6">
          <div className="card shadow-lg p-4">
            <div className="card-body">
              <h3 className="fw-bold mb-4 text-center">Realizar consulta</h3>

              <form onSubmit={(e) => e.preventDefault()} className="text-start">
                <div className="mb-3">
                  <label className="form-label">Selecione um cliente:</label>
                  <Select
                    options={(clientes || []).map((cliente) => ({
                      value: cliente.id,
                      label: `${cliente.nome} - ${cliente.cpf}`,
                      ...cliente,
                    }))}
                    isSearchable
                    placeholder="Buscar cliente..."
                    onChange={handleClienteChange}
                    isLoading={loading}
                    value={clienteSelecionado} // ✅ Mantém a seleção do CPF corretamente
                  />
                </div>

                {clienteSelecionado && (
                  <>
                    {[
                      { label: "Nome", value: clienteSelecionado.nome },
                      { label: "CPF", value: clienteSelecionado.cpf },
                      { label: "Telefone", value: clienteSelecionado.telefone },
                      { label: "Email", value: clienteSelecionado.email },
                      {
                        label: "Data de Nascimento",
                        value: formatarDataNascimento(user?.dt_nascimento) || formatarDataNascimento(clienteSelecionado?.data_nascimento) || "",
                      }                      
                    ].map((field, index) => (
                      <div key={index} className="mb-3">
                        <label className="form-label">{field.label}:</label>
                        <input
                          type="text"
                          className="form-control"
                          value={field.value || ""}
                          readOnly
                        />
                      </div>
                    ))}
                  </>
                )}

                <button
                  className="btn btn-primary w-100 mt-3 py-2 fw-bold"
                  onClick={handleSubmit}
                  disabled={!clienteSelecionado}
                >
                  Realizar consulta
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {showAviso && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-3">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Atenção</h5>
                <button type="button" className="btn-close" onClick={() => setShowAviso(false)} />
              </div>
              <div className="modal-body">
                <p>{mensagemAviso}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAviso(false)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
