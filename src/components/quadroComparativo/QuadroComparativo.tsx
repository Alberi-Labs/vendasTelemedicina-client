import { useEffect, useState } from "react";
import { Form, Row, Col, Card, Spinner } from "react-bootstrap";
import axios from "axios";
import dayjs from "dayjs";

interface ComparativoData {
    qtdVidas: number;
    valorBruto: number;
    descontoAsaas: number;
    valorLiquido: number;
}

interface Instituicao {
    idInstituicao: number;
    nomeInstituicao: string;
}


export default function QuadroComparativo() {
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [dados, setDados] = useState<ComparativoData | null>(null);
    const [loading, setLoading] = useState(false);

    const [mes, setMes] = useState(dayjs().month() + 1);
    const [ano, setAno] = useState(dayjs().year());
    const [idInstituicao, setIdInstituicao] = useState<number | "">("");

    useEffect(() => {
        axios.get("/api/instituicoes/buscarInstituicao").then(res => {
            setInstituicoes(res.data.instituicoes); // <- extrai corretamente o array
        });
    }, []);

    useEffect(() => {
        if (idInstituicao && mes && ano) {
            setLoading(true);
            axios
                .get("/api/cobranca/quadroComparativo", {
                    params: { mes, ano, idInstituicao }
                })
                .then(res => setDados(res.data))
                .finally(() => setLoading(false));
        }
    }, [idInstituicao, mes, ano]);

    return (
        <Card className="p-4 shadow">
            <h4 className="mb-3">Quadro Comparativo</h4>

            <Row className="mb-3">
                <Col md={4}>
                    <Form.Select
                        value={idInstituicao}
                        onChange={e => setIdInstituicao(Number(e.target.value))}
                    >
                        <option value="">Selecione a instituição</option>
                        {instituicoes.map(inst => (
                            <option key={inst.idInstituicao} value={inst.idInstituicao}>
                                {inst.nomeInstituicao}
                            </option>
                        ))}
                    </Form.Select>

                </Col>
                <Col md={4}>
                    <Form.Select value={mes} onChange={e => setMes(Number(e.target.value))}>
                        <option value="">Selecione o mês</option>
                        {[
                            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                        ].map((nomeMes, index) => (
                            <option key={index + 1} value={index + 1}>
                                {nomeMes}
                            </option>
                        ))}
                    </Form.Select>

                </Col>
                <Col md={4}>
                    <Form.Control
                        type="number"
                        placeholder="Ano"
                        value={ano}
                        min={2020}
                        onChange={e => setAno(Number(e.target.value))}
                    />
                </Col>
            </Row>

            {loading ? (
                <div className="text-center my-4">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : dados ? (
                <table className="table table-bordered table-hover">
                    <tbody>
                        <tr>
                            <th>1. Qtd Vidas</th>
                            <td>{dados.qtdVidas}</td>
                            <td>Número de vidas</td>
                        </tr>
                        <tr>
                            <th>2. Bruto</th>
                            <td>
                                {dados.valorBruto !== undefined
                                    ? Number(dados.valorBruto).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                    : "—"}
                            </td>

                            <td>= vidas × valor unitário (ex: 39,90)</td>
                        </tr>
                        <tr>
                            <th>3. Desconto Asaas</th>
                            <td>
                                {dados.descontoAsaas !== undefined
                                    ? Number(dados.descontoAsaas).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                    : "—"}
                            </td>

                            <td>Desconto total aplicado</td>
                        </tr>
                        <tr>
                            <th>4. Líquido</th>
                            <td>
                                {dados.valorLiquido !== undefined
                                    ? Number(dados.valorLiquido).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                    : "—"}
                            </td>
                            <td>= Bruto - Desconto</td>
                        </tr>
                    </tbody>
                </table>
            ) : (
                <p className="text-muted">Nenhum dado encontrado para os filtros selecionados.</p>
            )}
        </Card>
    );
}
