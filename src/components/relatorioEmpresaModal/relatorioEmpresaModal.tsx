import React from "react";
import { Modal, Button, Table } from "react-bootstrap";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface Vida {
    idVida: number;
    nome: string;
    cpf: string;
    nascimento: string;
    uf: string;
    genero: string;
    created_at?: string;
}

interface Empresa {
    idEmpresa: number;
    nomeEmpresa: string;
}

interface RelatorioEmpresaModalProps {
    show: boolean;
    onClose: () => void;
    empresa: Empresa | null;
    vidas: Vida[];
}

const RelatorioEmpresaModal: React.FC<RelatorioEmpresaModalProps> = ({ show, onClose, empresa, vidas }) => {
    const formatarData = (data?: string): string => {
        if (!data) return "-";
        const dataObj = new Date(data);
        return isNaN(dataObj.getTime()) ? "-" : dataObj.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(/\//g, "-");
    };

    const gerarPDF = () => {
        if (!empresa) return;

        const doc = new jsPDF();
        doc.setFont("helvetica");

        // Título
        doc.setFontSize(18);
        doc.text(`Relatório da Empresa: ${empresa.nomeEmpresa}`, 14, 20);

        // Informações gerais
        doc.setFontSize(12);
        doc.text(`Total de Vidas: ${vidas.length}`, 14, 30);
        doc.text(`Valor Total: R$ ${(vidas.length * 29.90).toFixed(2)}`, 14, 40);

        // Criando a tabela
        const colunas = ["#", "Nome", "CPF", "Nascimento", "UF", "Gênero", "Data Cadastro"];
        const linhas = vidas.map((vida, index) => [
            index + 1,
            vida.nome,
            vida.cpf,
            vida.nascimento,
            vida.uf,
            vida.genero,
            formatarData(vida.created_at),
        ]);

        (doc as any).autoTable({
            head: [colunas],
            body: linhas,
            startY: 50,
            styles: { fontSize: 10, cellPadding: 2, overflow: "linebreak" },
            headStyles: { fillColor: [52, 58, 64], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
        });

        // Data e hora do relatório
        const dataAtual = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        doc.setFontSize(10);
        doc.text(`Relatório gerado em: ${dataAtual}`, 14, doc.internal.pageSize.height - 10);

        // Salvar o arquivo
        doc.save(`Relatorio_${empresa.nomeEmpresa}.pdf`);
    };

    return (
        <Modal show={show} onHide={onClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Relatório da Empresa</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {empresa && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Empresa: {empresa.nomeEmpresa}</h5>
                            <Button variant="danger" onClick={gerarPDF}>
                                <i className="bi bi-file-earmark-pdf-fill me-2"></i> Gerar PDF
                            </Button>
                        </div>

                        <p><strong>Total de Vidas:</strong> {vidas.length}</p>
                        <p><strong>Valor Total:</strong> R$ {(vidas.length * 29.90).toFixed(2)}</p>

                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nome</th>
                                    <th>CPF</th>
                                    <th>Data de Nascimento</th>
                                    <th>UF</th>
                                    <th>Gênero</th>
                                    <th>Data de Cadastro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vidas.length > 0 ? vidas.map((vida, index) => (
                                    <tr key={vida.idVida}>
                                        <td>{index + 1}</td>
                                        <td>{vida.nome}</td>
                                        <td>{vida.cpf}</td>
                                        <td>{vida.nascimento}</td>
                                        <td>{vida.uf}</td>
                                        <td>{vida.genero}</td>
                                        <td>{formatarData(vida.created_at)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center" }}>Nenhuma vida encontrada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>

                        <p className="text-end" style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
                            Relatório gerado em: {new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                        </p>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Fechar</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RelatorioEmpresaModal;
