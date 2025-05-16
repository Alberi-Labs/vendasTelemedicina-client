import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge, Button, Table } from "react-bootstrap";
import { useAuth } from "@/app/context/AuthContext";

interface Pagamento {
  id: string;
  data: string;
  valor: string;
  situacao: "Pago" | "Pendente" | "Atrasado";
  link?: string | null;
}

export default function PaginaControlePagamento() {
  const [pagamentosPassados, setPagamentosPassados] = useState<Pagamento[]>([]);
  const [pagamentosFuturos, setPagamentosFuturos] = useState<Pagamento[]>([]);
  const { user } = useAuth(); 
  console.log(user);
  useEffect(() => {
    if (!user) return;
  
    const cobrancas = user.cobrancas || [];
  
    const pagos: Pagamento[] = cobrancas
      .filter((cob) => cob.ind_status_pagamento === "RECEIVED")
      .map((cob) => ({
        id: cob.seq_cobranca,
        data: cob.dat_vencimento,
        valor: `R$ ${cob.vlr_pagamento}`,
        situacao: "Pago",
        link: cob.dsc_link_pagamento,
      }));
  
    if (user.ind_status_pagamento === "RECEIVED" && user.data_contrato_vigencia_inicio) {
      pagos.unshift({
        id: "contrato-inicial",
        data: user.data_contrato_vigencia_inicio,
        valor: "R$ 39,90",
        situacao: "Pago",
        link: user.dsc_link_pagamento,
      });
    }
  
    const futuros: Pagamento[] = cobrancas
      .filter((cob) => cob.ind_status_pagamento === "PENDING")
      .map((cob) => ({
        id: cob.seq_cobranca,
        data: cob.dat_vencimento,
        valor: `R$ ${cob.vlr_pagamento}`,
        situacao: "Pendente",
        link: cob.dsc_link_pagamento,
      }));
  
    setPagamentosPassados(pagos);
    setPagamentosFuturos(futuros);
  }, [user]);
  

  const renderBadge = (situacao: Pagamento["situacao"]) => {
    const map = {
      Pago: "success",
      Pendente: "warning",
      Atrasado: "danger",
    };
    return <Badge bg={map[situacao]}>{situacao}</Badge>;
  };

  const handleGerarLink = (link: string | undefined | null) => {
    if (link) window.open(link, "_blank");
    else alert("Link de pagamento não disponível.");
  };

  const handleGerarBoleto = (id: string) => {
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
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleGerarLink(p.link)}
                      >
                        <i className="bi bi-link-45deg me-1"></i> Link
                      </Button>
                      {/* <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleGerarBoleto(p.id)}
                      >
                        <i className="bi bi-file-earmark-pdf me-1"></i> Boleto
                      </Button> */}
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
