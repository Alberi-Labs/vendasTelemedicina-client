import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge, Button, Table } from "react-bootstrap";

interface Pagamento {
  id: number;
  data: string;
  valor: string;
  situacao: "Pago" | "Pendente" | "Atrasado";
}

export default function PaginaControlePagamento() {
  const [pagamentosPassados, setPagamentosPassados] = useState<Pagamento[]>([]);
  const [pagamentosFuturos, setPagamentosFuturos] = useState<Pagamento[]>([]);

  useEffect(() => {
    // Simula dados de pagamento
    setPagamentosPassados([
      { id: 1, data: "2024-12-08", valor: "R$ 120,00", situacao: "Pago" },
      { id: 2, data: "2024-11-08", valor: "R$ 120,00", situacao: "Pago" },
      { id: 3, data: "2024-10-08", valor: "R$ 120,00", situacao: "Pago" },
    ]);

    setPagamentosFuturos([
      { id: 4, data: "2025-04-08", valor: "R$ 120,00", situacao: "Pendente" },
      { id: 5, data: "2025-05-08", valor: "R$ 120,00", situacao: "Pendente" },
    ]);
  }, []);

  const renderBadge = (situacao: Pagamento["situacao"]) => {
    const map = {
      Pago: "success",
      Pendente: "warning",
      Atrasado: "danger",
    };
    return <Badge bg={map[situacao]}>{situacao}</Badge>;
  };

  const handleGerarLink = (id: number) => {
    alert(`🔗 Link de pagamento gerado para o pagamento #${id}`);
  };

  const handleGerarBoleto = (id: number) => {
    alert(`🧾 Boleto gerado para o pagamento #${id}`);
  };

  return (
    <div className="container py-5">
      <motion.h2
        className="text-center fw-bold mb-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Controle de Pagamentos
      </motion.h2>

      <div className="mb-5">
        <motion.h4
          className="fw-semibold mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Últimos Pagamentos
        </motion.h4>
        <Table responsive bordered hover>
          <thead>
            <tr>
              <th>Data</th>
              <th>Valor</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {pagamentosPassados.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.data).toLocaleDateString()}</td>
                <td>{p.valor}</td>
                <td>{renderBadge(p.situacao)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div>
        <motion.h4
          className="fw-semibold mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Próximos Pagamentos
        </motion.h4>
        <Table responsive bordered hover>
          <thead>
            <tr>
              <th>Data</th>
              <th>Valor</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagamentosFuturos.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.data).toLocaleDateString()}</td>
                <td>{p.valor}</td>
                <td>{renderBadge(p.situacao)}</td>
                <td>
                  {p.situacao === "Pendente" && (
                    <div className="d-flex gap-2 flex-wrap">
                      <Button variant="outline-primary" size="sm" onClick={() => handleGerarLink(p.id)}>
                        <i className="bi bi-link-45deg me-1"></i> Link
                      </Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => handleGerarBoleto(p.id)}>
                        <i className="bi bi-file-earmark-pdf me-1"></i> Boleto
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
