"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Container, Form, Row, Col, Card, Button, Table, Badge } from "react-bootstrap";
import '@/styles/relatorioVendas.css';
import { useReactToPrint } from "react-to-print";
import { BsFileEarmarkPdf } from "react-icons/bs";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { motion } from "framer-motion";
import { vendaTelemedicinaApi, instituicoesApi, usuariosApi } from "@/lib/api-client";
import { useAuth } from "@/app/context/AuthContext";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function RelatorioVendas() {
  type Venda = {
    idVenda: number;
    id_cliente: number;
    nome_cliente: string;
    data: string;
    valor: string;
    forma_pagamento: string;
    status_pagamento: string;
    data_pagamento: string | null;
  };


  const [vendas, setVendas] = useState<Venda[]>([]);
  const [filtro, setFiltro] = useState("mes");
  const [mesSelecionado, setMesSelecionado] = useState("02");
  const [quinzenaSelecionada, setQuinzenaSelecionada] = useState("1");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [instituicoes, setInstituicoes] = useState<Array<{ id: number; nome: string }>>([]);
  const [instituicaoFiltro, setInstituicaoFiltro] = useState<string>("");
  const [vendedores, setVendedores] = useState<Array<{ id: number; nome: string }>>([]);
  const [vendedorFiltro, setVendedorFiltro] = useState<string>("");
  const [statusDistribuicao, setStatusDistribuicao] = useState<Record<string, number>>({});
  const [semDados, setSemDados] = useState(false);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const relatorioRef = useRef<HTMLDivElement>(null);
  const gerarPDF = useReactToPrint({
    content: () => relatorioRef.current!,
    documentTitle: "Relatorio de Vendas",
    print: (target: any) => new Promise((resolve) => resolve(target)),
  } as unknown as any);


  // Carrega instituições (somente admin)
  useEffect(() => {
    if (user?.perfil === 'admin') {
      instituicoesApi.listar().then((data: any) => {
        const lista = Array.isArray(data) ? data : data?.items || [];
        const mapped = lista.map((i: any) => ({ id: i.idInstituicao || i.id || i.id_instituicao, nome: i.nomeInstituicao || i.nome })).filter((i: any) => i.id && i.nome);
        setInstituicoes(mapped);
      }).catch(err => console.error('Erro ao listar instituições', err));
    }
  }, [user]);

  const carregarVendas = async () => {
    setLoading(true);
    setErroMsg(null);
    try {
      const perfil = user?.perfil || '';
      const filtros: any = {};
      if (perfil === 'vendedor') filtros.id_usuario = user?.id;
      if (perfil === 'admin') {
        if (instituicaoFiltro) filtros.id_instituicao = Number(instituicaoFiltro);
        if (vendedorFiltro) filtros.id_usuario = Number(vendedorFiltro);
      }
      if (perfil === 'gestor') { // gestor: usa sua instituicao e pode filtrar vendedor
        if (user?.id_instituicao) filtros.id_instituicao = user.id_instituicao;
        if (vendedorFiltro) filtros.id_usuario = Number(vendedorFiltro);
      }

      const response = await vendaTelemedicinaApi.consultar(undefined, filtros);
      if (response.success && response.data?.vendas) {
        const vendasFormatadas = response.data.vendas.map((venda: any) => ({
          idVenda: venda.idVenda,
          id_cliente: venda.id_cliente,
          nome_cliente: venda.nome_cliente || venda.cliente?.nome,
          data: venda.criado_em,
          valor: venda.valor_venda,
          forma_pagamento: venda.forma_pagamento,
          status_pagamento: venda.situacao_pagamento,
          data_pagamento: venda.situacao_pagamento === 'RECEIVED' ? venda.criado_em : null,
          id_usuario: venda.id_usuario,
          nome_usuario: venda.nome_usuario,
          id_instituicao: venda.id_instituicao,
        }));
        setVendas(vendasFormatadas);
        setSemDados(vendasFormatadas.length === 0);
        const vendedoresApi = response.data?.vendedores || [];
        setVendedores(vendedoresApi.map((v: any) => ({ id: v.id, nome: v.nome })));
        setStatusDistribuicao(response.data?.statusDistribuicao || {});
      } else {
        setVendas([]);
        setSemDados(true);
      }
    } catch (error: any) {
      console.error('Erro ao carregar vendas', error);
      setErroMsg(error?.message || 'Erro ao carregar dados');
      setVendas([]);
      setSemDados(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVendas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, instituicaoFiltro, vendedorFiltro]);

  // Carregar vendedores quando admin seleciona instituição ou quando gestor carrega página
  useEffect(() => {
    const perfil = user?.perfil || '';
    if (perfil === 'admin' && instituicaoFiltro) {
      usuariosApi.buscar().then((data: any) => {
        const lista = Array.isArray(data) ? data : data?.data || data?.usuarios || [];
        const filtrados = lista.filter((u: any) => u.id_instituicao === Number(instituicaoFiltro));
        setVendedores(filtrados.map((u: any) => ({ id: u.idUsuario || u.id, nome: u.nome })));
      }).catch(err => console.error('Erro ao buscar usuários', err));
    } else if (perfil === 'gestor' && user?.id_instituicao) {
      usuariosApi.buscar().then((data: any) => {
        const lista = Array.isArray(data) ? data : data?.data || data?.usuarios || [];
        const filtrados = lista.filter((u: any) => u.id_instituicao === user.id_instituicao);
        setVendedores(filtrados.map((u: any) => ({ id: u.idUsuario || u.id, nome: u.nome })));
      }).catch(err => console.error('Erro ao buscar usuários', err));
    }
  }, [user, instituicaoFiltro]);

  const vendasFiltradas = vendas.filter((venda) => {
    const dataPagamento = venda.data_pagamento; // ✅ Usa diretamente a string formatada da API
    if (!dataPagamento) return false;
    const mesPagamento = dataPagamento.split("/")[1]; // ✅ Extrai o mês da string "DD/MM/YYYY"
    const diaPagamento = parseInt(dataPagamento.split("/")[0]); // ✅ Extrai o dia

    if (filtro === "mes") return mesPagamento === mesSelecionado;
    if (filtro === "quinzenal") return mesPagamento === mesSelecionado && (diaPagamento <= 15 ? "1" : "2") === quinzenaSelecionada;

    return false;
  });

  const valorTotalVendas = vendasFiltradas.reduce((acc, venda) => acc + parseFloat(venda.valor), 0);

  const totalVendas = vendasFiltradas.length;

  const ticketMedio = totalVendas > 0 ? valorTotalVendas / totalVendas : 0;

  const vendasPorDia = vendasFiltradas.reduce((acc, venda) => {
    acc[venda.data] = (acc[venda.data] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vendasPorPagamento = vendasFiltradas.reduce((acc, venda) => {
    acc[venda.forma_pagamento] = (acc[venda.forma_pagamento] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const vendasPorVendedor = useMemo(() => {
    return vendasFiltradas.reduce((acc, v: any) => {
      if (!v.nome_usuario) return acc;
      acc[v.nome_usuario] = (acc[v.nome_usuario] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [vendasFiltradas]);

  const statusLabels = Object.keys(statusDistribuicao);
  const statusValues = Object.values(statusDistribuicao);
  const nomeDoMes = (mes: string) => {
    const numeroMes = parseInt(mes) - 1;
    return new Date(2025, numeroMes).toLocaleString("pt-BR", { month: "long" });
  };

  return (
    <Container className="mt-4 dashboard-relatorio">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <div className="d-flex justify-content-between align-items-center mb-3 rv-header-actions">
          <h2 className="fw-semibold" style={{ fontSize: 26, color: '#2f3b52' }}>Dashboard de Vendas</h2>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={carregarVendas} disabled={loading}>Atualizar</Button>
            <Button variant="danger" size="sm" onClick={() => gerarPDF()} title="Exportar PDF">
              <BsFileEarmarkPdf size={18} />
            </Button>
          </div>
        </div>

        <div ref={relatorioRef}>
          <div className="rv-grid-metrics">
            <div className="rv-metric-card">
              <div className="rv-metric-label">Vendas</div>
              <div className="rv-metric-value">{totalVendas}</div>
            </div>
            <div className="rv-metric-card">
              <div className="rv-metric-label">Faturamento</div>
              <div className="rv-metric-value">R$ {valorTotalVendas.toFixed(2)}</div>
            </div>
            <div className="rv-metric-card">
              <div className="rv-metric-label">Ticket Médio</div>
              <div className="rv-metric-value">R$ {ticketMedio.toFixed(2)}</div>
            </div>
            <div className="rv-metric-card">
              <div className="rv-metric-label">Período</div>
              <div className="rv-metric-value" style={{ fontSize: 18 }}>{filtro === 'mes' ? nomeDoMes(mesSelecionado) : `${nomeDoMes(mesSelecionado)} · ${quinzenaSelecionada}ª`}</div>
            </div>
            <div className="rv-metric-card">
              <div className="rv-metric-label">Status (Top)</div>
              <div className="rv-badge-list">
                {statusLabels.slice(0,4).map(s => (
                  <Badge key={s} bg="secondary">{s}:{statusDistribuicao[s]}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="rv-filters-bar mb-4">
            <Row className="g-3">
              {user?.perfil === 'admin' && (
                <Col md={3} sm={6} xs={12}>
                  <Form.Label className="small text-uppercase fw-semibold">Instituição</Form.Label>
                  <Form.Select size="sm" value={instituicaoFiltro} onChange={(e) => setInstituicaoFiltro(e.target.value)}>
                    <option value="">Todas</option>
                    {instituicoes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                  </Form.Select>
                </Col>
              )}
              {(user?.perfil === 'admin' || user?.perfil === 'gestor') && (
                <Col md={3} sm={6} xs={12}>
                  <Form.Label className="small text-uppercase fw-semibold">Vendedor</Form.Label>
                  <Form.Select size="sm" value={vendedorFiltro} onChange={(e) => setVendedorFiltro(e.target.value)}>
                    <option value="">Todos</option>
                    {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                  </Form.Select>
                </Col>
              )}
              <Col md={2} sm={6} xs={12}>
                <Form.Label className="small text-uppercase fw-semibold">Filtro</Form.Label>
                <Form.Select size="sm" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                  <option value="mes">Mês</option>
                  <option value="quinzenal">Quinzenal</option>
                </Form.Select>
              </Col>
              <Col md={2} sm={6} xs={12}>
                <Form.Label className="small text-uppercase fw-semibold">Mês</Form.Label>
                <Form.Select size="sm" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => {
                    const mes = (i + 1).toString().padStart(2, '0');
                    return <option key={mes} value={mes}>{new Date(2025, i).toLocaleString('pt-BR', { month: 'long' })}</option>;
                  })}
                </Form.Select>
              </Col>
              {filtro === 'quinzenal' && (
                <Col md={2} sm={6} xs={12}>
                  <Form.Label className="small text-uppercase fw-semibold">Quinzena</Form.Label>
                  <Form.Select size="sm" value={quinzenaSelecionada} onChange={(e) => setQuinzenaSelecionada(e.target.value)}>
                    <option value="1">1ª</option>
                    <option value="2">2ª</option>
                  </Form.Select>
                </Col>
              )}
            </Row>
          </div>
          {!semDados && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="rv-charts-grid">
                <div className="rv-chart-card">
                  <h6>Vendas por Dia</h6>
                  <Bar data={{ labels: Object.keys(vendasPorDia), datasets: [{ label: 'Vendas', data: Object.values(vendasPorDia), backgroundColor: '#4CAF50', borderRadius: 4 }] }} options={{ maintainAspectRatio: false, responsive: true, plugins:{ legend:{ display:false } } }} />
                </div>
                <div className="rv-chart-card">
                  <h6>Forma de Pagamento</h6>
                  <Pie data={{ labels: Object.keys(vendasPorPagamento), datasets: [{ data: Object.values(vendasPorPagamento), backgroundColor: ['#2f74ff','#36A2EB','#FFCE56','#8e24aa'], borderWidth:1 }] }} options={{ maintainAspectRatio:false, responsive:true, plugins:{ legend:{ position:'bottom' } } }} />
                </div>
                <div className="rv-chart-card">
                  <h6>Por Vendedor</h6>
                  <Bar data={{ labels: Object.keys(vendasPorVendedor), datasets: [{ label: 'Vendas', data: Object.values(vendasPorVendedor), backgroundColor: '#8e24aa', borderRadius:4 }] }} options={{ maintainAspectRatio:false, responsive:true, indexAxis:'y', plugins:{ legend:{ display:false } } }} />
                </div>
                <div className="rv-chart-card">
                  <h6>Status Pagamento</h6>
                  <Pie data={{ labels: statusLabels, datasets: [{ data: statusValues, backgroundColor: ['#0288d1', '#c62828', '#2e7d32', '#ffb300', '#6d4c41'], borderWidth:1 }] }} options={{ maintainAspectRatio:false, responsive:true, plugins:{ legend:{ position:'bottom' } } }} />
                </div>
              </div>
            </motion.div>
          )}
          {semDados && (
            <div className="text-center py-5" style={{ background:'#fff', border:'1px solid #e3e8ef', borderRadius:10 }}>
              <h5 className="mb-2" style={{ color:'#2f3b52' }}>Sem dados para o período</h5>
              <p className="text-muted mb-3" style={{ fontSize:14 }}>Ajuste os filtros acima ou tente outro mês.</p>
              <Button size="sm" variant="outline-secondary" onClick={carregarVendas} disabled={loading}>Recarregar</Button>
              {erroMsg && <div className="mt-3 small text-danger">{erroMsg}</div>}
            </div>
          )}


          {!semDados && (
          <div className="rv-table-wrapper mt-4">
            <Table striped hover responsive size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  {(user?.perfil === 'admin' || user?.perfil === 'gestor') && <th>Vendedor</th>}
                  <th>Forma</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendasFiltradas.map((venda) => (
                  <tr key={venda.idVenda}>
                    <td>{venda.data}</td>
                    <td>{venda.nome_cliente}</td>
                    {(user?.perfil === 'admin' || user?.perfil === 'gestor') && <td>{(venda as any).nome_usuario || '-'}</td>}
                    <td>{venda.forma_pagamento}</td>
                    <td>R$ {parseFloat(venda.valor).toFixed(2)}</td>
                    <td><span className={`rv-status-badge rv-status-${venda.status_pagamento?.toLowerCase() || 'pendente'}`}>{venda.status_pagamento}</span></td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {loading && <div className="p-2 small text-muted">Atualizando...</div>}
          </div>
          )}
        </div>
      </motion.div>


    </Container>
  );
}
