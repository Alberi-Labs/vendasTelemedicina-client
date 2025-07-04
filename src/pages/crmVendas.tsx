import { useState, useEffect } from "react";
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    CardActions,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar
} from "@mui/material";
import { useAuth } from "@/app/context/AuthContext";

// Interface para contatos
interface Contato {
    nome: string;
    telefone: string;
    email: string;
    cargo: string;
}

// Interface para os dados do CRM
interface CrmVenda {
    id?: number;
    empresa: string;
    local: string;
    data: string;
    horario: string;
    contatos: Contato[];
    numero_funcionarios: number;
    descricao: string;
    situacao: string;
    observacoes: string;
    id_usuario: number;
    criado_em?: string;
}

const situacoesDisponiveis = [
    { value: "prospeccao", label: "Prospecção", color: "#2196F3" },
    { value: "contato_inicial", label: "Contato Inicial", color: "#FF9800" },
    { value: "apresentacao", label: "Apresentação", color: "#9C27B0" },
    { value: "negociacao", label: "Negociação", color: "#FF5722" },
    { value: "fechamento", label: "Fechamento", color: "#4CAF50" },
    { value: "negado", label: "Negado", color: "#757575" },
    { value: "follow_up", label: "Follow-up", color: "#00BCD4" }
];

export default function CrmVendas() {
    const { user } = useAuth();
    const [vendas, setVendas] = useState<CrmVenda[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingVenda, setEditingVenda] = useState<CrmVenda | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" as "success" | "error" });
    const [loadingLocation, setLoadingLocation] = useState(false);
    
    const [formData, setFormData] = useState<CrmVenda>({
        empresa: "",
        local: "",
        data: "",
        horario: "",
        contatos: [{ nome: "", telefone: "", email: "", cargo: "" }],
        numero_funcionarios: 0,
        descricao: "",
        situacao: "prospeccao",
        observacoes: "",
        id_usuario: user?.id || 0
    });

    const [filtros, setFiltros] = useState({
        situacao: "",
        empresa: "",
        dataInicio: "",
        dataFim: ""
    });

    useEffect(() => {
        if (user?.id) {
            carregarVendas();
        }
    }, [user?.id]);

    const carregarVendas = async () => {
        setLoading(true);
        try {
            if (!user?.id) {
                showSnackbar('Usuário não autenticado', 'error');
                setLoading(false);
                return;
            }

            const response = await fetch(`/api/crmVendas/consultar?id_usuario=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setVendas(data.vendas || []);
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.error || 'Erro ao carregar dados', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            showSnackbar('Erro ao carregar dados', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingVenda 
                ? `/api/crmVendas/atualizar?id=${editingVenda.id}`
                : '/api/crmVendas/criar';
            
            const method = editingVenda ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                showSnackbar(
                    editingVenda ? 'Proposta atualizada com sucesso!' : 'Proposta criada com sucesso!',
                    'success'
                );
                resetForm();
                setOpenDialog(false);
                carregarVendas();
            } else {
                const errorData = await response.json();
                showSnackbar(errorData.error || 'Erro ao salvar proposta', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar proposta:', error);
            showSnackbar('Erro ao salvar proposta', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (venda: CrmVenda) => {
        setEditingVenda(venda);
        setFormData(venda);
        setOpenDialog(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja deletar esta proposta?')) return;

        try {
            const response = await fetch(`/api/crmVendas/deletar?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showSnackbar('Proposta deletada com sucesso!', 'success');
                carregarVendas();
            } else {
                showSnackbar('Erro ao deletar proposta', 'error');
            }
        } catch (error) {
            console.error('Erro ao deletar proposta:', error);
            showSnackbar('Erro ao deletar proposta', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            empresa: "",
            local: "",
            data: "",
            horario: "",
            contatos: [{ nome: "", telefone: "", email: "", cargo: "" }],
            numero_funcionarios: 0,
            descricao: "",
            situacao: "prospeccao",
            observacoes: "",
            id_usuario: user?.id || 0
        });
        setEditingVenda(null);
    };

    // Funções para gerenciar contatos
    const adicionarContato = () => {
        setFormData({
            ...formData,
            contatos: [...formData.contatos, { nome: "", telefone: "", email: "", cargo: "" }]
        });
    };

    const removerContato = (index: number) => {
        if (formData.contatos.length > 1) {
            const novosContatos = formData.contatos.filter((_, i) => i !== index);
            setFormData({ ...formData, contatos: novosContatos });
        }
    };

    const atualizarContato = (index: number, campo: keyof Contato, valor: string) => {
        const novosContatos = [...formData.contatos];
        novosContatos[index] = { ...novosContatos[index], [campo]: valor };
        setFormData({ ...formData, contatos: novosContatos });
    };

    // Função para obter localização atual
    const obterLocalizacaoAtual = () => {
        setLoadingLocation(true);
        
        if (!navigator.geolocation) {
            showSnackbar('Geolocalização não é suportada neste navegador', 'error');
            setLoadingLocation(false);
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Usar API gratuita do OpenStreetMap Nominatim para geocodificação reversa
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`
                    );
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.display_name) {
                            // Formatear o endereço de forma mais limpa
                            const endereco = data.display_name;
                            setFormData({ ...formData, local: endereco });
                            showSnackbar('📍 Localização obtida com sucesso!', 'success');
                        } else {
                            throw new Error('Endereço não encontrado');
                        }
                    } else {
                        throw new Error('Erro na API de localização');
                    }
                } catch (error) {
                    // Fallback para coordenadas se a API falhar
                    const coordenadas = `📍 Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
                    setFormData({ ...formData, local: coordenadas });
                    showSnackbar('Coordenadas obtidas. Endereço não disponível.', 'success');
                }
                
                setLoadingLocation(false);
            },
            (error) => {
                let mensagem = 'Erro ao obter localização';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        mensagem = '❌ Permissão de localização negada. Ative a localização no seu navegador.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        mensagem = '❌ Localização indisponível no momento';
                        break;
                    case error.TIMEOUT:
                        mensagem = '⏱️ Tempo limite para obter localização excedido';
                        break;
                }
                
                showSnackbar(mensagem, 'error');
                setLoadingLocation(false);
            },
            options
        );
    };

    const showSnackbar = (message: string, type: "success" | "error") => {
        setSnackbar({ open: true, message, type });
    };

    const getSituacaoConfig = (situacao: string) => {
        return situacoesDisponiveis.find(s => s.value === situacao) || situacoesDisponiveis[0];
    };

    const formatarData = (data: string) => {
        try {
            // Se a data já está no formato YYYY-MM-DD, retorna ela diretamente
            if (data.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [ano, mes, dia] = data.split('-');
                return `${dia}/${mes}/${ano}`;
            }
            
            // Se é uma data ISO, converte para o formato brasileiro
            const dataObj = new Date(data);
            return dataObj.toLocaleDateString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return data; // Retorna a data original em caso de erro
        }
    };

    const formatarHorario = (horario: string) => {
        try {
            // Se o horário já está no formato HH:MM, retorna ele diretamente
            if (horario.match(/^\d{2}:\d{2}$/)) {
                return horario;
            }
            
            // Se o horário tem segundos (HH:MM:SS), remove os segundos
            if (horario.match(/^\d{2}:\d{2}:\d{2}$/)) {
                return horario.substring(0, 5);
            }
            
            return horario;
        } catch (error) {
            console.error('Erro ao formatar horário:', error);
            return horario; // Retorna o horário original em caso de erro
        }
    };

    const vendasFiltradas = vendas.filter(venda => {
        if (filtros.situacao && venda.situacao !== filtros.situacao) return false;
        if (filtros.empresa && !venda.empresa.toLowerCase().includes(filtros.empresa.toLowerCase())) return false;
        if (filtros.dataInicio && venda.data < filtros.dataInicio) return false;
        if (filtros.dataFim && venda.data > filtros.dataFim) return false;
        return true;
    });

    return (
        <Container maxWidth="xl" sx={{ py: 9 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1">
                        CRM de Propostas
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => {
                            resetForm();
                            setOpenDialog(true);
                        }}
                        sx={{ backgroundColor: "#1976d2" }}
                    >
                        + Nova Proposta
                    </Button>
                </Box>

                {/* Filtros */}
                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Filtros</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Situação</InputLabel>
                                <Select
                                    value={filtros.situacao}
                                    label="Situação"
                                    onChange={(e) => setFiltros({...filtros, situacao: e.target.value})}
                                >
                                    <MenuItem value="">Todas</MenuItem>
                                    {situacoesDisponiveis.map((situacao) => (
                                        <MenuItem key={situacao.value} value={situacao.value}>
                                            {situacao.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Empresa"
                                value={filtros.empresa}
                                onChange={(e) => setFiltros({...filtros, empresa: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Data Início"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={filtros.dataInicio}
                                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Data Fim"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={filtros.dataFim}
                                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Lista de Vendas */}
                <Grid container spacing={2}>
                    {vendasFiltradas.map((venda) => {
                        const situacaoConfig = getSituacaoConfig(venda.situacao);
                        return (
                            <Grid item xs={12} md={6} lg={4} key={venda.id}>
                                <Card elevation={2}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                            <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                                                {venda.empresa}
                                            </Typography>
                                            <Chip
                                                label={situacaoConfig.label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: situacaoConfig.color,
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </Box>

                                        <Box display="flex" alignItems="center" mb={1}>
                                            <i className="bi bi-building" style={{ marginRight: 8, color: '#666', fontSize: 16 }}></i>
                                            <Typography variant="body2" color="text.secondary">
                                                {venda.local}
                                            </Typography>
                                        </Box>

                                        <Box display="flex" alignItems="center" mb={1}>
                                            <i className="bi bi-calendar" style={{ marginRight: 8, color: '#666', fontSize: 16 }}></i>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatarData(venda.data)} às {formatarHorario(venda.horario)}
                                            </Typography>
                                        </Box>

                                        <Box display="flex" alignItems="center" mb={2}>
                                            <i className="bi bi-person-lines-fill" style={{ marginRight: 8, color: '#666', fontSize: 16 }}></i>
                                            <Typography variant="body2" color="text.secondary">
                                                {venda.contatos && venda.contatos.length > 0 
                                                    ? `${venda.contatos[0].nome} (${venda.contatos[0].cargo}) - ${venda.contatos[0].telefone}`
                                                    : 'Sem contatos'
                                                }
                                                {venda.contatos && venda.contatos.length > 1 && 
                                                    <span style={{ color: '#1976d2', marginLeft: 4 }}>
                                                        +{venda.contatos.length - 1} contato(s)
                                                    </span>
                                                }
                                            </Typography>
                                        </Box>

                                        <Box display="flex" alignItems="center" mb={2}>
                                            <i className="bi bi-people-fill" style={{ marginRight: 8, color: '#666', fontSize: 16 }}></i>
                                            <Typography variant="body2" color="text.secondary">
                                                {venda.numero_funcionarios} funcionários
                                            </Typography>
                                        </Box>

                                        <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
                                            {venda.descricao}
                                        </Typography>

                                        {venda.observacoes && (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                Obs: {venda.observacoes}
                                            </Typography>
                                        )}
                                    </CardContent>

                                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                                        <Button
                                            size="small"
                                            onClick={() => handleEdit(venda)}
                                            variant="outlined"
                                            color="primary"
                                            sx={{ fontSize: '12px' }}
                                        >
                                            ✏️ Editar
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => handleDelete(venda.id!)}
                                            variant="outlined"
                                            color="error"
                                            sx={{ fontSize: '12px' }}
                                        >
                                            🗑️ Excluir
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

                {vendasFiltradas.length === 0 && (
                    <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="text.secondary">
                            Nenhuma proposta encontrada
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Dialog para Criar/Editar Venda */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {editingVenda ? 'Editar Proposta' : 'Nova Proposta'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Empresa"
                                    required
                                    value={formData.empresa}
                                    onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box display="flex" gap={1}>
                                    <TextField
                                        fullWidth
                                        label="Local"
                                        required
                                        value={formData.local}
                                        onChange={(e) => setFormData({...formData, local: e.target.value})}
                                        placeholder="Digite o endereço ou use a localização atual"
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={obterLocalizacaoAtual}
                                        disabled={loadingLocation}
                                        sx={{ 
                                            minWidth: 'auto', 
                                            px: 2,
                                            backgroundColor: loadingLocation ? '#f5f5f5' : '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: '16px',
                                            '&:hover': {
                                                backgroundColor: loadingLocation ? '#f5f5f5' : '#45a049',
                                                border: 'none'
                                            },
                                            '&:disabled': {
                                                backgroundColor: '#f5f5f5',
                                                color: '#999'
                                            }
                                        }}
                                        title="Obter localização atual"
                                    >
                                        {loadingLocation ? <i className="bi bi-clock"></i> : <i className="bi bi-geo-alt-fill"></i>}
                                    </Button>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="Data"
                                    type="date"
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.data}
                                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="Horário"
                                    type="time"
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.horario}
                                    onChange={(e) => setFormData({...formData, horario: e.target.value})}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Número de Funcionários"
                                    type="number"
                                    required
                                    value={formData.numero_funcionarios}
                                    onChange={(e) => setFormData({...formData, numero_funcionarios: parseInt(e.target.value) || 0})}
                                />
                            </Grid>

                            {/* Seção de Contatos */}
                            <Grid item xs={12}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6">Contatos</Typography>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={adicionarContato}
                                        sx={{ backgroundColor: "#4CAF50", color: "white" }}
                                    >
                                        + Adicionar Contato
                                    </Button>
                                </Box>
                            </Grid>

                            {formData.contatos.map((contato, index) => (
                                <Grid item xs={12} key={index}>
                                    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="subtitle1">
                                                Contato {index + 1}
                                            </Typography>
                                            {formData.contatos.length > 1 && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => removerContato(index)}
                                                >
                                                    🗑️ Remover
                                                </Button>
                                            )}
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Nome do Contato"
                                                    required
                                                    value={contato.nome}
                                                    onChange={(e) => atualizarContato(index, 'nome', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Cargo"
                                                    required
                                                    value={contato.cargo}
                                                    onChange={(e) => atualizarContato(index, 'cargo', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Telefone"
                                                    required
                                                    value={contato.telefone}
                                                    onChange={(e) => atualizarContato(index, 'telefone', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Email"
                                                    type="email"
                                                    value={contato.email}
                                                    onChange={(e) => atualizarContato(index, 'email', e.target.value)}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            ))}
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Situação</InputLabel>
                                    <Select
                                        value={formData.situacao}
                                        label="Situação"
                                        onChange={(e) => setFormData({...formData, situacao: e.target.value})}
                                    >
                                        {situacoesDisponiveis.map((situacao) => (
                                            <MenuItem key={situacao.value} value={situacao.value}>
                                                {situacao.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Descrição"
                                    multiline
                                    rows={3}
                                    required
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Observações"
                                    multiline
                                    rows={2}
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Snackbar para feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.type}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
