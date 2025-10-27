
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "react-bootstrap";
import { useAuth } from "@/app/context/AuthContext";

const beneficiosPerdidos = [
    "Consulta Online",
    "Assistência Funeral",
    "Desconto em Farmácia",
    "Assistência em caso de morte acidental",
];

const PaginaCancelamento: React.FC = () => {
    const [isMounted, setIsMounted] = useState(false);
    const { user } = useAuth();
    console.log("Dados do usuário:", user);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || !user) return null;

    // Normaliza o nome da instituição para facilitar a comparação
    console.log("Nome da instituição:", user.dsc_instituicao);
    const nomeInstituicao = (user.dsc_instituicao || "").normalize("NFD").replace(/[^a-zA-Z\s]/g, "").toLowerCase();
    const isVita = nomeInstituicao.includes("vita");
    const whatsappLink = isVita ? "https://wa.me/5565996187600" : "https://wa.me/556196363963";
    const whatsappNumber = isVita ? "(65) 99618-7600" : "(61) 9636-3963";

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
                                Para cancelar seus benefícios, você precisa entrar em contato conosco através do WhatsApp. Os seguintes benefícios serão cancelados:
                            </p>

                            <h5 className="fw-semibold mt-4">🚫 Benefícios que serão cancelados</h5>
                            <ul className="list-group list-group-flush">
                                {beneficiosPerdidos.map((beneficio, index) => (
                                    <li key={index} className="list-group-item d-flex align-items-center gap-2">
                                        <i className="bi bi-x-circle text-danger"></i>
                                        {beneficio}
                                    </li>
                                ))}
                            </ul>

                            <div className="alert alert-info mt-4">
                                <h6 className="fw-semibold mb-2">📱 Para cancelar seus benefícios:</h6>
                                <p className="mb-2">Entre em contato conosco pelo WhatsApp:</p>
                                <a 
                                    href={whatsappLink}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-success btn-lg d-flex align-items-center justify-content-center gap-2"
                                >
                                    <i className="bi bi-whatsapp"></i>
                                    {whatsappNumber}
                                </a>
                            </div>
                        </Card.Body>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default PaginaCancelamento;
