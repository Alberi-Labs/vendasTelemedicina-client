import { useState, useEffect } from "react";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { motion } from "framer-motion";
import { cadastrarOuAtualizarUsuario } from "./utils/cadastrarUsuario";

// 🔹 Interface para Cliente
interface Cliente {
  idCliente?: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  creditos: number;
  data_nascimento?: string;
}

// 🔹 Interface para Venda
interface Venda {
  idVenda: number;
  data: string;
  valor: number;
}

// 🔹 Interface para Pagamento
interface Pagamento {
  forma_pagamento: string;
  tipo_pagamento_loja?: string;
}

export default function CadastroPf() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Cliente>({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    creditos: 0,
  });

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [quantidadeCreditos, setQuantidadeCreditos] = useState(1);
  const [valorUnitario] = useState(29.90);
  const [pagamento, setPagamento] = useState<Pagamento>({
    forma_pagamento: "",
    tipo_pagamento_loja: "",
  });
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [loadingCpf, setLoadingCpf] = useState(false);
  const [clienteExiste, setClienteExiste] = useState<boolean | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const [originalData, setOriginalData] = useState<Cliente | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);

  // 🔹 Função para limpar formatação do CPF (deixa só números)
  const limparCpf = (cpf: string) => cpf.replace(/\D/g, "");

  // 🔹 Função para formatar CPF na interface
  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === "cpf") value = formatCpf(value);

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "cpf" && limparCpf(value).length === 11) {
      verificarCpf(value);
    }
  };

  const handlePagamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPagamento((prev) => ({ ...prev, [name]: value }));
  };
  const formatarDataParaSenha = (data: string) => {
    const [ano, mes, dia] = data.split("-"); 
    return `${dia}${mes}${ano}`; 
  };
  // 🔹 Buscar CPF no banco e verificar últimas 5 vendas
  const verificarCpf = async (cpf: string) => {
    setLoadingCpf(true);
    try {
      const cpfLimpo = limparCpf(cpf);
      const response = await fetch(`/api/cliente/consultar?cpf=${cpfLimpo}`);
      const data = await response.json();

      if (response.ok && data.clientes.length > 0) {
        setClienteExiste(true);

        // ✅ Converte a data de nascimento para o formato adequado (YYYY-MM-DD)
        const dataNascimentoOriginal = data.clientes[0].data_nascimento;
        const dataNascimentoFormatada = dataNascimentoOriginal
          ? new Date(dataNascimentoOriginal).toISOString().split("T")[0] // Mantém YYYY-MM-DD para input date
          : "";

        setFormData({
          ...data.clientes[0],
          data_nascimento: dataNascimentoFormatada, // ✅ Usa o formato adequado
        });

        const vendasResponse = await fetch(`/api/venda/consultar?id_cliente=${data.clientes[0].idCliente}`);
        const vendasData = await vendasResponse.json();
        setVendas(vendasData?.vendas?.slice(0, 5));
      } else {
        setClienteExiste(false);
        setFormData({ nome: "", email: "", cpf, telefone: "", creditos: 0, data_nascimento: "" });
        setVendas([]);
      }
    } catch (error) {
      console.error("Erro ao consultar CPF:", error);
    } finally {
      setLoadingCpf(false);
    }
  };

  const dadosAlterados = () => {
    return (
      originalData &&
      (formData.nome !== originalData.nome ||
        formData.email !== originalData.email ||
        formData.telefone !== originalData.telefone)
    );
  };
  const cadastrarCliente = async () => {
    try {
    console.log(formData);
      const response = await fetch(`/api/cliente/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          cpf: limparCpf(formData.cpf),
          telefone: formData.telefone,
          email: formData.email,
          data_nascimento: formData.data_nascimento,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setClienteExiste(true);
        setOriginalData(formData); // Atualiza os dados originais
        nextStep(); // Avança para a próxima etapa
      } else {
        alert(data.error || "Erro ao cadastrar cliente.");
      }
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      alert("Erro ao cadastrar cliente.");
    }
  };

  // 🔹 Função para atualizar os dados do cliente
  const atualizarCliente = async () => {
    try {
      const response = await fetch(`/api/cliente/editar?cpf=${limparCpf(formData.cpf)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Cliente atualizado com sucesso!");
        setOriginalData(formData);
        nextStep();
      } else {
        alert("Erro ao atualizar cliente.");
      }
    } catch (error) {
      alert("Erro ao atualizar cliente.");
    }
  };

  const pesquisarOutroCpf = () => {
    setClienteExiste(null);
    setOriginalData(null);
    setFormData({ nome: "", email: "", cpf: "", telefone: "", creditos: 0 }); // Reseta o formulário
  };

  const gerarPix = async () => {
    setLoadingPix(true);
    try {
      const response = await fetch(`/api/cobranca/gerarQrCode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        // Armazena os dados para exibição
        setPixQrCode(data.id);
        setQrCodeImage(`data:image/png;base64,${data.encodedImage}`);
      } else {
        console.error("Erro ao gerar QR Code PIX:", data.error);
      }
    } catch (error) {
      console.error("Erro ao gerar QR Code PIX:", error);
    } finally {
      setLoadingPix(false);
    }
  };

  const criarVenda = async () => {
    if (!formData || !formData.cpf) {
      alert("Erro: Nenhum cliente selecionado.");
      return;
    }

    try {
      const response = await fetch(`/api/venda/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cliente: formData.idCliente,
          data: new Date().toISOString().split("T")[0],
          valor: quantidadeCreditos * valorUnitario,
          forma_pagamento: pagamento.tipo_pagamento_loja,
          status_pagamento: "PAGO",
          data_pagamento: new Date().toISOString().split("T")[0],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPagamentoConfirmado(true);

        await cadastrarOuAtualizarUsuario({
          nome: formData.nome,
          cpf: formData.cpf,
          email: formData.email,
          senha: formData.data_nascimento ? formatarDataParaSenha(formData.data_nascimento) : "",
          telefone: formData.telefone,
          creditos: quantidadeCreditos,
          data_nascimento: formData.data_nascimento || "",
        });

      } else {
        alert(data.error || "Erro ao criar venda.");
      }
    } catch (error) {
      console.error("Erro ao criar venda:", error);
      alert("Erro ao criar venda.");
    }
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  useEffect(() => {
    if (!pixQrCode) return;

    const checkPagamento = async () => {
      try {
        const response = await fetch(`/api/cobranca/status?pixQrCodeId=${pixQrCode}`);
        const data = await response.json();

        if (data.confirmado) {
          setPagamentoConfirmado(true);

          await cadastrarOuAtualizarUsuario({
            nome: formData.nome,
            cpf: formData.cpf,
            email: formData.email,
            senha: formData.data_nascimento ? formatarDataParaSenha(formData.data_nascimento) : "",
            telefone: formData.telefone,
            creditos: quantidadeCreditos,
            data_nascimento: formData.data_nascimento || "", 
          });

        }
      } catch (error) {
        console.error("Erro ao verificar pagamento ou cadastrar usuário:", error);
      }
    };

    const interval = setInterval(checkPagamento, 5000); 

    return () => clearInterval(interval);
  }, [pixQrCode, formData, quantidadeCreditos]);

  return (
    <Container maxWidth="md">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper elevation={3} sx={{ p: 4, mt: 5 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Venda Individual
          </Typography>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Stepper activeStep={currentStep} alternativeLabel>
              {["Verificar Cliente", "Revisar Venda", "Pagamento"].map((label, index) => (
                <Step key={index}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </motion.div>

          <Box mt={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {currentStep === 0 && (
                <>
                  <Typography variant="h6" align="center" gutterBottom>
                    Digite o CPF para verificar se o cliente já está cadastrado:
                  </Typography>

                  <Box className="mb-3">
                    <label className="form-label">CPF</label>
                    <input
                      type="text"
                      className="form-control"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                      required
                    />
                  </Box>

                  {loadingCpf && <CircularProgress size={24} />}

                  {clienteExiste === true && (
                    <>
                      <Typography color="green">
                        Cliente encontrado! Você pode editar os dados.
                      </Typography>

                      {["Nome", "Email", "Telefone", "Data de Nascimento"].map((label, index) => {
                        const name = label === "Data de Nascimento" ? "data_nascimento" : label.toLowerCase(); // ✅ Corrigindo a chave do formData

                        return (
                          <Box className="mb-3" key={index}>
                            <label className="form-label">{label}</label>
                            <input
                              type={label === "Data de Nascimento" ? "date" : "text"}
                              className="form-control"
                              name={name}
                              value={formData[name as keyof typeof formData] || ""}
                              onChange={handleChange}
                              required
                            />
                          </Box>
                        );
                      })}


                      <Box className="d-flex justify-content-between mt-3">
                        <Button variant="outlined" color="secondary" onClick={pesquisarOutroCpf}>
                          Pesquisar outro CPF
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={dadosAlterados() ? atualizarCliente : nextStep}
                        >
                          {dadosAlterados() ? "Salvar Alterações e Prosseguir" : "Prosseguir"}
                        </Button>
                      </Box>
                    </>
                  )}

                  {clienteExiste === false && (
                    <>
                      <Typography color="red">
                        Cliente não encontrado! Preencha os dados para cadastrar.
                      </Typography>

                      {["Nome", "E-mail", "Telefone", "Data de Nascimento"].map((label, index) => {
  let name = label.toLowerCase().replace(/\s/g, "_");

  // Correção para garantir que "E-mail" se torne "email"
  if (name === "e-mail") {
    name = "email";
  }

  return (
    <Box className="mb-3" key={index}>
      <label className="form-label">{label}</label>
      <input
        type={label === "Data de Nascimento" ? "date" : "text"} // Campo "date" para nascimento
        className="form-control"
        name={name}
        value={formData[name as keyof typeof formData] || ""}
        onChange={handleChange}
        required
      />
    </Box>
  );
})}


                      <Button variant="contained" color="success" onClick={cadastrarCliente}>
                        Cadastrar Cliente e Prosseguir
                      </Button>
                    </>
                  )}
                </>
              )}


              {currentStep === 1 && (
                <>
                  <Typography variant="h6" align="center" gutterBottom>
                    {clienteExiste ? "Resumo do Cliente" : "Resumo da Compra"}
                  </Typography>

                  {clienteExiste && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography><strong>Nome:</strong> {formData.nome}</Typography>
                      <Typography><strong>CPF:</strong> {formData.cpf}</Typography>
                      <Typography><strong>Créditos:</strong> {formData.creditos}</Typography>

                      <Typography variant="h6" sx={{ mt: 2 }}>Últimas 5 Vendas</Typography>
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Data</TableCell>
                              <TableCell>Valor</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {vendas?.map((venda, index) => (
                              <TableRow key={index}>
                                <TableCell>{venda.data}</TableCell>
                                <TableCell>R$ {venda.valor ? parseFloat(venda.valor.toString()).toFixed(2) : "0.00"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  )}

                  <Typography variant="h6">Quantidade de Créditos</Typography>
                  <input
                    type="number"
                    min="1"
                    value={quantidadeCreditos}
                    onChange={(e) => setQuantidadeCreditos(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px", margin: "10px 0" }}
                  />
                  <Typography><strong>Valor Total:</strong> R$ {(quantidadeCreditos * valorUnitario).toFixed(2)}</Typography>

                  <Box className="d-flex justify-content-between mt-3">
                    {currentStep > 0 && (
                      <Button variant="outlined" color="secondary" onClick={prevStep}>
                        Voltar
                      </Button>
                    )}

                    <Button variant="contained" color="primary" onClick={nextStep}>
                      Prosseguir para Pagamento
                    </Button>
                  </Box>

                </>
              )}

              {currentStep === 2 && (
                <>
                  <Typography variant="h6" align="center" gutterBottom>
                    Escolha a forma de pagamento:
                  </Typography>

                  <RadioGroup name="forma_pagamento" value={pagamento.forma_pagamento} onChange={handlePagamentoChange}>
                    <FormControlLabel value="loja" control={<Radio />} label="Pagamento em Loja" />
                    <FormControlLabel value="pix" control={<Radio />} label="PIX" />
                  </RadioGroup>

                  {pagamento.forma_pagamento === "loja" && (
                    <>
                      <Typography variant="subtitle1">Escolha o método de pagamento:</Typography>
                      <RadioGroup name="tipo_pagamento_loja" value={pagamento.tipo_pagamento_loja} onChange={handlePagamentoChange}>
                        <FormControlLabel value="credito" control={<Radio />} label="Cartão de Crédito" />
                        <FormControlLabel value="debito" control={<Radio />} label="Cartão de Débito" />
                        <FormControlLabel value="dinheiro" control={<Radio />} label="Dinheiro" />
                      </RadioGroup>

                      <Box className="d-flex justify-content-between mt-3">
                        <Button variant="outlined" color="secondary" onClick={prevStep}>
                          Voltar
                        </Button>

                        <Button variant="contained" color="success" onClick={criarVenda}>
                          Confirmar Pagamento
                        </Button>

                      </Box>

                    </>
                  )}

                  {pagamento.forma_pagamento === "pix" && (
                    <>
                      <Button variant="contained" color="primary" onClick={gerarPix} disabled={loadingPix}>
                        {loadingPix ? "Gerando QR Code..." : "Gerar QR Code PIX"}
                      </Button>

                      {pagamentoConfirmado ? (
                        // ✅ Exibe a mensagem de pagamento confirmado
                        <Box mt={3} textAlign="center">
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => window.location.href = "/telemedicina"}
                            sx={{ mt: 2 }}
                          >
                            ✅ Pagamento confirmado! Acesse o Telemedicina
                          </Button>
                        </Box>
                      ) : (
                        pixQrCode && (
                          <Box mt={3} textAlign="center">
                            <Typography variant="subtitle1">Escaneie o QR Code para pagar:</Typography>

                            {qrCodeImage && (
                              <img
                                src={qrCodeImage}
                                alt="QR Code PIX"
                                width={200}
                                height={200}
                                style={{ border: "1px solid #ddd" }}
                              />
                            )}

                            <Typography variant="subtitle1" sx={{ mt: 2 }}>
                              Copia e Cola:
                            </Typography>
                            <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
                              <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                {pixQrCode}
                              </Typography>
                            </Box>
                          </Box>
                        )
                      )}
                    </>
                  )}

                </>
              )}
            </motion.div>

          </Box>
        </Paper>
      </motion.div>

    </Container>
  );
}
