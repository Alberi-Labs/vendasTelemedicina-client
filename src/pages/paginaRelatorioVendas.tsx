"use client";

import { useEffect, useState, useRef } from "react";
import { Container, Form, Row, Col, Card, Button, Table } from "react-bootstrap";
import { useReactToPrint } from "react-to-print";
import { BsFileEarmarkPdf } from "react-icons/bs";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { motion } from "framer-motion";
import { vendaTelemedicinaApi } from "@/lib/api-client";

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

  const relatorioRef = useRef<HTMLDivElement>(null);
  const gerarPDF = useReactToPrint({
    content: () => relatorioRef.current!,
    documentTitle: "Relatorio de Vendas",
    print: (target: any) => new Promise((resolve) => resolve(target)),
  } as unknown as any);


  useEffect(() => {
    async function fetchVendas() {
      try {
        const response = await vendaTelemedicinaApi.consultar();
        if (response.success && response.data?.vendas) {
          // Mapear os dados para o formato esperado pela página
          const vendasFormatadas = response.data.vendas.map((venda: any) => ({
            idVenda: venda.idVenda,
            id_cliente: venda.id_cliente,
            nome_cliente: venda.nome_cliente || venda.cliente?.nome,
            data: venda.criado_em, // Data da venda
            valor: venda.valor_venda,
            forma_pagamento: venda.forma_pagamento,
            status_pagamento: venda.situacao_pagamento,
            data_pagamento: venda.situacao_pagamento === 'RECEIVED' ? venda.criado_em : null,
          }));
          setVendas(vendasFormatadas);
        }
      } catch (error) {
        console.error("Erro ao conectar com API:", error);
      }
    }
    fetchVendas();
  }, []);

  const vendasFiltradas = vendas.filter((venda) => {
    const dataPagamento = venda.data_pagamento; // ✅ Usa diretamente a string formatada da API
    if (!dataPagamento) return false;
    const mesPagamento = dataPagamento.split("/")[1]; // ✅ Extrai o mês da string "DD/MM/YYYY"
    const diaPagamento = parseInt(dataPagamento.split("/")[0]); // ✅ Extrai o dia

    if (filtro === "mes") return mesPagamento === mesSelecionado;
    if (filtro === "quinzenal") return mesPagamento === mesSelecionado && (diaPagamento <= 15 ? "1" : "2") === quinzenaSelecionada;

    return false;
  });

  const valorTotalVendas = vendasFiltradas.reduce((acc, venda) => {
    return acc + parseFloat(venda.valor);
  }, 0);

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
  const nomeDoMes = (mes: string) => {
    const numeroMes = parseInt(mes) - 1;
    return new Date(2025, numeroMes).toLocaleString("pt-BR", { month: "long" });
  };

  return (
    <Container className="mt-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <div className="d-flex justify-content-end">
          <Button variant="danger" onClick={() => gerarPDF()}>
            <BsFileEarmarkPdf size={20} />
          </Button>
        </div>

        <div ref={relatorioRef}>
          <h2 className="text-center mb-4">Relatório de Vendas</h2>
          <Row className="mb-4 g-4 text-center">
            <Row className="mb-4 g-4 text-center">
              <Col xs={12} md={6} lg={3}>
                <Card className="text-center shadow-sm border rounded-3 py-3">
                  <h6 className="text-muted">Nº Vendas</h6>
                  <h4 className="fw-bold">{totalVendas}</h4>
                </Card>
              </Col>

              <Col xs={12} md={6} lg={3}>
                <Card className="text-center shadow-sm border rounded-3 py-3">
                  <h6 className="text-muted">Faturamento Total</h6>
                  <h4 className="fw-bold">R$ {valorTotalVendas.toFixed(2)}</h4>
                </Card>
              </Col>

              <Col xs={12} md={6} lg={3}>
                <Card className="text-center shadow-sm border rounded-3 py-3">
                  <h6 className="text-muted">Ticket Médio</h6>
                  <h4 className="fw-bold">R$ {ticketMedio.toFixed(2)}</h4>
                </Card>
              </Col>

              <Col xs={12} md={6} lg={3}>
                <Card className="text-center shadow-sm border rounded-3 py-3">
                  <h6 className="text-muted">Período Selecionado</h6>
                  <h4 className="fw-bold">
                    {filtro === "mes"
                      ? nomeDoMes(mesSelecionado)
                      : `${nomeDoMes(mesSelecionado)} - ${quinzenaSelecionada}ª quinzena`}
                  </h4>
                </Card>
              </Col>
            </Row>

          </Row>

          <Row className="mb-4">
            <Col md={6}>
              <Form.Label>Filtro</Form.Label>
              <Form.Select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                <option value="mes">Mês</option>
                <option value="quinzenal">Quinzenal</option>
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form.Label>Mês</Form.Label>
              <Form.Select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => {
                  const mes = (i + 1).toString().padStart(2, "0");
                  return (
                    <option key={mes} value={mes}>
                      {new Date(2025, i).toLocaleString("pt-BR", { month: "long" })}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>

            {filtro === "quinzenal" && (
              <Col md={6} className="mt-3">
                <Form.Label>Quinzena</Form.Label>
                <Form.Select value={quinzenaSelecionada} onChange={(e) => setQuinzenaSelecionada(e.target.value)}>
                  <option value="1">1ª Quinzena</option>
                  <option value="2">2ª Quinzena</option>
                </Form.Select>
              </Col>
            )}
          </Row>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Row className="mb-4">
              <Col md={6}>
                <Card className="p-3">
                  <Bar
                    data={{
                      labels: Object.keys(vendasPorDia),
                      datasets: [{ label: "Vendas por Dia", data: Object.values(vendasPorDia), backgroundColor: "#4CAF50" }],
                    }}
                    options={{ maintainAspectRatio: false, responsive: true }}
                  />
                </Card>
              </Col>
              <Col md={6}>
                <Card className="p-3">
                  <Pie
                    data={{
                      labels: Object.keys(vendasPorPagamento),
                      datasets: [{
                        data: Object.values(vendasPorPagamento),
                        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
                      }],
                    }}
                    options={{ maintainAspectRatio: false, responsive: true }}
                  />
                </Card>
              </Col>
            </Row>
          </motion.div>


          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Forma de Pagamento</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {vendasFiltradas.map((venda) => (
                <tr key={venda.idVenda}>
                  <td>{venda.data}</td>
                  <td>{venda.nome_cliente}</td>
                  <td>{venda.forma_pagamento}</td>
                  <td>R$ {parseFloat(venda.valor).toFixed(2)}</td>
                  <td>{venda.status_pagamento}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </motion.div>


    </Container>
  );
}
