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

export default function CadastroPf() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    celular: "",
    nascimento: "",
    cep: "",
    endereco: "",
    casa: "",
    sexo: "",
    uf: "",
    cidade: "",
    formaPagamento: "",
    tipoPagamentoLoja: "",
  });

  const [erros, setErros] = useState<{ [key: string]: string }>({});
  const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");

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

  // Função para formatar CPF
  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, "") // Remove tudo que não é número
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // Função para formatar Telefone
  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, "") // Remove tudo que não é número
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  };

  // Função para formatar Data de Nascimento
  const formatNascimento = (value: string) => {
    return value
      .replace(/\D/g, "") // Remove tudo que não é número
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 10);
  };


  const handleChangeFormat = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    if (name === "cpf") value = formatCpf(value);
    if (name === "celular") value = formatTelefone(value);
    if (name === "nascimento") value = formatNascimento(value);

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, uf: e.target.value, cidade: "" });
  };

  
  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const steps = ["Dados Pessoais", "Pagamento"];

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 5 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Venda Individual
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
                Preencha as informações pessoais
              </Typography>
              {[{ label: "Nome", name: "nome", type: "text" }, { label: "E-mail", name: "email", type: "email" }, { label: "CPF", name: "cpf", type: "text" }, { label: "Celular", name: "celular", type: "text", placeholder: "(DD) 12345-1234" }, { label: "Data de nascimento", name: "nascimento", type: "text", placeholder: "DD/MM/AAAA" }].map(({ label, name, type, placeholder }) => (
                <Box className="mb-3" key={name}>
                  <label className="form-label">{label}</label>
                  <input type={type} className="form-control" name={name} value={formData[name as keyof typeof formData]} onChange={handleChangeFormat} placeholder={placeholder} required />
                </Box>
              ))}
            </>
          )}

          {currentStep === 1 && (
            <>
              <Typography variant="h6" align="center" gutterBottom>
                Pagamento
              </Typography>
              <Typography align="center">Selecione uma forma de pagamento:</Typography>
              <Box className="text-center mt-3">
                <Box className="mb-3">
                  <div>
                    <input type="radio" id="loja" name="formaPagamento" value="loja" onChange={handleChangeFormat} checked={formData.formaPagamento === "loja"} />
                    <label htmlFor="loja">Pagamento em loja</label>
                  </div>
                  <div>
                    <input type="radio" id="pix" name="formaPagamento" value="pix" onChange={handleChangeFormat} checked={formData.formaPagamento === "pix"} />
                    <label htmlFor="pix">Pix</label>
                  </div>
                </Box>
              </Box>

              {/* Se o pagamento for em loja, mostrar opções */}
              {formData.formaPagamento === "loja" && (
                <Box className="mb-3 text-center">
                  <Typography variant="h6">Escolha o método:</Typography>
                  <Box className="d-flex justify-content-center gap-3 mt-2">
                    <input type="radio" id="credito" name="tipoPagamentoLoja" value="credito" onChange={handleChangeFormat} checked={formData.tipoPagamentoLoja === "credito"} />
                    <label htmlFor="credito">Cartão de Crédito</label>

                    <input type="radio" id="debito" name="tipoPagamentoLoja" value="debito" onChange={handleChangeFormat} checked={formData.tipoPagamentoLoja === "debito"} />
                    <label htmlFor="debito">Cartão de Débito</label>

                    <input type="radio" id="dinheiro" name="tipoPagamentoLoja" value="dinheiro" onChange={handleChangeFormat} checked={formData.tipoPagamentoLoja === "dinheiro"} />
                    <label htmlFor="dinheiro">Dinheiro</label>
                  </Box>
                </Box>
              )}

              {/* Botão dinâmico baseado na escolha do pagamento */}
              <Box className="text-center mt-4">
                {formData.formaPagamento === "pix" ? (
                  <Button variant="contained" color="success" onClick={async () => {
                    setLoading(true);
                    try {
                      const response = await fetch('/api/gerarQrCodePix', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nomeCliente: formData.nome }),
                      });

                      if (!response.ok) throw new Error("Erro ao gerar QR Code");

                      const data = await response.json();
                      setPaymentLink(data.paymentLink);
                      setShowPopup(true);
                    } catch (error) {
                      alert("Erro ao gerar QR Code.");
                    } finally {
                      setLoading(false);
                    }
                  }}>
                    Gerar QR Code
                  </Button>
                ) : (
                  <Button
  variant="contained"
  color="primary"
  onClick={async () => {
    if (formData.formaPagamento === "loja" && !formData.tipoPagamentoLoja) {
      alert("Por favor, selecione se o pagamento foi feito com dinheiro, débito ou crédito.");
      return;
    }

    try {
      const response = await fetch("/api/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
      } else {
        alert("Erro ao processar pagamento.");
      }
    } catch (error) {
      alert("Erro ao confirmar pagamento.");
    }
  }}
>
  Confirmar Pagamento
</Button>

                )}
              </Box>
            </>
          )}
        </Box>

        <Box className="d-flex justify-content-between mt-4">
          {currentStep > 0 && <Button variant="outlined" color="secondary" onClick={prevStep}>Voltar</Button>}
          {currentStep < 1 && <Button variant="contained" sx={{ backgroundColor: "rgb(181, 205, 0)" }} onClick={nextStep}>Avançar</Button>}
        </Box>
      </Paper>

    </Container>
  );
}