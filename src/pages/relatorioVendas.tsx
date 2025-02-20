import { useState } from "react";
import { Container, Table, Form, Row, Col, Card } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const vendasEstaticas = [
  { id: 1, empresa: "Empresa A", vidas: 50, valor: 1495, data: "2025-02-10" },
  { id: 2, empresa: "Empresa B", vidas: 30, valor: 897, data: "2025-02-15" },
  { id: 3, empresa: "Empresa C", vidas: 20, valor: 598, data: "2025-01-25" },
  { id: 4, empresa: "Empresa D", vidas: 70, valor: 2093, data: "2025-01-20" },
  { id: 5, empresa: "Empresa E", vidas: 100, valor: 2990, data: "2024-12-15" },
];

export default function RelatorioVendas() {
  const [filtro, setFiltro] = useState("mes");
  const [mesSelecionado, setMesSelecionado] = useState("02");
  const [anoSelecionado, setAnoSelecionado] = useState("2025");

  // Filtrar vendas conforme o filtro selecionado
  const vendasFiltradas = vendasEstaticas.filter((venda) => {
    const [ano, mes] = venda.data.split("-");
    if (filtro === "mes" && mes === mesSelecionado && ano === anoSelecionado) return true;
    if (filtro === "ano" && ano === anoSelecionado) return true;
    return false;
  });

  const totalVidas = vendasFiltradas.reduce((acc, venda) => acc + venda.vidas, 0);
  const totalValor = vendasFiltradas.reduce((acc, venda) => acc + venda.valor, 0);

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Relatório de Vendas</h2>

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
            <h5>Total de Vidas Vendidas</h5>
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

      {/* Gráfico */}
      <Card className="p-4 mb-4 shadow-sm">
        <h5 className="text-center mb-3">Vendas por Empresa</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={vendasFiltradas} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <XAxis dataKey="empresa" />
            <YAxis />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar dataKey="vidas" fill="rgb(181, 205, 0)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabela de Vendas */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Empresa</th>
            <th>Vidas Vendidas</th>
            <th>Valor Total</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {vendasFiltradas.length > 0 ? (
            vendasFiltradas.map((venda) => (
              <tr key={venda.id}>
                <td>{venda.id}</td>
                <td>{venda.empresa}</td>
                <td>{venda.vidas}</td>
                <td>R$ {venda.valor.toFixed(2)}</td>
                <td>{new Date(venda.data).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center">
                Nenhuma venda encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}
