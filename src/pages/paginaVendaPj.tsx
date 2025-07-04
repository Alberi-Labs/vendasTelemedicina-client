import { useState, useEffect } from "react";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Container from "@mui/material/Container";
import TelaCarregamento from "@/components/telaCarregamento/TelaCarregamento";
import PaymentLinkPopup from "@/components/paymentLinkPopup/PaymentLinkPopup";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import { useAuth } from "@/app/context/AuthContext";

export default function CadastroPj() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        nomeEmpresa: "",
        nomeFantasia: "",
        email: "",
        cnpj: "",
        inscricaoMunicipal: "",
        inscricaoEstadual: "",
        celular: "",
        cep: "",
        endereco: "",
        uf: "",
        cidade: "",
        formaPagamento: "",
        valorPlano: "",
    });
    const [erros, setErros] = useState<{ [key: string]: string }>({});
    const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
    const [cidades, setCidades] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [paymentLink, setPaymentLink] = useState("");
    const [mensagemDeErro, setMensagemDeErro] = useState<string | null>(null);
    const { user } = useAuth();

    let idUsuario: string = "";

    useEffect(() => {
        fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
            .then((res) => res.json())
            .then((data) => {
                setEstados(data.map((estado: any) => ({ sigla: estado.sigla, nome: estado.nome })));
            });
    }, []);

    useEffect(() => {
        if (formData.uf) {
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.uf}/municipios`)
                .then((res) => res.json())
                .then((data) => setCidades(data.map((cidade: any) => cidade.nome)));
        }
    }, [formData.uf]);

    useEffect(() => {
        if (/^\d{5}-\d{3}$/.test(formData.cep)) {
            fetch(`https://viacep.com.br/ws/${formData.cep.replace("-", "")}/json/`)
                .then((res) => res.json())
                .then((data) => {
                    if (!data.erro) {
                        setFormData((prev) => ({
                            ...prev,
                            endereco: data.logradouro,
                            uf: data.uf,
                            cidade: data.localidade,
                        }));
                        setErros((prev) => ({ ...prev, cep: "" }));
                    } else {
                        setErros((prev) => ({ ...prev, cep: "CEP inválido!" }));
                    }
                })
                .catch(() => setErros((prev) => ({ ...prev, cep: "Erro ao buscar CEP" })));
        } else {
            setFormData((prev) => ({ ...prev, endereco: "", uf: "", cidade: "" }));
        }
    }, [formData.cep]);

    const formatCnpj = (value: string) => {
        return value
            .replace(/\D/g, "") // Remove tudo que não é número
            .replace(/(\d{2})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1/$2")
            .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    };

    const formatTelefone = (value: string) => {
        return value
            .replace(/\D/g, "") // Remove tudo que não é número
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2")
            .slice(0, 15);
    };

    const handleChangeFormat = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let { name, value } = e.target;

        if (name === "cnpj") value = formatCnpj(value);
        if (name === "celular") value = formatTelefone(value);

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({ ...formData, uf: e.target.value, cidade: "" });
    };

    const nextStep = async () => {
        if (currentStep === 1) {
            setLoading(true);
            try {
                const response = await fetch('/api/empresas/adicionarEmpresa', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nomeEmpresa: formData.nomeEmpresa,
                        nomeFantasia: formData.nomeFantasia,
                        email: formData.email,
                        cnpj: formData.cnpj,
                        celular: formData.celular,
                        cep: formData.cep,
                        endereco: formData.endereco,
                        uf: formData.uf,
                        cidade: formData.cidade,
                        valor_plano: formData.valorPlano,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao cadastrar empresa');
                }

                console.log('Empresa cadastrada com sucesso!');
            } catch (error: any) {
                console.error('Erro ao cadastrar empresa:', error);
                setMensagemDeErro(error.message || 'Erro inesperado ao cadastrar empresa.');
                return;
            } finally {
                setLoading(false);
            }
        }

        setCurrentStep((prev) => prev + 1);
    };

    const prevStep = () => setCurrentStep((prev) => prev - 1);

    const steps = ["Dados da Empresa", "Endereço", "Pagamento"];

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 5 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Venda Cartão Saúde e Cor - Pessoa Jurídica
                </Typography>

                <Stepper activeStep={currentStep} alternativeLabel>
                    {steps.map((label, index) => (
                        <Step key={index}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box mt={4}>
                    {currentStep === 0 && (
                        <>
                            <Typography variant="h6" align="center" gutterBottom>
                                Preencha as informações da empresa
                            </Typography>
                            {[
                                { label: "Nome da Empresa", name: "nomeEmpresa", type: "text", required: true },
                                { label: "Nome Fantasia", name: "nomeFantasia", type: "text", required: false },
                                { label: "E-mail", name: "email", type: "email", required: false },
                                { label: "CNPJ", name: "cnpj", type: "text", required: true },
                                { label: "Inscrição Municipal", name: "inscricaoMunicipal", type: "text", required: false },
                                { label: "Inscrição Estadual", name: "inscricaoEstadual", type: "text", required: false },
                                { label: "Celular", name: "celular", type: "text", placeholder: "(DD) 12345-1234", required: false },
                            ].map(({ label, name, type, placeholder, required }) => (
                                <Box className="mb-3" key={name}>
                                    <label className="form-label">
                                        {label} {required && <span style={{ color: 'red' }}>*</span>}
                                    </label>
                                    <input
                                        type={type}
                                        className="form-control"
                                        name={name}
                                        value={formData[name as keyof typeof formData]}
                                        onChange={handleChangeFormat}
                                        placeholder={placeholder}
                                        required={required}
                                    />
                                </Box>
                            ))}
                        </>
                    )}

                    {currentStep === 1 && (
                        <>
                            <Typography variant="h6" align="center" gutterBottom>
                                Preencha o endereço da empresa
                            </Typography>
                            {[
                                { label: "CEP", name: "cep", type: "text" },
                                { label: "Endereço", name: "endereco", type: "text", disabled: true },
                            ].map(({ label, name, type, disabled }) => (
                                <Box className="mb-3" key={name}>
                                    <label className="form-label">{label}</label>
                                    <input
                                        type={type}
                                        className="form-control"
                                        name={name}
                                        value={formData[name as keyof typeof formData]}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const formattedValue =
                                                name === "cep"
                                                    ? value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9)
                                                    : value;
                                            setFormData((prev) => ({ ...prev, [name]: formattedValue }));
                                        }}
                                        disabled={disabled}
                                        required
                                    />
                                </Box>
                            ))}

                            <Box className="mb-3">
                                <label className="form-label">Estado</label>
                                <select
                                    className="form-control"
                                    name="uf"
                                    value={formData.uf}
                                    onChange={handleUfChange}
                                    required
                                >
                                    <option value="">Selecione o Estado</option>
                                    {estados.map((estado) => (
                                        <option key={estado.sigla} value={estado.sigla}>
                                            {estado.nome}
                                        </option>
                                    ))}
                                </select>
                            </Box>

                            <Box className="mb-3">
                                <label className="form-label">Cidade</label>
                                <select
                                    className="form-control"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChangeFormat}
                                    required
                                >
                                    <option value="">Selecione a Cidade</option>
                                    {cidades.map((cidade, index) => (
                                        <option key={index} value={cidade}>
                                            {cidade}
                                        </option>
                                    ))}
                                </select>
                            </Box>

                            <Box className="mb-3">
                                <label className="form-label">Valor do Plano</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    name="valorPlano"
                                    value={formData.valorPlano}
                                    onChange={handleChangeFormat}
                                    placeholder="Ex: 199.90"
                                    required
                                />
                            </Box>
                        </>
                    )}

                    {currentStep === 2 && (
                        <>
                            <Typography variant="h6" align="center" gutterBottom>
                                Pagamento
                            </Typography>
                            <Typography align="center">Selecione uma forma de pagamento:</Typography>
                            <Box className="text-center mt-3">
                                <Box className="mb-3">
                                    <div>
                                        <input
                                            type="radio"
                                            id="cartao-pj"
                                            name="formaPagamento"
                                            value="cartao"
                                            onChange={handleChangeFormat}
                                            checked={formData.formaPagamento === "cartao"}
                                        />
                                        <label htmlFor="cartao-pj">Cartão de Crédito</label>
                                    </div>
                                    <div>
                                        <input
                                            type="radio"
                                            id="pix-pj"
                                            name="formaPagamento"
                                            value="pix"
                                            onChange={handleChangeFormat}
                                            checked={formData.formaPagamento === "pix"}
                                        />
                                        <label htmlFor="pix-pj">Pix</label>
                                    </div>
                                    <div>
                                        <input
                                            type="radio"
                                            id="boleto-pj"
                                            name="formaPagamento"
                                            value="boleto"
                                            onChange={handleChangeFormat}
                                            checked={formData.formaPagamento === "boleto"}
                                        />
                                        <label htmlFor="boleto-pj">Boleto</label>
                                    </div>
                                </Box>
                            </Box>
                            <Box className="text-center mt-4">
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            // Primeiro gera o link de pagamento (seria necessária uma rota específica para PJ)
                                            const response = await fetch('/api/vendaPlanoPj/vendaClientePj', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                    nomeEmpresa: formData.nomeEmpresa,
                                                    formaDePagamento: formData.formaPagamento,
                                                    valorPlano: formData.valorPlano,
                                                    idUsuario: user?.id || idUsuario,
                                                }),
                                            });

                                            if (!response.ok) {
                                                const errorData = await response.json();
                                                throw new Error(errorData.message || 'Erro ao gerar o link de pagamento');
                                            }

                                            const data = await response.json();
                                            if (data.paymentLink) {
                                                // Depois registra a venda na tabela tb_vendas_telemedicina
                                                try {
                                                    await fetch('/api/vendaTelemedicina/criarVenda', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                        body: JSON.stringify({
                                                            id_usuario: user?.id || idUsuario,
                                                            forma_pagamento: formData.formaPagamento,
                                                            link_pagamento: data.paymentLink,
                                                            tipo_venda: "pj",
                                                            situacao_pagamento: "pendente",
                                                            valor_venda: formData.valorPlano,
                                                        }),
                                                    });
                                                } catch (vendaError) {
                                                    console.error('Erro ao registrar venda na tabela telemedicina:', vendaError);
                                                    // Não bloqueia o fluxo principal se houver erro no registro
                                                }

                                                setPaymentLink(data.paymentLink);
                                                setShowPopup(true); // Mostra o popup
                                            } else {
                                                alert('Erro: o link de pagamento não foi retornado.');
                                            }
                                        } catch (error) {
                                            alert('Erro ao gerar o link de pagamento.');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    Gerar link de pagamento
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>

                <Box className="d-flex justify-content-between mt-4">
                    {currentStep > 0 && (
                        <Button variant="outlined" color="secondary" onClick={prevStep}>
                            Voltar
                        </Button>
                    )}
                    {currentStep < 2 && (
                        <Button variant="contained" sx={{ backgroundColor: "rgb(181, 205, 0)" }} onClick={nextStep}>
                            Avançar
                        </Button>
                    )}
                </Box>
            </Paper>
            {loading && (
                <TelaCarregamento
                    mensagem={
                        currentStep === 1
                            ? "Cadastrando dados da empresa..."
                            : currentStep === 2
                                ? "Enviando dados de cobrança..."
                                : "Carregando..."
                    }
                />
            )}
            <PaymentLinkPopup
                show={showPopup}
                onClose={() => setShowPopup(false)}
                paymentLink={paymentLink}
            />
            {mensagemDeErro && (
                <AvisoAlerta
                    mensagem={mensagemDeErro}
                    tipo="danger"
                    duracao={5000}
                    onClose={() => setMensagemDeErro(null)}
                />
            )}
        </Container>
    );
}
