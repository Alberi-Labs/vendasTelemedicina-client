"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Container, Form, Row, Col, Card, Button, Table, Badge } from "react-bootstrap";
import '@/styles/relatorioVendas.css';
import { useReactToPrint } from "react-to-print";
import { BsFileEarmarkPdf } from "react-icons/bs";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { motion } from "framer-motion";
import { vendaTelemedicinaApiCompat as vendaTelemedicinaApi, instituicoesApi, usuariosApi } from "@/lib/api-client";
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
    nome_usuario?: string;
    link_pagamento?: string;
    id_assinatura_asaas?: string;
  };


  const [vendas, setVendas] = useState<Venda[]>([]);
  const [filtro, setFiltro] = useState("mes");
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    // Inicializa com o mês atual (formato 01-12)
    return (new Date().getMonth() + 1).toString().padStart(2, '0');
  });
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
  const [statusView, setStatusView] = useState<'todos'|'aprovados'|'nao-aprovados'|'pago'|'cancelada'|'aguardando_pagamento'>('todos');

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
        const lista = Array.isArray(data) ? data : data?.items || data?.instituicoes || [];
        // Debug: log bruto recebido
        console.log('📌 Instituições (bruto):', lista);
        const mapped = lista
          .map((i: any) => ({
            id: i.idInstituicao ?? i.id ?? i.id_instituicao,
            nome: i.nomeInstituicao ?? i.nome,
          }))
          .filter((i: any) => i.id && i.nome)
          .reduce((acc: {id:number; nome:string}[], cur: {id:number; nome:string}) => {
            if (!acc.find(a => a.id === cur.id)) acc.push(cur);
            return acc;
          }, [])
          .sort((a: {id:number; nome:string}, b: {id:number; nome:string}) => a.nome.localeCompare(b.nome));
        console.log('✅ Instituições (mapeadas):', mapped);
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

      const response = await vendaTelemedicinaApi.consultarVenda(filtros.id_usuario, { id_instituicao: filtros.id_instituicao });
      console.log('🔍 Response da API:', response);
      
      if (response.success && response.data?.vendas) {
        console.log('📊 Vendas recebidas:', response.data.vendas);
        const vendasFormatadas = response.data.vendas.map((venda: any) => ({
          idVenda: venda.idVenda,
          id_cliente: venda.id_cliente,
          nome_cliente: venda.nome_cliente,
          data: venda.criado_em,
          valor: venda.valor_venda,
          forma_pagamento: venda.forma_pagamento,
          status_pagamento: venda.situacao_pagamento,
          data_pagamento: venda.situacao_pagamento === 'RECEIVED' ? venda.criado_em : null,
          id_usuario: venda.id_usuario,
          nome_usuario: venda.nome_usuario,
          id_instituicao: venda.id_instituicao,
          link_pagamento: venda.link_pagamento,
        }));
        console.log('✅ Vendas formatadas:', vendasFormatadas);
        setVendas(vendasFormatadas);
        setSemDados(vendasFormatadas.length === 0);
        const vendedoresApi = response.data?.vendedores || [];
        if (vendedoresApi.length) {
          // Mantém lista completa de vendedores mesmo após aplicar filtro por um vendedor específico
          const novos = vendedoresApi.map((v: any) => ({ id: v.id, nome: v.nome }));
          setVendedores(prev => {
            // Cria um mapa para evitar duplicados e preservar/atualizar nomes
            const mapa = new Map<number, { id:number; nome:string }>();
            prev.forEach((v: {id:number; nome:string}) => mapa.set(v.id, v));
            novos.forEach((v: {id:number; nome:string}) => mapa.set(v.id, v));
            return Array.from(mapa.values()).sort((a,b)=> a.nome.localeCompare(b.nome));
          });
        }
        setStatusDistribuicao(response.data?.statusDistribuicao || {});
      } else {
        console.log('❌ Sem dados ou erro na resposta:', response);
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
    // Para admin sem instituição selecionada ou quando a resposta da API já traz vendedores, não buscar separadamente
    if (perfil === 'admin' && !instituicaoFiltro) {
      // Deixar vendedores vazios até selecionar instituição
      setVendedores([]);
    } else if (perfil === 'admin' && instituicaoFiltro) {
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

  const vendasFiltradas = useMemo(() => {
    const base = vendas.filter(v => {
      const dataVenda = v.data;
      if (!dataVenda) return false;
      const partes = dataVenda.split('/');
      if (partes.length !== 3) return false;
      const mesVenda = partes[1];
      const diaVenda = parseInt(partes[0]);
      if (filtro === 'mes' && mesVenda !== mesSelecionado) return false;
      if (filtro === 'quinzenal' && (mesVenda !== mesSelecionado || (diaVenda <= 15 ? '1':'2') !== quinzenaSelecionada)) return false;
      return true;
    });
    
    // Debug: mostrar todos os status únicos
    const statusUnicos = [...new Set(base.map(v => v.status_pagamento))];
    console.log('🔍 Status únicos encontrados:', statusUnicos);
    
    const aprovadosSet = new Set(['RECEIVED','CONFIRMED','RECEIVED_IN_CASH']);
    let filtradoStatus = base;
    if (statusView === 'aprovados') filtradoStatus = base.filter(v => aprovadosSet.has(v.status_pagamento));
    if (statusView === 'nao-aprovados') filtradoStatus = base.filter(v => !aprovadosSet.has(v.status_pagamento));
    if (statusView === 'pago') {
      filtradoStatus = base.filter(v => {
        const status = v.status_pagamento?.toLowerCase() || '';
        const isPago = aprovadosSet.has(v.status_pagamento) || 
               status.includes('pago') || 
               status.includes('paid') || 
               status.includes('received') ||
               status.includes('confirmed');
        return isPago;
      });
      console.log('🔍 Filtro PAGO aplicado:', {
        totalBase: base.length,
        filtradoPago: filtradoStatus.length,
        statusFiltrados: filtradoStatus.map(v => v.status_pagamento)
      });
    }
    if (statusView === 'cancelada') filtradoStatus = base.filter(v => v.status_pagamento?.toLowerCase().includes('cancel'));
    if (statusView === 'aguardando_pagamento') filtradoStatus = base.filter(v => v.status_pagamento?.toLowerCase().includes('pending') || v.status_pagamento?.toLowerCase().includes('aguardando'));
    return filtradoStatus;
  }, [vendas, filtro, mesSelecionado, quinzenaSelecionada, statusView]);

  const valorTotalVendas = useMemo(() => {
    return vendasFiltradas.reduce((acc, venda) => acc + parseFloat(venda.valor), 0);
  }, [vendasFiltradas]);

  const totalVendas = vendasFiltradas.length;

  const ticketMedio = useMemo(() => {
    return totalVendas > 0 ? valorTotalVendas / totalVendas : 0;
  }, [totalVendas, valorTotalVendas]);

  const vendasPorDia = useMemo(() => {
    return vendasFiltradas.reduce((acc, venda) => {
      acc[venda.data] = (acc[venda.data] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [vendasFiltradas]);

  const vendasPorPagamento = useMemo(() => {
    return vendasFiltradas.reduce((acc, venda) => {
      acc[venda.forma_pagamento] = (acc[venda.forma_pagamento] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [vendasFiltradas]);
  
  const vendasPorVendedor = useMemo(() => {
    return vendasFiltradas.reduce((acc, v: any) => {
      if (!v.nome_usuario) return acc;
      acc[v.nome_usuario] = (acc[v.nome_usuario] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [vendasFiltradas]);

  const statusLabels = useMemo(() => Object.keys(statusDistribuicao), [statusDistribuicao]);
  const statusValues = useMemo(() => Object.values(statusDistribuicao), [statusDistribuicao]);
  
  const nomeDoMes = useMemo(() => {
    return (mes: string) => {
      const numeroMes = parseInt(mes) - 1;
      return new Date(2025, numeroMes).toLocaleString("pt-BR", { month: "long" });
    };
  }, []);

  // Memoizar dados dos gráficos para evitar recriação constante
  const chartDataVendasPorDia = useMemo(() => ({
    labels: Object.keys(vendasPorDia),
    datasets: [{ 
      label: 'Vendas', 
      data: Object.values(vendasPorDia), 
      backgroundColor: '#4CAF50', 
      borderRadius: 4 
    }]
  }), [vendasPorDia]);

  const chartDataVendasPorPagamento = useMemo(() => ({
    labels: Object.keys(vendasPorPagamento),
    datasets: [{ 
      data: Object.values(vendasPorPagamento), 
      backgroundColor: ['#2f74ff','#36A2EB','#FFCE56','#8e24aa'], 
      borderWidth: 1 
    }]
  }), [vendasPorPagamento]);

  const chartDataVendasPorVendedor = useMemo(() => ({
    labels: Object.keys(vendasPorVendedor),
    datasets: [{ 
      label: 'Vendas', 
      data: Object.values(vendasPorVendedor), 
      backgroundColor: '#8e24aa', 
      borderRadius: 4 
    }]
  }), [vendasPorVendedor]);

  const chartDataStatusPagamento = useMemo(() => ({
    labels: statusLabels,
    datasets: [{ 
      data: statusValues, 
      backgroundColor: ['#0288d1', '#c62828', '#2e7d32', '#ffb300', '#6d4c41'], 
      borderWidth: 1 
    }]
  }), [statusLabels, statusValues]);

  // Opções dos gráficos memoizadas
  const chartOptionsBar = useMemo(() => ({
    maintainAspectRatio: false, 
    responsive: true, 
    plugins: { legend: { display: false } }
  }), []);

  const chartOptionsPie = useMemo(() => ({
    maintainAspectRatio: false, 
    responsive: true, 
    plugins: { legend: { position: 'bottom' as const } }
  }), []);

  const chartOptionsBarHorizontal = useMemo(() => ({
    maintainAspectRatio: false, 
    responsive: true, 
    indexAxis: 'y' as const, 
    plugins: { legend: { display: false } }
  }), []);

  // ==== CÁLCULOS AVANÇADOS PARA DASHBOARD ====
  const kpisAvancados = useMemo(() => {
    if (!vendasFiltradas.length) return null;
    // Faturamento numérico
    const faturamento = valorTotalVendas;
    // Agrupar por vendedor (valor)
    const porVendedorValor: Record<string,{total:number; valor:number}> = {};
    vendasFiltradas.forEach(v => {
      const key = v.nome_usuario || 'Sem Vendedor';
      if (!porVendedorValor[key]) porVendedorValor[key] = { total:0, valor:0};
      porVendedorValor[key].total += 1;
      porVendedorValor[key].valor += parseFloat(v.valor || '0');
    });
    const topVendedor = Object.entries(porVendedorValor)
      .sort((a,b) => b[1].valor - a[1].valor)[0];

    // Melhor dia por quantidade
    const melhorDia = Object.entries(vendasPorDia)
      .sort((a,b) => b[1]-a[1])[0];

    // Distribuição de status percentual
    const totalStatus = Object.values(statusDistribuicao).reduce((a,b)=>a+b,0) || 1;
    const statusPercent = Object.entries(statusDistribuicao).map(([k,v]) => ({
      status: k,
      count: v,
      pct: (v/totalStatus*100)
    })).sort((a,b)=>b.count-a.count).slice(0,4);

    // Média por dia (quantidade e valor)
    const diasUnicos = new Set(vendasFiltradas.map(v=>v.data));
    const mediaQtdDia = vendasFiltradas.length / (diasUnicos.size || 1);
    const mediaValorDia = faturamento / (diasUnicos.size || 1);

    // Formas de pagamento (percentual)
    const totalFP = Object.values(vendasPorPagamento).reduce((a,b)=>a+b,0)||1;
    const formasPct = Object.entries(vendasPorPagamento).map(([k,v]) => ({
      forma: k,
      count: v,
      pct: (v/totalFP*100)
    })).sort((a,b)=>b.count-a.count).slice(0,3);

    return {
      faturamento,
      topVendedor: topVendedor ? { nome: topVendedor[0], valor: topVendedor[1].valor, total: topVendedor[1].total } : null,
      melhorDia: melhorDia ? { dia: melhorDia[0], total: melhorDia[1] } : null,
      statusPercent: statusPercent,
      mediaQtdDia,
      mediaValorDia,
      formasPct,
    };
  }, [vendasFiltradas, valorTotalVendas, vendasPorDia, statusDistribuicao, vendasPorPagamento]);

  const copiarLink = (link: string) => {
    navigator.clipboard.writeText(link);
    // opcional: você pode integrar com algum sistema de toast existente
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
          {/* KPIs Principais */}
          <div className="rv-grid-metrics">
            <div className="rv-metric-card">
              <div className="rv-metric-label">Vendas</div>
              <div className="rv-metric-value">{totalVendas}</div>
              {kpisAvancados && <div className="rv-metric-trend">{kpisAvancados.mediaQtdDia.toFixed(1)} / dia</div>}
            </div>
            <div className="rv-metric-card">
              <div className="rv-metric-label">Faturamento</div>
              <div className="rv-metric-value">R$ {valorTotalVendas.toFixed(2)}</div>
              {kpisAvancados && <div className="rv-metric-trend">Média R$ {kpisAvancados.mediaValorDia.toFixed(2)}/dia</div>}
            </div>
            <div className="rv-metric-card">
              <div className="rv-metric-label">Ticket Médio</div>
              <div className="rv-metric-value">R$ {ticketMedio.toFixed(2)}</div>
              {kpisAvancados?.topVendedor && <div className="rv-metric-trend">Top: {kpisAvancados.topVendedor.nome.split(' ')[0]}</div>}
            </div>
            <div className="rv-metric-card">
              <div className="rv-metric-label">Período</div>
              <div className="rv-metric-value" style={{ fontSize: 18 }}>{filtro === 'mes' ? nomeDoMes(mesSelecionado) : `${nomeDoMes(mesSelecionado)} · ${quinzenaSelecionada}ª`}</div>
              {kpisAvancados?.melhorDia && <div className="rv-metric-trend">Melhor dia: {kpisAvancados.melhorDia.dia}</div>}
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

          {/* KPIs Avançados secundários */}
          {kpisAvancados && (
            <div className="rv-advanced-kpis mb-4">
              <Row className="g-3">
                <Col md={3} sm={6} xs={12}>
                  <div className="rv-subcard">
                    <label>Top Vendedor</label>
                    <strong>{kpisAvancados.topVendedor ? kpisAvancados.topVendedor.nome : '—'}</strong>
                    {kpisAvancados.topVendedor && <span className="rv-sub">R$ {kpisAvancados.topVendedor.valor.toFixed(2)} · {kpisAvancados.topVendedor.total} vendas</span>}
                  </div>
                </Col>
                <Col md={3} sm={6} xs={12}>
                  <div className="rv-subcard">
                    <label>Melhor Dia</label>
                    <strong>{kpisAvancados.melhorDia ? kpisAvancados.melhorDia.dia : '—'}</strong>
                    {kpisAvancados.melhorDia && <span className="rv-sub">{kpisAvancados.melhorDia.total} vendas</span>}
                  </div>
                </Col>
                <Col md={3} sm={6} xs={12}>
                  <div className="rv-subcard">
                    <label>Formas (Top)</label>
                    <strong>{kpisAvancados.formasPct.map(f=>f.forma).join(', ') || '—'}</strong>
                    <span className="rv-sub">{kpisAvancados.formasPct.map(f=>`${f.forma}: ${f.pct.toFixed(0)}%`).join(' · ')}</span>
                  </div>
                </Col>
                <Col md={3} sm={6} xs={12}>
                  <div className="rv-subcard">
                    <label>Status %</label>
                    <strong>{kpisAvancados.statusPercent[0]?.status || '—'}</strong>
                    <span className="rv-sub">{kpisAvancados.statusPercent.map(s=>`${s.status}: ${s.pct.toFixed(0)}%`).join(' · ')}</span>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* Filtros */}
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
                <Form.Label className="small text-uppercase fw-semibold">Periodicidade</Form.Label>
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
              <Col md={2} sm={6} xs={12}>
                <Form.Label className="small text-uppercase fw-semibold">Status</Form.Label>
                <Form.Select size="sm" value={statusView} onChange={e=>setStatusView(e.target.value as any)}>
                  <option value="todos">Todos</option>
                  <option value="pago">Pago</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="aguardando_pagamento">Aguardando Pagamento</option>
                </Form.Select>
              </Col>
            </Row>
          </div>

          {/* Placeholder para novos gráficos avançados (serão adicionados na próxima etapa) */}
          {/* Mantido restante (tabela e empty state) */}
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
                    <th>Link</th>
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
                      <td><span className={`rv-status-badge rv-status-${venda.status_pagamento?.toLowerCase().replace(/\s+/g, '_') || 'pendente'}`}>{venda.status_pagamento}</span></td>
                      <td>{venda.link_pagamento ? <div className="d-flex gap-1">
                        <Button size="sm" variant="outline-primary" onClick={() => copiarLink(venda.link_pagamento!)}>Copiar</Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => window.open(venda.link_pagamento, '_blank','noopener,noreferrer')}>Abrir</Button>
                      </div> : '-'}</td>
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
