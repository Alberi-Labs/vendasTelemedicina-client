import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge, Button, Table, Alert, Spinner, Form } from "react-bootstrap";
import { useAuth } from "@/app/context/AuthContext";
import { asaasApiClient, instituicoesApi, clientesApi } from "@/lib/api-client";

interface Pagamento {
  id: string;
  data: string;
  valor: string;
  situacao: "Pago" | "Pendente" | "Atrasado";
  link?: string | null;
  descricao?: string;
  cliente?: string;
}

interface Instituicao {
  idInstituicao: number;
  nomeInstituicao: string;
}

export default function PaginaControlePagamento() {
  const [pagamentosPassados, setPagamentosPassados] = useState<Pagamento[]>([]);
  const [pagamentosPendentes, setPagamentosPendentes] = useState<Pagamento[]>([]);

  // Novos estados para admin
  const [cobrancasMensais, setCobrancasMensais] = useState<Pagamento[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [instituicaoSelecionada, setInstituicaoSelecionada] = useState<number | ''>('');
  const [mesSelecionado, setMesSelecionado] = useState<number>(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [loadingMensais, setLoadingMensais] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const isAdmin = user?.perfil === 'admin' || user?.perfil === 'administrador';

  // Carregar instituições se for admin
  useEffect(() => {
    if (isAdmin) {
      const carregarInstituicoes = async () => {
        try {
          const response = await instituicoesApi.listar();
          if (response.success && response.instituicoes) {
            setInstituicoes(response.instituicoes);
          }
        } catch (error) {
          console.error('Erro ao carregar instituições:', error);
        }
      };
      carregarInstituicoes();
    }
  }, [isAdmin]);

  const carregarCobrancasMensais = async (idInstituicao?: number, mes?: number, ano?: number) => {
    // Se não for admin nem gestor nem vendedor, não carregar
    if (!isAdmin && user?.perfil !== 'gestor' && user?.perfil !== 'vendedor') return;

    setLoadingMensais(true);
    try {
      const response = await asaasApiClient.buscarCobrancasMesInstituicao({
        id_instituicao: idInstituicao,
        mes: mes || mesSelecionado,
        ano: ano || anoSelecionado,
        order: 'desc'
      });

      if (response?.success && response?.data) {
        // Buscar todos os clientes do banco para fazer o match
        const clientesResponse = await clientesApi.consultar();
        const clientesBanco = clientesResponse?.clientes || [];
        // Criar um mapa de id_asaas -> nome do cliente
        const mapClientesAsaas = new Map<string, string>();

        clientesBanco.forEach((cliente: any) => {
          if (cliente.id_asaas) {
            mapClientesAsaas.set(cliente.id_asaas, cliente.nome);
          }
        });

        const cobrancas = response.data.map((cobranca: any): Pagamento => {


          // Extrair o customer ID do Asaas (pode vir em diferentes estruturas)
          let customerId = '';
          if (cobranca.originalObject?.customer) {
            // Se customer é um objeto, pegar o id
            customerId = typeof cobranca.originalObject.customer === 'string'
              ? cobranca.originalObject.customer
              : cobranca.originalObject.customer.id || cobranca.originalObject.customer;
          } else if (cobranca.customer) {
            customerId = typeof cobranca.customer === 'string'
              ? cobranca.customer
              : cobranca.customer.id || cobranca.customer;
          }

          // Fazer match do customer (ID Asaas) com o cliente do banco
          const nomeCliente = mapClientesAsaas.get(customerId) || `Cliente ID: ${customerId}` || "Cliente não encontrado";

          return {
            id: cobranca.id,
            data: new Date(cobranca.dueDate).toLocaleDateString("pt-BR"),
            valor: `R$ ${parseFloat(cobranca.valor).toFixed(2).replace(".", ",")}`,
            situacao: cobranca.situacao,
            link: cobranca.invoiceUrl || null,
            descricao: cobranca.description || "Cobrança",
            cliente: nomeCliente,
          };
        });
        setCobrancasMensais(cobrancas);
      } else {
        setCobrancasMensais([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cobranças mensais:', error);
      setError('Erro ao carregar cobranças mensais. Verifique se o servidor backend está rodando.');
      setCobrancasMensais([]);
    } finally {
      setLoadingMensais(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      // Admin: só carrega instituições, não carrega cobranças automaticamente
      return;
    } else if (user?.perfil === 'gestor' || user?.perfil === 'vendedor') {
      // Gestor/Vendedor: carrega cobranças da própria instituição automaticamente
      if (user?.id_instituicao) {
        carregarCobrancasMensais(user.id_instituicao);
      }
    }
  }, [isAdmin, user?.perfil, user?.id_instituicao]);

  // Quando admin trocar instituição
  const handleInstituicaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const idInstituicao = value === '' ? undefined : Number(value);
    setInstituicaoSelecionada(value === '' ? '' : Number(value));
    carregarCobrancasMensais(idInstituicao, mesSelecionado, anoSelecionado);
  };

  const handleMesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoMes = Number(e.target.value);
    setMesSelecionado(novoMes);
    const idInstituicao = instituicaoSelecionada === '' ? undefined : instituicaoSelecionada;
    carregarCobrancasMensais(idInstituicao, novoMes, anoSelecionado);
  };

  const handleAnoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoAno = Number(e.target.value);
    setAnoSelecionado(novoAno);
    const idInstituicao = instituicaoSelecionada === '' ? undefined : instituicaoSelecionada;
    carregarCobrancasMensais(idInstituicao, mesSelecionado, novoAno);
  };

  useEffect(() => {
    // Só carregar pagamentos pessoais se NÃO for admin, gestor ou vendedor
    if (isAdmin || user?.perfil === 'gestor' || user?.perfil === 'vendedor') {
      return;
    }
    const carregarPagamentos = async () => {
      if (!user?.cpf && !user?.email) return;

      setLoading(true);
      setError(null);

      try {
        let todasCobrancas: any[] = [];

        // Se tiver CPF, usa a função otimizada que busca tudo de uma vez
        if (user.cpf) {
          const response = await asaasApiClient.buscarTodasCobrancasPorCpf(user.cpf);

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
            valor: `R$ ${parseFloat(cobranca.valor).toFixed(2).replace(".", ",")}`,
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
  }, [user?.cpf, user?.email, isAdmin, user?.perfil]);


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
          {/* Seções de pagamentos pessoais - só para usuários regulares */}
          {!isAdmin && user?.perfil !== 'gestor' && user?.perfil !== 'vendedor' && (
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

          {/* Seção para administradores/gestores/vendedores - Cobranças mensais */}
          {(isAdmin || user?.perfil === 'gestor' || user?.perfil === 'vendedor') && (
            <div className="mt-5">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-semibold">
                    {isAdmin 
                      ? "Cobranças do Mês - Visão Administrativa"
                      : "Cobranças do Mês - Minha Instituição"
                    }
                  </h4>
                  <div className="d-flex gap-2 align-items-center">
                    {/* Seletores de mês e ano */}
                    <Form.Select
                      value={mesSelecionado}
                      onChange={handleMesChange}
                      style={{ width: '120px' }}
                      disabled={loadingMensais}
                    >
                      <option value={1}>Janeiro</option>
                      <option value={2}>Fevereiro</option>
                      <option value={3}>Março</option>
                      <option value={4}>Abril</option>
                      <option value={5}>Maio</option>
                      <option value={6}>Junho</option>
                      <option value={7}>Julho</option>
                      <option value={8}>Agosto</option>
                      <option value={9}>Setembro</option>
                      <option value={10}>Outubro</option>
                      <option value={11}>Novembro</option>
                      <option value={12}>Dezembro</option>
                    </Form.Select>
                    
                    <Form.Select
                      value={anoSelecionado}
                      onChange={handleAnoChange}
                      style={{ width: '100px' }}
                      disabled={loadingMensais}
                    >
                      <option value={2023}>2023</option>
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </Form.Select>

                    {/* Seletor de instituição apenas para admin */}
                    {isAdmin && (
                      <Form.Select
                        value={instituicaoSelecionada}
                        onChange={handleInstituicaoChange}
                        style={{ width: '250px' }}
                        disabled={loadingMensais}
                      >
                        <option value="">Todas as Instituições</option>
                        {instituicoes.map((inst) => (
                          <option key={inst.idInstituicao} value={inst.idInstituicao}>
                            {inst.nomeInstituicao}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  </div>
                </div>

                {loadingMensais ? (
                  <div className="text-center my-4">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Carregando cobranças...</span>
                  </div>
                ) : (
                  <Table responsive bordered hover>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Valor</th>
                        <th>Situação</th>
                        <th>Descrição</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cobrancasMensais.length > 0 ? (
                        cobrancasMensais.map((p: Pagamento) => (
                          <tr key={p.id}>
                            <td>{p.data}</td>
                            <td>{p.cliente}</td>
                            <td>{p.valor}</td>
                            <td>{renderBadge(p.situacao)}</td>
                            <td>{p.descricao}</td>
                            <td>
                              {(p.situacao === "Pendente" || p.situacao === "Atrasado") && p.link ? (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleGerarLink(p.link)}
                                >
                                  <i className="bi bi-link-45deg me-1"></i> Link
                                </Button>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            {isAdmin 
                              ? (instituicaoSelecionada 
                                  ? `Nenhuma cobrança encontrada para a instituição selecionada`
                                  : `Nenhuma cobrança encontrada para este mês`)
                              : `Nenhuma cobrança encontrada para sua instituição neste mês`
                            }
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
