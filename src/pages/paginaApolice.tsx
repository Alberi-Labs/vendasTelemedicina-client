import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "react-bootstrap";

export default function PaginaApolice() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleDownload = () => {
    alert("🔽 Download da carteirinha iniciado!");
  };

  return (
    <div className="container py-5">
      <motion.h1
        className="text-center mb-5 fw-bold"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Detalhes da Apólice
      </motion.h1>

      <div className="row justify-content-center gy-4">
        <motion.div
          className="col-12 col-md-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card shadow border-0 h-100">
            <div className="card-body">
              <h4 className="mb-3 fw-semibold">👤 Cliente</h4>
              <ul className="list-unstyled">
                <li><strong>Nome:</strong> ALINE LIMA SANTOS</li>
                <li><strong>CPF:</strong> 048.867.461-10</li>
                <li><strong>Data de nascimento:</strong> 24/08/1992</li>
                <li><strong>Idade na venda:</strong> 32</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="col-12 col-md-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card shadow border-0 h-100">
            <div className="card-body">
              <h4 className="mb-3 fw-semibold">📄 Contrato / Apólice</h4>
              <ul className="list-unstyled">
                <li><strong>Situação:</strong> Contrato aprovado</li>
                <li><strong>Vigência:</strong> 08/01/2025 - 08/01/2026</li>
                <li><strong>Data registro:</strong> 08/01/2025 - 15:13:02</li>
                <li><strong>Operação:</strong> 10294917</li>
                <li><strong>Certificado:</strong> 5002</li>
                <li><strong>Sorteio:</strong> 0</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="text-center mt-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Button
          variant="success"
          size="lg"
          onClick={handleDownload}
          className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-3"
        >
          <i className="bi bi-download fs-5"></i>
          Baixar Carteirinha
        </Button>
      </motion.div>
    </div>
  );
}
