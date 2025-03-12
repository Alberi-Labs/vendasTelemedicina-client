"use client";

import { useEffect, useState } from "react";

export default function GestaoDeClientesCadastrados() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [editando, setEditando] = useState<{ [key: number]: boolean }>({});
  const [clienteEditado, setClienteEditado] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(false);

  // 🚀 Busca os clientes ao carregar a página
  useEffect(() => {
    async function fetchClientes() {
      try {
        const response = await fetch("/api/consultarClientes");
        const data = await response.json();
        if (data.success) {
          setClientes(data.clientes);
        } else {
          console.error("Erro ao buscar clientes:", data.error);
        }
      } catch (error) {
        console.error("Erro ao conectar com API:", error);
      }
    }

    fetchClientes();
  }, []);

  // 🔹 Função para habilitar edição de um cliente específico
  const handleEditar = (id: number) => {
    setEditando((prev) => ({ ...prev, [id]: true }));
    setClienteEditado(clientes.find((c: any) => c.id === id) || {});
  };

  // 🔹 Função para salvar as edições no banco
  const handleSalvar = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/editarCliente`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...clienteEditado }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Informações atualizadas com sucesso!");
        setEditando((prev) => ({ ...prev, [id]: false }));
        setClientes(clientes.map((c: any) => (c.id === id ? clienteEditado : c)));
      } else {
        alert("Erro ao atualizar informações.");
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">Gestão de Vendas e Clientes</h2>
      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>CPF</th>
            <th>Celular</th>
            <th>Nascimento</th>
            <th>Endereço</th>
            <th>Cidade</th>
            <th>Forma de Pagamento</th>
            <th>Status</th>
            <th>Confirmação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente: any) => (
            <tr key={cliente.id}>
              {[
                "nome",
                "email",
                "cpf",
                "celular",
                "nascimento",
                "endereco",
                "cidade",
                "forma_pagamento",
                "status_pagamento",
                "data_confirmacao_pagamento",
              ].map((campo) => (
                <td key={campo}>
                  {editando[cliente.id] ? (
                    <input
                      type="text"
                      className="form-control"
                      value={clienteEditado[campo] || ""}
                      onChange={(e) => setClienteEditado({ ...clienteEditado, [campo]: e.target.value })}
                    />
                  ) : (
                    cliente[campo]
                  )}
                </td>
              ))}
              <td>
                {editando[cliente.id] ? (
                  <button className="btn btn-success btn-sm" onClick={() => handleSalvar(cliente.id)} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar"}
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => handleEditar(cliente.id)}>
                    Editar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
