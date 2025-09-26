import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge, Button, Table, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "@/app/context/AuthContext";
import { asaasApiClient } from "@/lib/api-client";

interface Pagamento {
  id: string;
  data: string;
  valor: string;
  situacao: "Pago" | "Pendente" | "Atrasado";
  link?: string | null;
  descricao?: string;
  cliente?: string;
}

export default function PaginaControlePagamento() {
  const [pagamentosPassados, setPagamentosPassados] = useState<Pagamento[]>([]);
  const [pagamentosPendentes, setPagamentosPendentes] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const carregarPagamentos = async () => {
      console.log(user?.cpf)
      if (!user?.cpf && !user?.email) return;

      setLoading(true);
      setError(null);

      try {
        let todasCobrancas: any[] = [];

        // Se tiver CPF, usa a função otimizada que busca tudo de uma vez
        if (user.cpf) {
          const response = await asaasApiClient.buscarTodasCobrancasPorCpf(user.cpf);

          console.log(`Cobrancas encontradas para ${user.cpf}:`, response);
          if (response.success && response.data && response.data.length > 0) {
            todasCobrancas = response.data;
          }
        } else if (user.email) {
          // Fallback para email se não tiver CPF
          const clienteResponse = await asaasApiClient.buscarCliente({
            email: user.email
          });

          if (clienteResponse.data && clienteResponse.data.length > 0) {
            const clientes = clienteResponse.data;

            console.log(`Clientes encontrados para ${user.cpf}:`, clientes);
            for (const cliente of clientes) {
              try {
                const response = await asaasApiClient.buscarCobrancas({
                  customer: cliente.id,
                  limit: 100
                });

                if (response.data && response.data.length > 0) {
                  todasCobrancas.push(...response.data);
                }
              } catch (error) {
                console.warn(`Erro ao buscar cobranças do cliente ${cliente.id}:`, error);
              }
            }
          }
        }

        if (todasCobrancas.length === 0) {
          setPagamentosPassados([]);
          setPagamentosPendentes([]);
          return;
        }

        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);

        const processarPagamentos = todasCobrancas.map((cobranca: any): Pagamento => {
          const dataVencimento = new Date(cobranca.dueDate);

          let situacao: "Pago" | "Pendente" | "Atrasado";
          if (cobranca.status === "RECEIVED") {
            situacao = "Pago";
          } else if (dataVencimento < hoje) {
            situacao = "Atrasado";
          } else {
            situacao = "Pendente";
          }

          return {
            id: cobranca.id,
            data: new Date(cobranca.dueDate).toLocaleDateString("pt-BR"),
            valor: `R$ ${parseFloat(cobranca.value).toFixed(2).replace(".", ",")}`,
            situacao,
            link: cobranca.invoiceUrl || null,
            descricao: cobranca.description || "Cobrança",
            cliente: cobranca.customer?.name || user.email,
          };
        });

        // Separar pagamentos pagos dos pendentes/atrasados
        const passados = processarPagamentos.filter(
          (p: Pagamento) => p.situacao === "Pago"
        );
        const pendentes = processarPagamentos.filter(
          (p: Pagamento) => p.situacao === "Pendente" || p.situacao === "Atrasado"
        );

        setPagamentosPassados(passados);
        setPagamentosPendentes(pendentes);
      } catch (error) {
        console.error("Erro ao carregar pagamentos:", error);
        setError("Erro ao carregar pagamentos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    carregarPagamentos();
  }, [user?.cpf, user?.email]);


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

      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Carregando pagamentos...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Erro ao carregar pagamentos</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      {!loading && !error && (
        <>
          <div className="mb-5">
            <motion.h4
              className="fw-semibold mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Pagamentos Realizados
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
                {pagamentosPassados.length > 0 ? (
                  pagamentosPassados.map((p: Pagamento) => (
                    <tr key={p.id}>
                      <td>{p.data}</td>
                      <td>{p.valor}</td>
                      <td>{renderBadge(p.situacao)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center text-muted py-4">
                      Nenhum pagamento realizado encontrado
                    </td>
                  </tr>
                )}
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
              Pagamentos Pendentes
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
                {pagamentosPendentes.length > 0 ? (
                  pagamentosPendentes.map((p: Pagamento) => (
                    <tr key={p.id}>
                      <td>{p.data}</td>
                      <td>{p.valor}</td>
                      <td>{renderBadge(p.situacao)}</td>
                      <td>
                        {(p.situacao === "Pendente" || p.situacao === "Atrasado") && (
                          <div className="d-flex gap-2 flex-wrap">
                            {p.link ? (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleGerarLink(p.link)}
                              >
                                <i className="bi bi-link-45deg me-1"></i> Link
                              </Button>
                            ) : (
                              <span className="text-muted">Link não disponível</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Nenhum pagamento pendente ou em atraso
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
