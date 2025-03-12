"use client";

import { useEffect, useState } from "react";
import { Container, Table, Form, Row, Col, Card } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export default function RelatorioVendas() {
  type Venda = {
    id: number;
    nome: string;
    cpf: string;
    forma_pagamento: string;
    tipo_pagamento_loja: string | null;
    data_venda: string;
    data_confirmacao_pagamento: string | null;
    status_pagamento: string;
  };

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [filtro, setFiltro] = useState("mes");
  const [mesSelecionado, setMesSelecionado] = useState("02");
  const [anoSelecionado, setAnoSelecionado] = useState("2025");

  useEffect(() => {
    async function fetchVendas() {
      try {
        const response = await fetch("/api/consultarClientes");
        const data = await response.json();
        console.log(data);
        if (data.success) {
          setVendas(data.vendas);
        } else {
          console.error("Erro ao buscar vendas:", data.error);
        }
      } catch (error) {
        console.error("Erro ao conectar com API:", error);
      }
    }

    fetchVendas();
  }, []);
  console.log(vendas);

  const vendasFiltradas = vendas.filter((venda) => {
    const dataVenda = new Date(venda.data_venda);
    const anoVenda = dataVenda.getFullYear().toString();
    const mesVenda = (dataVenda.getMonth() + 1).toString().padStart(2, "0");

    return (
      (filtro === "mes" && mesVenda === mesSelecionado && anoVenda === anoSelecionado) ||
      (filtro === "ano" && anoVenda === anoSelecionado)
    );
  });

  // 🔹 Filtrar apenas as vendas confirmadas para cálculos e gráficos
  const vendasConfirmadas = vendasFiltradas.filter((venda) => venda.status_pagamento === "confirmado");

  // 🔹 Cálculo do total de vidas e valor de vendas confirmadas
  const totalVidas = vendasConfirmadas.length;
  const totalValor = totalVidas * 30;

  // 🔹 Agrupar vendas confirmadas por data de CONFIRMAÇÃO para o gráfico
  const vendasPorData = Object.entries(
    vendasConfirmadas.reduce((acc, venda) => {
      if (!venda.data_confirmacao_pagamento) return acc; // Ignorar se não tiver confirmação
      const dataConfirmacao = new Date(venda.data_confirmacao_pagamento).toLocaleDateString("pt-BR");
      acc[dataConfirmacao] = (acc[dataConfirmacao] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([data, quantidade]) => ({ data, quantidade }));

  // 🔹 Agrupamento por forma de pagamento
  const formasDePagamento = ["loja", "pix"];
  const vendasPorFormaPagamento = formasDePagamento.map((forma) => ({
    name: forma === "loja" ? "Loja" : "Pix",
    value: vendasConfirmadas.filter((venda) => venda.forma_pagamento === forma).length,
  }));

  const COLORS = ["#28a745", "#007bff"];
  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Relatório de Vendas Confirmadas</h2>

      {/* Filtros */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Label>Filtro</Form.Label>
          <Form.Select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="mes">Mês</option>
            <option value="ano">Ano</option>
          </Form.Select>
        </Col>
        {filtro === "mes" && (
          <>
            <Col md={4}>
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
            <Col md={4}>
              <Form.Label>Ano</Form.Label>
              <Form.Select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)}>
                {[2023, 2024, 2025].map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </>
        )}
        {filtro === "ano" && (
          <Col md={4}>
            <Form.Label>Ano</Form.Label>
            <Form.Select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)}>
              {[2023, 2024, 2025].map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </Form.Select>
          </Col>
        )}
      </Row>

      {/* Totais */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="p-3 text-center shadow-sm">
            <h5>Total de Consultas Vendidas</h5>
            <h3>{totalVidas}</h3>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="p-3 text-center shadow-sm">
            <h5>Valor Total de Vendas</h5>
            <h3>R$ {totalValor.toFixed(2)}</h3>
          </Card>
        </Col>
      </Row>

      {/* Gráficos */}
      <Row>
        <Col md={6}>
          <Card className="p-4 mb-4 shadow-sm">
            <h5 className="text-center mb-3">Vendas por Forma de Pagamento</h5>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={vendasPorFormaPagamento} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {vendasPorFormaPagamento.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="p-4 mb-4 shadow-sm">
            <h5 className="text-center mb-3">Vendas por Data de Confirmação</h5>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendasPorData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey="quantidade" fill="#17a2b8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Tabela de Vendas */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Forma de Pagamento</th>
            <th>Data da Venda</th>
            <th>Data de Confirmação</th>
          </tr>
        </thead>
        <tbody>
          {vendasConfirmadas.map((venda) => (
            <tr key={venda.id}>
              <td>{venda.id}</td>
              <td>{venda.nome}</td>
              <td>{venda.forma_pagamento === "loja" ? "Loja" : "Pix"}</td>
              <td>{new Date(venda.data_venda).toLocaleDateString("pt-BR")}</td>
              <td>{venda.data_confirmacao_pagamento ? new Date(venda.data_confirmacao_pagamento).toLocaleDateString("pt-BR") : ""}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}