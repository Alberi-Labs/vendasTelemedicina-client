"use client";

import { useEffect, useState } from "react";
import { useAtendimento } from "@/app/context/AtendimentoContex";
import { useRouter, useSearchParams } from "next/navigation";
import Select from "react-select";

export default function Consulta() {
    const { setDados } = useAtendimento();
    const router = useRouter();
    const searchParams = useSearchParams(); 

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clienteSelecionado, setClienteSelecionado] = useState<any>(null); // ✅ Agora suporta `react-select`
    const [loading, setLoading] = useState(true);

    interface Cliente {
        id: number;
        nome: string;
        cpf: string;
        telefone?: string;
        email?: string;
        data_nascimento?: string; // ✅ Ajustado para o formato correto
    }

    useEffect(() => {
        async function fetchClientes() {
            try {
                const res = await fetch("/api/cliente/consultar");
                const data = await res.json();

                if (data.success) {
                    setClientes(data.clientes);

                    // ✅ Verifica se existe CPF na URL e seleciona o cliente no dropdown
                    const cpfNaUrl = searchParams?.get("cpf");
                    if (cpfNaUrl) {
                        const clienteEncontrado = data.clientes.find((cliente: Cliente) => cliente.cpf === cpfNaUrl);
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
        fetchClientes();
    }, [searchParams]); // ✅ Se a URL mudar, ele verifica novamente

    // ✅ Formata a data de nascimento de "YYYY-MM-DD" para "DD/MM/YYYY"
    const formatarData = (data: string | undefined) => {
        if (!data) return "";
        const [ano, mes, dia] = data.split("-");
        return `${dia}/${mes}/${ano}`;
    };

    // ✅ Preenche os dados do cliente automaticamente
    const preencherDados = (cliente: Cliente) => {
        setDados({
            nome: cliente.nome,
            cpf: cliente.cpf,
            telefone: cliente.telefone || "",
            email: cliente.email || "",
            nascimento: cliente.data_nascimento ? formatarData(cliente.data_nascimento) : "",
        });
    };

    // ✅ Atualiza quando o usuário seleciona um cliente manualmente
    const handleClienteChange = (selectedOption: any) => {
        setClienteSelecionado(selectedOption);
        if (selectedOption) preencherDados(selectedOption);
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
                                                value: formatarData(clienteSelecionado.data_nascimento) // ✅ Exibe a data formatada
                                            },
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
        </div>
    );
}
