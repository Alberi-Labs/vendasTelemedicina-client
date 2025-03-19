"use client";

import { useEffect, useState } from "react";
import { useAtendimento } from "@/app/context/AtendimentoContex";
import { useRouter } from "next/navigation";
import Select from "react-select";

export default function Consulta() {
    const { setDados } = useAtendimento();
    const router = useRouter();

    const [clientes, setClientes] = useState<Cliente[]>([]);
    interface Cliente {
        id: number;
        nome: string;
        cpf: string;
        telefone?: string;
        email?: string;
        nascimento?: string;
    }
    
    const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchClientes() {
            try {
                const res = await fetch("/api/cliente/consultar");
                const data = await res.json();

                if (data.success) {
                    setClientes(data.clientes);
                } else {
                    console.error("Erro ao carregar clientes:", data.error);
                } 
            } catch (error) {
                console.error("Erro ao conectar com a API:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchClientes();
    }, []);

    const handleClienteChange = (selectedOption: any) => {
        setClienteSelecionado(selectedOption);

        if (selectedOption) {
            setDados({
                nome: selectedOption.nome,
                cpf: selectedOption.cpf,
                telefone: selectedOption.telefone || "",
                email: selectedOption.email || "",
                nascimento: selectedOption.nascimento || "",
            });
        }
    };

    const handleSubmit = () => {
        if (!clienteSelecionado) {
            alert("Selecione um cliente para continuar!");
            return;
        }

        const url = `https://patient.docway.com.br/appointment/SulamericaVida/create?cartao=${clienteSelecionado.cpf}`;
        router.push(url);
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
                                        options={clientes.map((cliente) => ({
                                            value: cliente.id,
                                            label: `${cliente.nome} - ${cliente.cpf}`,
                                            ...cliente,
                                        }))}
                                        isSearchable
                                        placeholder="Buscar cliente..."
                                        onChange={handleClienteChange}
                                        isLoading={loading}
                                    />
                                </div>

                                {clienteSelecionado && (
                                    <>
                                        {[
                                            { label: "Nome", value: clienteSelecionado.nome },
                                            { label: "CPF", value: clienteSelecionado.cpf },
                                            { label: "Telefone", value: clienteSelecionado.telefone },
                                            { label: "Email", value: clienteSelecionado.email },
                                            { label: "Data de Nascimento", value: clienteSelecionado.nascimento, type: "date" },
                                        ].map((field, index) => (
                                            <div key={index} className="mb-3">
                                                <label className="form-label">{field.label}:</label>
                                                <input
                                                    type={field.type || "text"}
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
        </div>
    );
}
