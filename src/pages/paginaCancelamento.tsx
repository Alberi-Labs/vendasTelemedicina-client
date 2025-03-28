import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card } from "react-bootstrap";

interface Props {
    nome: string;
    cpf: string;
    dataNascimento: string;
}

const beneficiosPerdidos = [
    "Consulta Online",
    "Assistência Funeral",
    "Desconto em Farmácia",
    "Assistência em caso de morte acidental",
];

const PaginaCancelamento: React.FC<Props> = ({ nome, cpf, dataNascimento }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const handleCancelamento = () => {
        alert("❌ Benefícios cancelados com sucesso!");
    };

    return (
        <div className="container py-5">
            <motion.h1
                className="text-center mb-5 fw-bold text-danger"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Cancelamento de Benefícios
            </motion.h1>

            <div className="row justify-content-center">
                <motion.div
                    className="col-12 col-md-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="shadow border-0">
                        <Card.Body>
                            <p className="text-muted">
                                Ao prosseguir com o cancelamento, os seguintes benefícios serão encerrados imediatamente. Confira os dados abaixo e, caso esteja tudo certo, confirme sua decisão com responsabilidade.
                            </p>

                            <h5 className="fw-semibold mt-4">👤 Seus Dados</h5>
                            <ul className="list-unstyled">
                                <li><strong>Nome:</strong> {nome}</li>
                                <li><strong>CPF:</strong> {cpf}</li>
                                <li><strong>Data de Nascimento:</strong> {dataNascimento}</li>
                            </ul>

                            <h5 className="fw-semibold mt-4">🚫 Benefícios que serão cancelados</h5>
                            <ul className="list-group list-group-flush">
                                {beneficiosPerdidos.map((beneficio, index) => (
                                    <li key={index} className="list-group-item d-flex align-items-center gap-2">
                                        <i className="bi bi-x-circle text-danger"></i>
                                        {beneficio}
                                    </li>
                                ))}
                            </ul>


                            <div className="text-center mt-4">
                                <Button
                                    variant="danger"
                                    size="lg"
                                    className="px-4 py-2 rounded-3"
                                    onClick={handleCancelamento}
                                >
                                    Confirmar Cancelamento
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default PaginaCancelamento;