import { useState } from "react";
import { Card, Table, Button, Modal, Form, Row, Col, Badge } from "react-bootstrap";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function PaginaDashboardFinanceiro() {
  const [showModal, setShowModal] = useState(false);
  const [selectedFaturaId, setSelectedFaturaId] = useState<number | null>(null);

  const handleShowModal = (id: number) => {
    setSelectedFaturaId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFaturaId(null);
  };

  const faturas = [
    { id: 1, data: "2025-03-01", valor: "R$ 1.200,00", pago: false },
    { id: 2, data: "2025-03-15", valor: "R$ 850,00", pago: true, dataPagamento: "2025-03-16" },
  ];

  const dadosResumo = [
    { titulo: "Nº Vendas", valor: "102" },
    { titulo: "Faturamento Total", valor: "R$ 25.000,00" },
    { titulo: "Despesa Operacional", valor: "R$ 8.400,00" },
    { titulo: "Resultado Total", valor: "R$ 16.600,00" },
  ];

  const formasPagamento = ["Pix", "Crédito", "Débito", "Dinheiro"];

  const chartData = {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai"],
    datasets: [
      {
        label: "Vendas",
        data: [1200, 1900, 3000, 5000, 3200],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const doughnutData = {
    labels: ["Pix", "Crédito", "Débito", "Dinheiro"],
    datasets: [
      {
        data: [5000, 3000, 2000, 1500],
        backgroundColor: ["#36A2EB", "#FFCE56", "#FF6384", "#4BC0C0"],
      },
    ],
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold text-center mb-5">Painel Financeiro</h2>

      {/* Resumo */}
      <Row className="mb-4">
        {dadosResumo.map((item, idx) => (
          <Col key={idx} md={3} className="mb-3">
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title className="fs-5">{item.titulo}</Card.Title>
                <Card.Text className="fw-bold fs-4">{item.valor}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
        <Col md={12} className="mt-4">
  <div style={{ maxWidth: "70%", margin: "0 auto", height: "350px" }}>
    <Bar
      data={{
        labels: ["Jan", "Fev", "Mar", "Abr", "Mai"],
        datasets: [
          {
            label: "Faturamento Total",
            data: [12000, 15000, 13000, 10000, 8000],
            backgroundColor: "rgba(54, 162, 235, 0.7)",
          },
          {
            label: "Despesa Operacional",
            data: [4000, 5000, 4200, 3000, 2500],
            backgroundColor: "rgba(255, 99, 132, 0.7)",
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
        },
        scales: {
          x: {
            stacked: false,
          },
          y: {
            stacked: false,
            beginAtZero: true,
            ticks: {
              callback: (value) => `R$ ${value.toLocaleString()}`,
            },
          },
        },
      }}
    />
  </div>
</Col>


      </Row>

      {/* Formas de pagamento */}
      <h4 className="fw-semibold mb-3">Resumo por Forma de Pagamento</h4>
      <Row className="mb-4">
        {formasPagamento.map((forma, idx) => (
          <Col key={idx} md={3} className="mb-3">
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title className="fs-6">{forma}</Card.Title>
                <Card.Text>
                  <div>Vendas: 20</div>
                  <div>Valor: R$ 4.000,00</div>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
        <Col md={6} className="d-flex justify-content-center">
          <div style={{ maxWidth: "100%", height: "380px" }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
              }}
            />
          </div>
        </Col>

        <Col md={6} className="d-flex justify-content-center">
          <div style={{ maxWidth: "100%", height: "380px" }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom" },
                },
              }}
            />
          </div>
        </Col>

      </Row>

      {/* Faturas */}
      <h4 className="fw-semibold mb-3">Faturas</h4>
      <Table bordered responsive hover>
        <thead>
          <tr>
            <th>Nº Fatura</th>
            <th>Data/Período</th>
            <th>Valor</th>
            <th>Pagamento</th>
          </tr>
        </thead>
        <tbody>
          {faturas.map((f) => (
            <tr key={f.id}>
              <td>{f.id}</td>
              <td>{new Date(f.data).toLocaleDateString()}</td>
              <td>{f.valor}</td>
              <td>
                {f.pago ? (
                  <Badge bg="success">
                    Pago em {new Date(f.dataPagamento!).toLocaleDateString()}
                  </Badge>
                ) : (
                  <Button size="sm" variant="primary" onClick={() => handleShowModal(f.id)}>
                    Pagar / Anexar Comprovante
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal de Pagamento */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Pagamento da Fatura #{selectedFaturaId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Forma de Pagamento</Form.Label>
              <Form.Select>
                {formasPagamento.map((forma, idx) => (
                  <option key={idx}>{forma}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Anexar Comprovante</Form.Label>
              <Form.Control type="file" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="success" onClick={handleCloseModal}>Confirmar Pagamento</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}