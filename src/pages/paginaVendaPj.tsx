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
    const [tipoMensagem, setTipoMensagem] = useState<"success" | "warning" | "danger">("danger");
    const [empresasLista, setEmpresasLista] = useState<any[]>([]);
    const [showEmpresasSuggestions, setShowEmpresasSuggestions] = useState(false);
    const [empresaSelecionada, setEmpresaSelecionada] = useState<any>(null);
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [funcionarios, setFuncionarios] = useState<any[]>([]);
    const [errosArquivo, setErrosArquivo] = useState<string[]>([]);
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

    // Busca empresas para autocomplete
    const buscarEmpresas = async (searchTerm: string = "") => {
        try {
            const response = await fetch(`/api/empresas/listarEmpresas${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`);
            const data = await response.json();
            if (data.success) {
                setEmpresasLista(data.empresas);
            }
        } catch (error) {
            console.error('Erro ao buscar empresas:', error);
        }
    };

    // Manipula o foco no campo nome da empresa
    const handleNomeEmpresaFocus = () => {
        buscarEmpresas();
        setShowEmpresasSuggestions(true);
    };

    // Manipula a seleção de uma empresa da lista
    const handleEmpresaSelect = (empresa: any) => {
        setFormData({
            ...formData,
            nomeEmpresa: empresa.nomeEmpresa,
            nomeFantasia: empresa.nomeFantasia || "",
            email: empresa.email || "",
            cnpj: empresa.cnpj || "",
            inscricaoMunicipal: empresa.inscricaoMunicipal || "",
            inscricaoEstadual: empresa.inscricaoEstadual || "",
            celular: empresa.celular || "",
            cep: empresa.cep || "",
            endereco: empresa.endereco || "",
            uf: empresa.uf || "",
            cidade: empresa.cidade || "",
            valorPlano: empresa.valor_plano || "",
        });
        setEmpresaSelecionada(empresa); // Marca que uma empresa foi selecionada
        setShowEmpresasSuggestions(false);
    };

    // Manipula mudança no campo nome da empresa
    const handleNomeEmpresaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, nomeEmpresa: value });
        
        // Se o usuário começar a digitar, limpa a empresa selecionada
        if (empresaSelecionada && value !== empresaSelecionada.nomeEmpresa) {
            setEmpresaSelecionada(null);
        }
        
        // Sempre busca empresas quando digita (filtra conforme o texto)
        buscarEmpresas(value);
        
        // Mantém a lista visível sempre que há foco no campo
        if (showEmpresasSuggestions) {
            // Lista já está visível, apenas filtra
        }
    };

    const nextStep = async () => {
        if (currentStep === 1) {
            // Se uma empresa existente foi selecionada, pula o cadastro
            if (empresaSelecionada) {
                setCurrentStep((prev) => prev + 1);
                return;
            }

            setLoading(true);
            try {
                // Cadastro empresa (mantém igual)
                const saudeECorResponse = await fetch('/api/empresas/cadastroSaudeECor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nomeEmpresa: formData.nomeEmpresa,
                        nomeFantasia: formData.nomeFantasia,
                        email: formData.email,
                        cnpj: formData.cnpj,
                        inscricaoMunicipal: formData.inscricaoMunicipal,
                        inscricaoEstadual: formData.inscricaoEstadual,
                        celular: formData.celular,
                        cep: formData.cep,
                        endereco: formData.endereco,
                        uf: formData.uf,
                        cidade: formData.cidade,
                    }),
                });
                const saudeECorData = await saudeECorResponse.json();
                if (!saudeECorResponse.ok) {
                    throw new Error(saudeECorData.error || 'Erro ao cadastrar empresa no sistema Saúde e Cor');
                }
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
                        inscricaoMunicipal: formData.inscricaoMunicipal,
                        inscricaoEstadual: formData.inscricaoEstadual,
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
                    throw new Error(data.message || 'Erro ao cadastrar empresa no banco de dados');
                }
            } catch (error: any) {
                setTipoMensagem("danger");
                setMensagemDeErro(error.message || 'Erro inesperado ao cadastrar empresa.');
                return;
            } finally {
                setLoading(false);
            }
        }

        if (currentStep === 2 && arquivo && funcionarios.length > 0) {
            setLoading(true);
            try {
                // Lê o arquivo como texto base64 para enviar via JSON
                const arquivoBase64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(arquivo);
                });

                const payload = {
                    instituicao: formData.nomeEmpresa,
                    arquivoBase64,
                };

                const response = await fetch('/api/vendaPlanoPj/subirVidaSaudeECor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    setTipoMensagem("danger");
                    setMensagemDeErro(errorData.message || 'Erro ao subir vidas para Saúde e Cor');
                    setLoading(false);
                    return;
                }
            } catch (error: any) {
                setTipoMensagem("danger");
                setMensagemDeErro(error.message || 'Erro inesperado ao subir vidas para Saúde e Cor');
                setLoading(false);
                return;
            } finally {
                setLoading(false);
            }
        }

        setCurrentStep((prev) => prev + 1);
    };

    const prevStep = () => setCurrentStep((prev) => prev - 1);

    // Função para processar arquivo CSV
    const processarCSV = (texto: string) => {
        const linhas = texto.split('\n').filter(linha => linha.trim());
        const funcionariosProcessados: any[] = [];
        const erros: string[] = [];

        linhas.forEach((linha, index) => {
            // Remove aspas duplas do início/fim da linha, se houver
            let linhaLimpa = linha.trim();
            if (linhaLimpa.startsWith('"') && linhaLimpa.endsWith('"')) {
                linhaLimpa = linhaLimpa.slice(1, -1);
            }
            const campos = linhaLimpa.split(';');

            if (campos.length !== 6) {
                erros.push(`Linha ${index + 1}: Formato inválido - esperado 6 colunas separadas por ;`);
                return;
            }

            const [nome, cpf, dataNascimento, codigoPlano, uf, sexo] = campos.map(campo => campo.trim());

            // Validações básicas
            if (!nome) erros.push(`Linha ${index + 1}: Nome é obrigatório`);
            if (!cpf || cpf.length < 11) erros.push(`Linha ${index + 1}: CPF inválido`);
            if (!dataNascimento) erros.push(`Linha ${index + 1}: Data de nascimento é obrigatória`);
            if (!uf || uf.length !== 2) erros.push(`Linha ${index + 1}: UF inválida`);
            if (!sexo || !['M', 'F'].includes(sexo.toUpperCase())) erros.push(`Linha ${index + 1}: Sexo deve ser M ou F`);

            if (erros.length === 0 || !erros.some(erro => erro.includes(`Linha ${index + 1}`))) {
                funcionariosProcessados.push({
                    nome,
                    cpf: cpf.replace(/\D/g, ''), // Remove caracteres não numéricos
                    dataNascimento,
                    codigoPlano: codigoPlano || '3', // Plano padrão 3
                    uf: uf.toUpperCase(),
                    sexo: sexo.toUpperCase()
                });
            }
        });

        setFuncionarios(funcionariosProcessados);
        setErrosArquivo(erros);
    };

    // Função para lidar com upload de arquivo
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setArquivo(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const texto = e.target?.result as string;
            if (file.type.includes('csv') || file.name.endsWith('.csv')) {
                processarCSV(texto);
            } else if (file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // Para Excel, primeiro convertemos para CSV
                setTipoMensagem("warning");
                setMensagemDeErro('Arquivos Excel serão suportados em breve. Use CSV por enquanto.');
            }
        };
        reader.readAsText(file);
    };

    const steps = ["Dados da Empresa", "Endereço", "Upload de Funcionários", "Pagamento"];

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
                            
                            {/* Campo especial para Nome da Empresa com autocomplete */}
                            <Box className="mb-3" style={{ position: 'relative' }}>
                                <label className="form-label">
                                    Nome da Empresa <span style={{ color: 'red' }}>*</span>
                                    {empresaSelecionada && (
                                        <span style={{ color: 'green', fontSize: '0.9em', marginLeft: '10px' }}>
                                            (Empresa existente selecionada)
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="nomeEmpresa"
                                    value={formData.nomeEmpresa}
                                    onChange={handleNomeEmpresaChange}
                                    onFocus={handleNomeEmpresaFocus}
                                    onBlur={() => setTimeout(() => setShowEmpresasSuggestions(false), 200)}
                                    required
                                    placeholder="Digite o nome da empresa..."
                                />
                                
                                {/* Lista de sugestões */}
                                {showEmpresasSuggestions && (
                                    <Box
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            zIndex: 1000,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {empresasLista.length > 0 ? (
                                            empresasLista.map((empresa, index) => (
                                                <Box
                                                    key={empresa.idEmpresa || index}
                                                    onClick={() => handleEmpresaSelect(empresa)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        cursor: 'pointer',
                                                        borderBottom: index < empresasLista.length - 1 ? '1px solid #eee' : 'none'
                                                    }}
                                                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f5f5f5'}
                                                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'white'}
                                                >
                                                    <div style={{ fontWeight: 'bold' }}>{empresa.nomeEmpresa}</div>
                                                    {empresa.nomeFantasia && (
                                                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                                                            {empresa.nomeFantasia}
                                                        </div>
                                                    )}
                                                    {empresa.cnpj && (
                                                        <div style={{ fontSize: '0.8em', color: '#999' }}>
                                                            CNPJ: {empresa.cnpj}
                                                        </div>
                                                    )}
                                                </Box>
                                            ))
                                        ) : (
                                            <Box style={{ padding: '8px 12px', color: '#999', fontStyle: 'italic' }}>
                                                Nenhuma empresa encontrada
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>

                            {/* Botão para limpar seleção */}
                            {empresaSelecionada && (
                                <Box className="mb-3 text-center">
                                    <Button 
                                        variant="outlined" 
                                        color="warning" 
                                        size="small"
                                        onClick={() => {
                                            setEmpresaSelecionada(null);
                                            setFormData({
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
                                        }}
                                    >
                                        Cadastrar Nova Empresa
                                    </Button>
                                </Box>
                            )}

                            {/* Outros campos */}
                            {[
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
                                        disabled={!!empresaSelecionada} // Desabilita se empresa foi selecionada
                                        style={empresaSelecionada ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
                                    />
                                </Box>
                            ))}
                        </>
                    )}

                    {currentStep === 1 && (
                        <>
                            <Typography variant="h6" align="center" gutterBottom>
                                Preencha o endereço da empresa
                                {empresaSelecionada && (
                                    <span style={{ color: 'green', fontSize: '0.8em', display: 'block', marginTop: '5px' }}>
                                        (Dados da empresa existente)
                                    </span>
                                )}
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
                                        disabled={disabled || !!empresaSelecionada} // Desabilita se empresa selecionada
                                        style={empresaSelecionada ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
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
                                    disabled={!!empresaSelecionada} // Desabilita se empresa selecionada
                                    style={empresaSelecionada ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
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
                                    disabled={!!empresaSelecionada} // Desabilita se empresa selecionada
                                    style={empresaSelecionada ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
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
                                Upload de Funcionários
                            </Typography>
                            <Typography align="center" sx={{ mb: 3 }}>
                                Faça o upload de um arquivo CSV com os dados dos funcionários
                            </Typography>

                            <Box className="mb-4">
                                <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Formato do arquivo CSV:
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    O arquivo deve conter as seguintes colunas separadas por ponto e vírgula (;):
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                                    Nome;CPF;Data de nascimento;Código do plano (opcional);UF;Sexo
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1, fontSize: '0.9em', color: '#666' }}>
                                    • Código do plano: Se não informado, será usado o plano padrão (3)
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2, fontSize: '0.9em', color: '#666' }}>
                                    • Sexo: M (Masculino) ou F (Feminino)
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Exemplo:
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                                    ANGELICA CRISTINA DA SILVA GOMES;12345678900;11/01/1983;3;AC;F
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, mt: 1 }}>
                                    JOÃO CARLOS DOS SANTOS;98765432100;15/03/1990;;SP;M (sem código do plano - usará padrão 3)
                                </Typography>
                                
                                <Box sx={{ textAlign: 'center', mt: 2, mb: 3 }}>
                                    <a 
                                        href="/exemplo-funcionarios.csv" 
                                        download="exemplo-funcionarios.csv"
                                        style={{ 
                                            color: '#1976d2', 
                                            textDecoration: 'none',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        📥 Baixar arquivo de exemplo CSV
                                    </a>
                                </Box>
                            </Box>

                            <Box className="mb-3">
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileUpload}
                                    className="form-control"
                                    style={{ padding: '10px' }}
                                />
                            </Box>

                            {arquivo && (
                                <Box className="mb-3">
                                    <Typography variant="body2" sx={{ color: 'green' }}>
                                        Arquivo selecionado: {arquivo.name}
                                    </Typography>
                                </Box>
                            )}

                            {errosArquivo.length > 0 && (
                                <Box className="mb-3" sx={{ backgroundColor: '#ffebee', p: 2, borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ color: 'red', fontWeight: 'bold', mb: 1 }}>
                                        Erros encontrados no arquivo:
                                    </Typography>
                                    {errosArquivo.map((erro, index) => (
                                        <Typography key={index} variant="body2" sx={{ color: 'red', fontSize: '0.85em' }}>
                                            • {erro}
                                        </Typography>
                                    ))}
                                </Box>
                            )}

                            {funcionarios.length > 0 && (
                                <Box className="mb-3">
                                    <Typography variant="body2" sx={{ color: 'green', fontWeight: 'bold', mb: 2 }}>
                                        Funcionários processados: {funcionarios.length}
                                    </Typography>
                                    
                                    <Box sx={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
                                        <table className="table table-sm table-striped mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Nome</th>
                                                    <th>CPF</th>
                                                    <th>Nascimento</th>
                                                    <th>Plano</th>
                                                    <th>UF</th>
                                                    <th>Sexo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {funcionarios.slice(0, 10).map((func, index) => (
                                                    <tr key={index}>
                                                        <td style={{ fontSize: '0.85em' }}>{func.nome}</td>
                                                        <td style={{ fontSize: '0.85em' }}>{func.cpf}</td>
                                                        <td style={{ fontSize: '0.85em' }}>{func.dataNascimento}</td>
                                                        <td style={{ fontSize: '0.85em' }}>{func.codigoPlano}</td>
                                                        <td style={{ fontSize: '0.85em' }}>{func.uf}</td>
                                                        <td style={{ fontSize: '0.85em' }}>{func.sexo}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {funcionarios.length > 10 && (
                                            <Typography variant="body2" sx={{ textAlign: 'center', p: 1, fontStyle: 'italic' }}>
                                                ... e mais {funcionarios.length - 10} funcionários
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}

                    {currentStep === 3 && (
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
                                            const response = await fetch('/api/vendaPlanoPj/vendaClientePj', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                    nomeEmpresa: formData.nomeEmpresa,
                                                    cnpj: formData.cnpj,
                                                    formaPagamento: formData.formaPagamento,
                                                    valorPlano: formData.valorPlano,
                                                    idUsuario: user?.id || idUsuario,
                                                }),
                                            });

                                            if (!response.ok) {
                                                const errorData = await response.json();
                                                throw new Error(errorData.message || 'Erro ao processar venda');
                                            }

                                            const data = await response.json();
                                            if (data.paymentLink) {
                                                // Registra a venda na tabela tb_vendas_telemedicina
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
                                                }

                                                setPaymentLink(data.paymentLink);
                                                setShowPopup(true);
                                            } else {
                                                alert('Erro: o link de pagamento não foi retornado.');
                                            }
                                        } catch (error: any) {
                                            setTipoMensagem("danger");
                                            alert(`Erro ao processar venda: ${error.message}`);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={!formData.formaPagamento}
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
                    {currentStep < 3 && (
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
                            ? "Cadastrando empresa no sistema Saúde e Cor e no banco de dados..."
                            : currentStep === 3
                                ? funcionarios.length > 0 
                                    ? `Processando venda e cadastrando ${funcionarios.length} funcionários...`
                                    : "Enviando dados de cobrança..."
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
                    tipo={tipoMensagem}
                    duracao={5000}
                    onClose={() => {
                        setMensagemDeErro(null);
                        setTipoMensagem("danger"); // Reset para o padrão
                    }}
                />
            )}
        </Container>
    );
}
