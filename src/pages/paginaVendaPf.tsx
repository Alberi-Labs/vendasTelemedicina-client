import { useState, useEffect } from "react";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import TelaCarregamento from "@/components/telaCarregamento/TelaCarregamento";
import PaymentLinkPopup from "@/components/paymentLinkPopup/PaymentLinkPopup";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import { useAuth } from "@/app/context/AuthContext";
import { vendaPlanoPf, vendaTelemedicinaApiCompat, instituicoesApi, clientesApi } from "@/lib/api-client";
import type { SelectChangeEvent } from '@mui/material/Select';

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
        bairro: "",
        sexo: "",
        uf: "",
        cidade: "",
        id_cidade: "", // ID da cidade do IBGE
        formaPagamento: "",
        instituicao: "", // nome da instituição
        id_instituicao: "", // id se admin selecionar
    });
    const [erros, setErros] = useState<{ [key: string]: string }>({});
    const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
    const [cidades, setCidades] = useState<{ nome: string; id: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [paymentLink, setPaymentLink] = useState("");
    const [mensagemDeErro, setMensagemDeErro] = useState<string | null>(null);
    const [instituicoes, setInstituicoes] = useState<Array<{ id: number; nome: string }>>([]);
    const [validating, setValidating] = useState(false);
    const { user } = useAuth();

    let idUsuario: string = "";

    useEffect(() => {
        fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
            .then((res) => res.json())
            .then((data) => {
                setEstados(data.map((estado: any) => ({ sigla: estado.sigla, nome: estado.nome })));
            });
    }, []);

    // Carrega instituições se usuário for admin
    useEffect(() => {
        const isAdmin = user?.perfil?.toLowerCase() === 'admin';
        if (isAdmin) {
            instituicoesApi.listar()
                .then((data: any) => {
                    console.log('🔸 Instituições carregadas:', data);
                    const lista = Array.isArray(data) ? data : data?.instituicoes || [];
                    const mapped = lista.map((i: any) => ({
                        id: i.idInstituicao || i.id || i.id_instituicao,
                        nome: i.nomeInstituicao || i.nome || i.nome_instituicao,
                    })).filter((i: any) => i.id && i.nome);
                    setInstituicoes(mapped);
                })
                .catch(err => console.error('Erro ao listar instituições', err));
        } else if (user?.dsc_instituicao) {
            setFormData(prev => ({ ...prev, instituicao: user.dsc_instituicao || "" }));
        }
    }, [user]);

    useEffect(() => {
        if (formData.uf) {
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.uf}/municipios`)
                .then((res) => res.json())
                .then((data) => setCidades(data.map((cidade: any) => ({ 
                    nome: cidade.nome, 
                    id: cidade.id 
                }))));
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
                            bairro: data.bairro,
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
            setFormData((prev) => ({ ...prev, endereco: "", bairro: "", uf: "", cidade: "" }));
        }
    }, [formData.cep]);

    const formatCpf = (value: string) => {
        return value
            .replace(/\D/g, "") // Remove tudo que não é número
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    };

    const formatTelefone = (value: string) => {
        return value
            .replace(/\D/g, "") // Remove tudo que não é número
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2")
            .slice(0, 15);
    };

    const formatNascimento = (value: string) => {
        return value
            .replace(/\D/g, "") // Remove tudo que não é número
            .replace(/(\d{2})(\d)/, "$1/$2")
            .replace(/(\d{2})(\d)/, "$1/$2")
            .slice(0, 10);
    };

    const handleChangeFormat = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | any) => {
        const target = e.target;
        let { name, value } = target;

        if (name === "cpf") value = formatCpf(value);
        if (name === "celular") value = formatTelefone(value);
        if (name === "nascimento") value = formatNascimento(value);

        setFormData((prev) => ({ ...prev, [name]: value }));
        if (erros[name]) setErros(prev => ({ ...prev, [name]: "" }));
    };

    const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Remove todos os caracteres que não são números
        const numeroValue = value.replace(/\D/g, '');
        
        setFormData((prev) => ({ ...prev, [name]: numeroValue }));
        if (erros[name]) setErros(prev => ({ ...prev, [name]: "" }));
    };

    const handleUfChange = (e: SelectChangeEvent<string>) => {
        const value = e.target.value as string;
        setFormData(prev => ({ ...prev, uf: value, cidade: "" }));
        if (erros.uf) setErros(prev => ({ ...prev, uf: '' }));
    };

    // Converte 'DD/MM/AAAA' para 'YYYY-MM-DD' (formato DATE do MySQL)
    const toDbDate = (value: string) => {
        const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) return "";
        const [, dd, mm, yyyy] = m;
        return `${yyyy}-${mm}-${dd}`;
    };

    const camposObrigatorios: { [key: number]: string[] } = {
        0: ['nome', 'email', 'cpf', 'celular', 'nascimento', 'sexo', 'instituicao'],
        1: ['cep', 'endereco', 'casa', 'uf', 'cidade'],
        2: ['formaPagamento'],
    };

    const validarCamposStep = (step: number) => {
        const lista = camposObrigatorios[step] || [];
        const novosErros: any = {};
        lista.forEach(c => {
            if (!formData[c as keyof typeof formData]) {
                novosErros[c] = 'Obrigatório';
            }
        });
        // valida formatos
        if (lista.includes('cpf') && formData.cpf && formData.cpf.replace(/\D/g,'').length !== 11) {
            novosErros.cpf = 'CPF inválido';
        }
        if (lista.includes('nascimento') && formData.nascimento) {
            const db = toDbDate(formData.nascimento);
            if (!db) novosErros.nascimento = 'Data inválida';
        }
        setErros((prev) => ({ ...prev, ...novosErros }));
        return Object.keys(novosErros).length === 0;
    };

    const nextStep = async () => {
        if (!validarCamposStep(currentStep)) return;

        if (currentStep === 2) {
            if (!formData.formaPagamento) {
                setMensagemDeErro('Por favor, selecione uma forma de pagamento.');
                return;
            }

            setLoading(true);
            setValidating(true);
            try {
                const sexoFormatado = formData.sexo.toLowerCase() === 'feminino' ? 'F' : 'M';
                const nascimentoDb = toDbDate(formData.nascimento);
                
                console.log('Dados do formulário antes da venda:', formData);
                const dadosCliente = {
                    nome: formData.nome,
                    email: formData.email,
                    cpf: formData.cpf.replace(/\D/g, ''),
                    telefone: formData.celular,
                    data_nascimento: nascimentoDb,
                    cep: formData.cep,
                    endereco: formData.endereco,
                    numero: formData.casa,
                    bairro: formData.bairro,
                    sexo: sexoFormatado,
                    uf: formData.uf,
                    cidade: formData.cidade,
                    id_cidade: formData.id_cidade && formData.id_cidade !== "" ? parseInt(formData.id_cidade, 10) : null, // Converte para número ou null
                    id_instituicao: formData.id_instituicao || user?.id_instituicao,
                };
                
                console.log('🔸 1º Passo: Cadastrando cliente no banco:', dadosCliente);
                const respostaCliente = await clientesApi.cadastrarTelemedicina(dadosCliente);
                
                if (!respostaCliente.success || !respostaCliente.clienteId) {
                    throw new Error(respostaCliente.error || 'Erro ao cadastrar cliente');
                }
                
                console.log('✅ Cliente cadastrado com sucesso, ID:', respostaCliente.clienteId);
                
                // 2. SEGUNDO: Criar assinatura usando o ID do cliente
                const dadosAssinatura = {
                    clienteId: respostaCliente.clienteId,
                    valorPlano: 29.9,
                    formaDePagamento: formData.formaPagamento,
                    idUsuario: user?.id,
                };
                
                console.log('🔸 2º Passo: Criando assinatura:', dadosAssinatura);
                const respostaAssinatura = await vendaTelemedicinaApiCompat.criarAssinatura(dadosAssinatura);
                
                if (!respostaAssinatura.success || !respostaAssinatura.paymentLink) {
                    throw new Error(respostaAssinatura.error || 'Erro ao criar assinatura');
                }
                
                console.log('✅ Assinatura criada com sucesso');
                setPaymentLink(respostaAssinatura.paymentLink);
                setShowPopup(true);
            } catch (error: any) {
                console.error('Erro no processamento da venda:', error);
                setMensagemDeErro(error.message || 'Erro inesperado.');
                return;
            } finally {
                setLoading(false);
                setValidating(false);
            }
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };


    const prevStep = () => setCurrentStep((prev) => prev - 1);

    const steps = ["Dados Pessoais", "Endereço", "Pagamento"];

    const isAdmin = user?.perfil?.toLowerCase() === 'admin';

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 5 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Venda Cartão Saúde e Cor
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
                            <Typography variant="h6" gutterBottom align="left">
                                Informações do Titular
                            </Typography>
                            <Divider sx={{ mb: 3 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={8}>
                                    <TextField
                                        label="Nome completo"
                                        name="nome"
                                        fullWidth
                                        value={formData.nome}
                                        onChange={handleChangeFormat}
                                        error={!!erros.nome}
                                        helperText={erros.nome}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="CPF"
                                        name="cpf"
                                        fullWidth
                                        value={formData.cpf}
                                        onChange={handleChangeFormat}
                                        error={!!erros.cpf}
                                        helperText={erros.cpf || 'Somente números'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Data de Nascimento"
                                        name="nascimento"
                                        fullWidth
                                        value={formData.nascimento}
                                        onChange={handleChangeFormat}
                                        error={!!erros.nascimento}
                                        helperText={erros.nascimento || 'Formato: DD/MM/AAAA'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Celular"
                                        name="celular"
                                        fullWidth
                                        value={formData.celular}
                                        onChange={handleChangeFormat}
                                        error={!!erros.celular}
                                        helperText={erros.celular}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="E-mail"
                                        name="email"
                                        type="email"
                                        fullWidth
                                        value={formData.email}
                                        onChange={handleChangeFormat}
                                        error={!!erros.email}
                                        helperText={erros.email}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth error={!!erros.sexo}>
                                        <InputLabel id="sexo-label">Gênero</InputLabel>
                                        <Select
                                            labelId="sexo-label"
                                            label="Gênero"
                                            name="sexo"
                                            value={formData.sexo}
                                            onChange={handleChangeFormat}
                                        >
                                            <MenuItem value="masculino">Masculino</MenuItem>
                                            <MenuItem value="feminino">Feminino</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {isAdmin && (
                                    <Grid item xs={12} md={8}>
                                        <FormControl fullWidth error={!!erros.instituicao}>
                                            <InputLabel id="instituicao-label">Instituição</InputLabel>
                                            <Select
                                                labelId="instituicao-label"
                                                label="Instituição"
                                                name="instituicao"
                                                value={formData.instituicao}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    const inst = instituicoes.find(i => i.nome === value || String(i.id) === String(value));
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        instituicao: inst?.nome || value,
                                                        id_instituicao: inst?.id ? String(inst.id) : ''
                                                    }));
                                                    if (erros.instituicao) setErros(prev => ({ ...prev, instituicao: '' }));
                                                }}
                                            >
                                                {instituicoes.map(i => (
                                                    <MenuItem key={i.id} value={i.nome}>{i.nome}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}
                                {!isAdmin && (
                                    <Grid item xs={12} md={8}>
                                        <TextField
                                            label="Instituição"
                                            name="instituicao"
                                            fullWidth
                                            value={formData.instituicao || user?.dsc_instituicao || ''}
                                            InputProps={{ readOnly: true }}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </>
                    )}

                    {currentStep === 1 && (
                        <>
                            <Typography variant="h6" gutterBottom align="left">
                                Endereço de Correspondência
                            </Typography>
                            <Divider sx={{ mb: 3 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4} md={3}>
                                    <TextField
                                        label="CEP"
                                        name="cep"
                                        fullWidth
                                        value={formData.cep}
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0,9);
                                            setFormData(prev => ({ ...prev, cep: v }));
                                            if (erros.cep) setErros(prev => ({ ...prev, cep: '' }));
                                        }}
                                        error={!!erros.cep}
                                        helperText={erros.cep}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={8} md={5}>
                                    <TextField
                                        label="Endereço"
                                        name="endereco"
                                        fullWidth
                                        value={formData.endereco}
                                        onChange={handleChangeFormat}
                                        InputProps={{ readOnly: true }}
                                        error={!!erros.endereco}
                                        helperText={erros.endereco}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4} md={2}>
                                    <TextField
                                        label="Número"
                                        name="casa"
                                        fullWidth
                                        value={formData.casa}
                                        onChange={handleNumeroChange}
                                        error={!!erros.casa}
                                        inputProps={{
                                            inputMode: 'numeric',
                                            pattern: '[0-9]*'
                                        }}
                                        placeholder="Ex: 123"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={8} md={2}>
                                    <TextField
                                        label="Bairro"
                                        name="bairro"
                                        fullWidth
                                        value={formData.bairro}
                                        onChange={handleChangeFormat}
                                        error={!!erros.bairro}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth error={!!erros.uf}>
                                        <InputLabel id="uf-label">Estado</InputLabel>
                                        <Select
                                            labelId="uf-label"
                                            label="Estado"
                                            name="uf"
                                            value={formData.uf}
                                            onChange={handleUfChange}
                                        >
                                            {estados.map((estado) => (
                                                <MenuItem key={estado.sigla} value={estado.sigla}>{estado.nome}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={5}>
                                    <FormControl fullWidth error={!!erros.cidade}>
                                        <InputLabel id="cidade-label">Cidade</InputLabel>
                                        <Select
                                            labelId="cidade-label"
                                            label="Cidade"
                                            name="cidade"
                                            value={formData.cidade}
                                            onChange={(e) => {
                                                const cidadeSelecionada = cidades.find(c => c.nome === e.target.value);
                                                console.log('Cidade selecionada:', cidadeSelecionada);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    cidade: e.target.value as string,
                                                    id_cidade: cidadeSelecionada?.id || ""
                                                }));
                                            }}
                                        >
                                            {cidades.map((cidade, index) => (
                                                <MenuItem key={index} value={cidade.nome}>{cidade.nome}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </>
                    )}

                    {currentStep === 2 && (
                        <>
                            <Typography variant="h6" gutterBottom align="left">
                                Forma de Pagamento
                            </Typography>
                            <Divider sx={{ mb: 3 }} />
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Selecione</FormLabel>
                                <RadioGroup
                                    row
                                    name="formaPagamento"
                                    value={formData.formaPagamento}
                                    onChange={handleChangeFormat}
                                >
                                    <FormControlLabel value="cartao" control={<Radio />} label="Cartão" />
                                    <FormControlLabel value="pix" control={<Radio />} label="Pix" />
                                    <FormControlLabel value="boleto" control={<Radio />} label="Boleto" />
                                </RadioGroup>
                            </FormControl>
                            {!formData.formaPagamento && (
                                <Alert sx={{ mt:2 }} severity="info">Escolha uma forma de pagamento para prosseguir.</Alert>
                            )}
                            <Box mt={2}>
                                <Typography variant="body2" color="text.secondary">
                                    Ao finalizar, geraremos automaticamente o cadastro, assinatura e cobrança.
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>

                <Box className="d-flex justify-content-between mt-4">
                    <Box>
                        {currentStep > 0 && (
                            <Button variant="outlined" color="inherit" onClick={prevStep} disabled={loading}>
                                Voltar
                            </Button>
                        )}
                    </Box>
                    <Box display="flex" gap={2}>
                        {currentStep < 2 && (
                            <Button
                                variant="contained"
                                sx={{ backgroundColor: "#607d8b" }}
                                onClick={nextStep}
                                disabled={loading}
                            >
                                Próximo
                            </Button>
                        )}
                        {currentStep === 2 && (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={nextStep}
                                disabled={!formData.formaPagamento || loading || validating}
                            >
                                {loading ? 'Processando...' : 'Finalizar' }
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>
            {loading && (
                <TelaCarregamento
                    mensagem={
                        currentStep === 1
                            ? "Cadastrando dados do cliente..."
                            : currentStep === 2
                                ? "Processando venda: Cadastro no sistema → Banco de dados → Cobrança..."
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