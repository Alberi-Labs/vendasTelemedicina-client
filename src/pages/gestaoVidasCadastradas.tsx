import { useEffect, useState } from "react";
import { Table, Button, Spinner } from "react-bootstrap";

interface Vida {
    idVida: number;
    nome: string;
    cpf: string;
    nascimento: string;
    uf: string;
    genero: string;
}

export default function GestaoVidasCadastradas() {
    const [vidas, setVidas] = useState<Vida[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchVidas = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/buscarTodasVidas");
                const data: Vida[] = await response.json();
                setVidas(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Erro ao buscar vidas:", error);
                setVidas([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVidas();
    }, []);

    return (
        <div style={{ padding: "2rem", minHeight: "100vh" }}>
            <h2 style={{ textAlign: "center", marginBottom: "1rem", color: "#343a40" }}>
                Gestão de Vidas Cadastradas
            </h2>
            <h4 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Total de Vidas: {vidas.length}</h4>

            {loading ? (
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <Table striped bordered hover style={{ marginTop: "2rem", backgroundColor: "#ffffff" }}>
                    <thead style={{ backgroundColor: "#343a40", color: "#ffffff", textAlign: "center" }}>
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
                        {vidas.length > 0 ? vidas.map((vida, index) => (
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
                        )) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "1rem" }}>Nenhuma vida encontrada.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}
        </div>
    );
}