import { useEffect, useState } from "react";
import { Table, Button, Spinner, Form } from "react-bootstrap";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

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
    const [vidas, setVidas] = useState<Vida[]>([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const selectedEmpresaNome = empresas.find(e => e.idEmpresa === selectedEmpresa)?.nomeEmpresa || "Todas as Empresas";

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


    const handleFilterChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value;

        if (selectedValue === "") {
            setSelectedEmpresa(null);
            setLoading(true);

            try {
                const response = await fetch(`/api/buscarVidaEmpresa`);
                const data: Vida[] = await response.json();
                setVidas(data);
            } catch (error) {
                console.error("Erro ao buscar todas as vidas:", error);
                setVidas([]);
            } finally {
                setLoading(false);
            }
        } else {
            const idEmpresa = parseInt(selectedValue);
            setSelectedEmpresa(idEmpresa);
            setLoading(true);

            try {
                const response = await fetch(`/api/buscarVidaEmpresa?idEmpresa=${idEmpresa}`);
                const data: Vida[] = await response.json();
                setVidas(data);
            } catch (error) {
                console.error("Erro ao buscar vidas:", error);
                setVidas([]);
            } finally {
                setLoading(false);
            }
        }
    };

    const generatePdf = (empresaNome: string, vidas: Vida[]) => {
        const doc = new jsPDF();

        // Título com o nome da empresa
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(empresaNome, 10, 20);

        // Adicionar as colunas
        const columnTitles = ["Nome", "CPF", "Data de Nascimento", "UF", "Gênero"];
        let yPosition = 30;
        doc.setFontSize(10);

        // Títulos das colunas
        columnTitles.forEach((title, index) => {
            doc.text(title, 10 + index * 40, yPosition);
        });
        yPosition += 10;

        // Adicionar as linhas
        vidas.forEach((vida) => {
            doc.text(vida.nome, 10, yPosition);
            doc.text(vida.cpf, 50, yPosition);
            doc.text(vida.nascimento, 90, yPosition);
            doc.text(vida.uf, 130, yPosition);
            doc.text(vida.genero, 170, yPosition);
            yPosition += 10;
        });

        // Adicionar a data/hora no final
        const now = new Date();
        const footerText = `Gerado em: ${now.toLocaleString()}`;
        doc.setFontSize(8);
        doc.text(footerText, 10, 290);

        // Salvar o PDF
        doc.save("relatorio.pdf");
    };

    const generateExcel = (empresaNome: string, vidas: Vida[]) => {
        const data = vidas.map((vida) => ({
            Nome: vida.nome,
            CPF: vida.cpf,
            "Data de Nascimento": vida.nascimento,
            UF: vida.uf,
            Gênero: vida.genero,
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, empresaNome);

        XLSX.writeFile(workbook, "relatorio.xlsx");
    };

    return (
        <div style={{ padding: "2rem", minHeight: "100vh" }}>
            <h2 style={{ textAlign: "center", marginBottom: "2rem", color: "#343a40" }}>
                Gestão de Empresas Cadastradas
            </h2>

            <Form.Group style={{ marginBottom: "1.5rem", maxWidth: "400px", margin: "0 auto" }}>
                <Form.Label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                    Selecione uma empresa
                </Form.Label>
                <Form.Select
                    onChange={handleFilterChange}
                    value={selectedEmpresa || ""}
                    style={{
                        padding: "0.75rem",
                        fontSize: "1rem",
                        border: "1px solid #ced4da",
                        borderRadius: "0.375rem",
                    }}
                >
                    <option value="">Selecione uma empresa:</option>
                    {empresas?.map((empresa) => (
                        <option key={empresa.idEmpresa} value={empresa.idEmpresa}>
                            {empresa.nomeEmpresa}
                        </option>
                    ))}

                </Form.Select>
            </Form.Group>

            <div style={{ textAlign: "right", marginTop: "1rem" }}>
                <Button
                    variant="success"
                    onClick={() => generatePdf(selectedEmpresaNome, vidas)}
                    style={{ marginRight: "1rem" }}
                >
                    Gerar PDF
                </Button>
                <Button
                    variant="success"
                    onClick={() => generateExcel(selectedEmpresaNome, vidas)}
                >
                    Gerar Excel
                </Button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (

                <Table
                    striped
                    bordered
                    hover
                    style={{
                        marginTop: "2rem",
                        backgroundColor: "#ffffff",
                        borderRadius: "0.375rem",
                        overflow: "hidden",
                        borderCollapse: "separate",
                        borderSpacing: "0",
                    }}
                >

                    <thead
                        style={{
                            backgroundColor: "#343a40",
                            color: "#ffffff",
                            textAlign: "center",
                            fontWeight: "bold",
                        }}
                    >
                        <tr>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Data de Nascimento</th>
                            <th>UF</th>
                            <th>Gênero</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(vidas) &&
                            vidas.map((vida) => (
                                <tr key={vida.idVida}>
                                    <td>{vida.nome}</td>
                                    <td>{vida.cpf}</td>
                                    <td>{vida.nascimento}</td>
                                    <td>{vida.uf}</td>
                                    <td>{vida.genero}</td>
                                    <td style={{ textAlign: "center" }}>
                                        <Button variant="outline-primary" style={{ marginRight: "0.5rem" }}>
                                            Editar
                                        </Button>
                                        <Button variant="outline-danger">Deletar</Button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
}
