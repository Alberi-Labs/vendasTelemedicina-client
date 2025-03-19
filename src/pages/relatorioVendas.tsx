"use client";

import { useEffect, useState, useRef } from "react";
import { Container, Form, Row, Col, Card, Button } from "react-bootstrap";
import { useReactToPrint } from "react-to-print";
import { BsFileEarmarkPdf } from "react-icons/bs";

export default function RelatorioVendas() {
  type Venda = {
    idVenda: number;
    id_cliente: number;
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

  // Ref para exportação em PDF
  const relatorioRef = useRef<HTMLDivElement>(null);

  const gerarPDF = useReactToPrint({
    content: () => relatorioRef.current!,
    documentTitle: "Relatorio de Vendas",
    print: (target: any) => new Promise((resolve) => resolve(target)),
  } as unknown as any);

  

  useEffect(() => {
    async function fetchVendas() {
      try {
        const response = await fetch("/api/venda/consultar", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
        const data = await response.json();
        if (data.success) {
          setVendas(data?.vendas);
        } else {
          console.error("Erro ao buscar vendas:", data.error);
        }
      } catch (error) {
        console.error("Erro ao conectar com API:", error);
      }
    }
  
    fetchVendas();
  }, []);
  

  // 🔹 Filtrar vendas por mês ou quinzena
  const vendasFiltradas = vendas.filter((venda) => {
    const dataPagamento = venda.data_pagamento ? new Date(venda.data_pagamento) : null;
    if (!dataPagamento) return false;
  
    const mesPagamento = (dataPagamento.getMonth() + 1).toString().padStart(2, "0");
    const diaPagamento = dataPagamento.getDate();
  
    if (filtro === "mes") {
      return mesPagamento === mesSelecionado;
    }
  
    if (filtro === "quinzenal") {
      const quinzena = diaPagamento <= 15 ? "1" : "2";
      return mesPagamento === mesSelecionado && quinzena === quinzenaSelecionada;
    }
  
    return false;
  });
  

  // 🔹 Filtrar apenas vendas confirmadas
  const vendasConfirmadas = vendasFiltradas.filter((venda) => venda.status_pagamento === "confirmado");

  // 🔹 Cálculo do total de vendas e valor
  const totalVendas = vendasFiltradas.length;
const totalValor = vendasFiltradas.reduce((acc, venda) => acc + parseFloat(venda.valor), 0);


  return (
    <Container className="mt-5">
      {/* Botão para Gerar PDF */}
      <div className="d-flex justify-content-end">
        <Button variant="danger" onClick={() => gerarPDF()}>
          <BsFileEarmarkPdf  size={20} />
        </Button>
      </div>

      <div ref={relatorioRef}>
        <h2 className="text-center mb-4">Relatório de Vendas Confirmadas</h2>

        {/* Filtros */}
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

        {/* Totais */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className="p-3 text-center shadow-sm">
              <h5>Total de Vendas</h5>
              <h3>{totalVendas}</h3>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="p-3 text-center shadow-sm">
              <h5>Valor Total</h5>
              <h3>R$ {totalValor.toFixed(2)}</h3>
            </Card>
          </Col>
        </Row>
      </div>
    </Container>
  );
}
