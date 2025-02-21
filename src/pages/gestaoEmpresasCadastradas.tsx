import RelatorioEmpresaModal from "@/components/relatorioEmpresaModal/relatorioEmpresaModal";
import { useEffect, useState } from "react";
import { Table, Button, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap";

interface Vida {
    idVida: number;
    nome: string;
    cpf: string;
    nascimento: string;
    uf: string;
    genero: string;
}

interface Empresa {
    idEmpresa: number;
    nomeEmpresa: string;
}

export default function GestaoEmpresasCadastradas() {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [vidasPorEmpresa, setVidasPorEmpresa] = useState<{ [key: number]: Vida[] }>({});
    const [empresasAbertas, setEmpresasAbertas] = useState<{ [key: number]: boolean }>({});
    const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
    const [showRelatorio, setShowRelatorio] = useState(false);
    const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);
    const [vidasDaEmpresa, setVidasDaEmpresa] = useState<Vida[]>([]);


    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const response = await fetch("/api/buscarEmpresa");
                const data: Empresa[] = await response.json();
                setEmpresas(data);
            } catch (error) {
                console.error("Erro ao buscar empresas:", error);
            }
        };

        fetchEmpresas();
    }, []);

    const toggleEmpresa = async (empresaId: number) => {
        setEmpresasAbertas(prev => ({
            ...prev,
            [empresaId]: !prev[empresaId],
        }));

        if (!vidasPorEmpresa[empresaId]) {
            setLoading(prev => ({ ...prev, [empresaId]: true }));
            try {
                const response = await fetch(`/api/buscarVidaEmpresa?idEmpresa=${empresaId}`);
                const data: Vida[] = await response.json();
                setVidasPorEmpresa(prev => ({ ...prev, [empresaId]: Array.isArray(data) ? data : [] }));
            } catch (error) {
                console.error("Erro ao buscar vidas:", error);
                setVidasPorEmpresa(prev => ({ ...prev, [empresaId]: [] }));
            } finally {
                setLoading(prev => ({ ...prev, [empresaId]: false }));
            }
        }
    };

    const gerarRelatorio = async (empresa: Empresa) => {
        setEmpresaSelecionada(empresa);
        setShowRelatorio(true);

        try {
            const response = await fetch(`/api/buscarVidaEmpresa?idEmpresa=${empresa.idEmpresa}`);
            const data: Vida[] = await response.json();
            setVidasDaEmpresa(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao buscar vidas:", error);
            setVidasDaEmpresa([]);
        }
    };


    return (
        <div style={{ padding: "2rem", minHeight: "100vh" }}>
            <h2 style={{ textAlign: "center", marginBottom: "1rem", color: "#343a40" }}>
                Gestão de Empresas Cadastradas
            </h2>

            {empresas.length === 0 ? (
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <Table striped bordered hover style={{ marginTop: "2rem", backgroundColor: "#ffffff" }}>
                    <thead style={{ backgroundColor: "#343a40", color: "#ffffff", textAlign: "center" }}>
                        <tr>
                            <th style={{ width: "50px" }}></th>
                            <th>Nome da Empresa</th>
                            <th style={{ textAlign: "center" }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {empresas.map((empresa) => (
                            <>
                                <tr key={empresa.idEmpresa}>
                                    <td className="align-middle text-center" style={{ cursor: "pointer" }} onClick={() => toggleEmpresa(empresa.idEmpresa)}>
                                        <i className={`bi ${empresasAbertas[empresa.idEmpresa] ? "bi-chevron-down" : "bi-chevron-right"}`} style={{ fontSize: "1.2rem" }}></i>
                                    </td>

                                    <td className="align-middle" style={{ cursor: "pointer" }} onClick={() => toggleEmpresa(empresa.idEmpresa)}>
                                        {empresa.nomeEmpresa}
                                    </td>
                                    <td className="align-middle text-center">
                                        {/* Botão Editar */}
                                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-editar">Editar Dados</Tooltip>}>
                                            <Button
                                                variant="outline-primary"
                                                className="me-2"
                                                style={{ backgroundColor: "white", borderColor: "#007BFF", color: "#007BFF" }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#007BFF";
                                                    e.currentTarget.style.color = "white";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "white";
                                                    e.currentTarget.style.color = "#007BFF";
                                                }}
                                            >
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                        </OverlayTrigger>

                                        {/* Botão Inativar */}
                                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-inativar">Inativar</Tooltip>}>
                                            <Button
                                                variant="outline-warning"
                                                className="me-2"
                                                style={{ backgroundColor: "white", borderColor: "#FFC107", color: "#FFC107" }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#FFC107";
                                                    e.currentTarget.style.color = "black";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "white";
                                                    e.currentTarget.style.color = "#FFC107";
                                                }}
                                            >
                                                <i className="bi bi-eye-slash-fill"></i>
                                            </Button>
                                        </OverlayTrigger>

                                        {/* Botão Gerar Cobrança */}
                                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-cobranca">Gerar Cobrança</Tooltip>}>
                                            <Button
                                                variant="outline-success"
                                                className="me-2"
                                                style={{ backgroundColor: "white", borderColor: "#28A745", color: "#28A745" }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#28A745";
                                                    e.currentTarget.style.color = "white";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "white";
                                                    e.currentTarget.style.color = "#28A745";
                                                }}
                                            >
                                                <i className="bi bi-cash-stack"></i>
                                            </Button>
                                        </OverlayTrigger>

                                        {/* Botão Gerar Relatório */}
                                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-relatorio">Gerar Relatório</Tooltip>}>
                                            <Button
                                                variant="outline-info"
                                                style={{ backgroundColor: "white", borderColor: "#17A2B8", color: "#17A2B8" }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#17A2B8";
                                                    e.currentTarget.style.color = "white";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "white";
                                                    e.currentTarget.style.color = "#17A2B8";
                                                }}
                                                onClick={() => gerarRelatorio(empresa)}
                                            >
                                                <i className="bi bi-file-earmark-bar-graph-fill"></i>
                                            </Button>
                                        </OverlayTrigger>
                                    </td>

                                </tr>


                                {empresasAbertas[empresa.idEmpresa] && (
                                    <tr>
                                        <td colSpan={3}>
                                            <div style={{ padding: "10px" }}>
                                                <h5>Vidas da Empresa</h5>
                                                {loading[empresa.idEmpresa] ? (
                                                    <div style={{ textAlign: "center", padding: "1rem" }}>
                                                        <Spinner animation="border" variant="primary" />
                                                    </div>
                                                ) : vidasPorEmpresa[empresa.idEmpresa]?.length > 0 ? (
                                                    <Table striped bordered hover>
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Nome</th>
                                                                <th>CPF</th>
                                                                <th>Data de Nascimento</th>
                                                                <th>UF</th>
                                                                <th>Gênero</th>
                                                                <th>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {vidasPorEmpresa[empresa.idEmpresa].map((vida, index) => (
                                                                <tr key={vida.idVida}>
                                                                    <td>{index + 1}</td>
                                                                    <td>{vida.nome}</td>
                                                                    <td>{vida.cpf}</td>
                                                                    <td>{vida.nascimento}</td>
                                                                    <td>{vida.uf}</td>
                                                                    <td>{vida.genero}</td>
                                                                    <td style={{ textAlign: "center" }}>
                                                                        <Button variant="outline-primary" style={{ marginRight: "0.5rem" }}>Editar</Button>
                                                                        <Button variant="outline-danger">Deletar</Button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                ) : (
                                                    <p style={{ textAlign: "center", color: "gray" }}>Nenhuma vida encontrada para esta empresa.</p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </Table>
            )}
            <RelatorioEmpresaModal
                show={showRelatorio}
                onClose={() => setShowRelatorio(false)}
                empresa={empresaSelecionada}
                vidas={vidasDaEmpresa}
            />

        </div>
    );
}
