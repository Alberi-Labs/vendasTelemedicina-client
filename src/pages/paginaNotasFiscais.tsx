import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card,
  CardContent,
  Table, 
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Container,
  Typography,
  Box,
  Snackbar
} from '@mui/material';
import Layout from '../components/layout/layout';
import useAuth from '../hook/useAuth';
import VisualizarNotaFiscal from '../components/notasFiscais/VisualizarNotaFiscal';

interface Assinatura {
  id: string;
  empresaNome: string;
  cnpj: string;
  valor: number;
  status: string;
  dataInicio: string;
  proximoVencimento: string;
  notaFiscalEmitida: boolean;
  notaFiscalNumero?: string;
  assinaturaId: string;
}

interface NotaFiscal {
  numero: string;
  serie: string;
  dataEmissao: string;
  valor: number;
  status: 'pendente' | 'emitida' | 'cancelada';
}

const PaginaNotasFiscais: React.FC = () => {
  const { authenticated } = useAuth();
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEmitir, setModalEmitir] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState(false);
  const [assinaturaSelecionada, setAssinaturaSelecionada] = useState<Assinatura | null>(null);
  const [notaSelecionada, setNotaSelecionada] = useState<{ numero: string; serie: string } | null>(null);
  const [dadosNota, setDadosNota] = useState({
    serie: '001',
    descricao: '',
    observacoes: '',
    periodoCronologia: 'ON_PAYMENT_CONFIRMATION' // Emitir quando pago
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  // HOOKS DE NOTAS FISCAIS LISTAGEM
  const [modalListaNotas, setModalListaNotas] = useState(false);
  const [notasFiscais, setNotasFiscais] = useState<any[]>([]);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [assinaturaIdNotas, setAssinaturaIdNotas] = useState<string | null>(null);

  useEffect(() => {
    carregarAssinaturas();
  }, []);

  const carregarAssinaturas = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/notasFiscais/consultarAssinaturas');
      if (response.ok) {
        const data = await response.json();
        setAssinaturas(data.assinaturas || []);
        console.log(`📋 Carregadas ${data.total} assinaturas`);
      } else {
        throw new Error('Erro ao carregar assinaturas da API');
      }
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
      
      // Fallback para dados simulados em caso de erro
      const assinaturasSimuladas: Assinatura[] = [
        {
          id: '1',
          empresaNome: 'Tech Solutions LTDA',
          cnpj: '12.345.678/0001-90',
          valor: 299.90,
          status: 'ativa',
          dataInicio: '2024-01-15',
          proximoVencimento: '2024-08-15',
          notaFiscalEmitida: false,
          assinaturaId: 'sub_123456789'
        },
        {
          id: '2',
          empresaNome: 'Inovação Corp',
          cnpj: '98.765.432/0001-10',
          valor: 499.90,
          status: 'ativa',
          dataInicio: '2024-02-01',
          proximoVencimento: '2024-09-01',
          notaFiscalEmitida: true,
          notaFiscalNumero: 'NF-001234',
          assinaturaId: 'sub_987654321'
        }
      ];

      setAssinaturas(assinaturasSimuladas);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar assinaturas da API, usando dados de exemplo',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEmitir = (assinatura: Assinatura) => {
    setAssinaturaSelecionada(assinatura);
    setDadosNota({
      serie: '001',
      descricao: `Assinatura Plano Saúde e Cor PJ - ${assinatura.empresaNome}`,
      observacoes: 'Assinatura de plano de saúde empresarial com vigência de 12 meses',
      periodoCronologia: 'ON_PAYMENT_CONFIRMATION'
    });
    setModalEmitir(true);
  };

  // Abre modal de listagem de notas fiscais emitidas para a assinatura
  const abrirModalVisualizar = async (assinatura: Assinatura) => {
    setAssinaturaIdNotas(assinatura.assinaturaId);
    setModalListaNotas(true);
    setLoadingNotas(true);
    try {
      const resp = await fetch(`/api/notasFiscais/consultarAsaas?assinaturaId=${assinatura.assinaturaId}`);
      const data = await resp.json();
      console.log(data)
      setNotasFiscais(data.notasFiscais || data.data || []);
    } catch (e) {
      setNotasFiscais([]);
    } finally {
      setLoadingNotas(false);
    }
  };

  const emitirNotaFiscal = async () => {
    if (!assinaturaSelecionada) return;

    try {
      setLoading(true);
        console.log(assinaturaSelecionada)
      const dadosEmissao = {
        assinaturaId: assinaturaSelecionada.assinaturaId,
        empresaNome: assinaturaSelecionada.empresaNome,
        cnpj: assinaturaSelecionada.cnpj,
        valor: assinaturaSelecionada.valor,
        serie: dadosNota.serie,
        descricao: dadosNota.descricao,
        observacoes: dadosNota.observacoes
      };

      const response = await fetch('/api/notasFiscais/emitirNota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosEmissao)
      });

      const resultado = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: `Configuração de nota fiscal criada com sucesso! ${resultado.message}`,
          severity: 'success'
        });
        
        // Atualizar a lista de assinaturas
        setAssinaturas(prev => prev.map(ass => 
          ass.id === assinaturaSelecionada.id 
            ? { ...ass, notaFiscalEmitida: true, notaFiscalNumero: resultado.numeroNota }
            : ass
        ));
        
        setModalEmitir(false);
      } else {
        throw new Error(resultado.message || 'Erro ao configurar nota fiscal');
      }
    } catch (error) {
      console.error('Erro ao emitir nota fiscal:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Erro ao emitir nota fiscal',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusMap = {
      'ativa': { color: 'success' as const, label: 'Ativa' },
      'pendente': { color: 'warning' as const, label: 'Pendente' },
      'cancelada': { color: 'error' as const, label: 'Cancelada' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'default' as const, label: status };
    
    return <Chip color={statusInfo.color} label={statusInfo.label} size="small" />;
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (loading && assinaturas.length === 0) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Carregando...</Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" gutterBottom>
            Notas Fiscais
            </Typography>
            <Typography color="text.secondary">
              Gerencie as notas fiscais das suas assinaturas
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            onClick={carregarAssinaturas} 
            disabled={loading}
          >
            {loading ? 'Carregando...' : '🔄 Atualizar'}
          </Button>
        </Box>

        {/* Tabela de Assinaturas */}
        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Empresa</strong></TableCell>
                    <TableCell><strong>CNPJ</strong></TableCell>
                    <TableCell><strong>Valor</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Início</strong></TableCell>
                    <TableCell><strong>Próx. Vencimento</strong></TableCell>
                    <TableCell><strong>Nota Fiscal</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assinaturas.map((assinatura) => (
                    <TableRow key={assinatura.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {assinatura.empresaNome}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {assinatura.cnpj}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          {formatarMoeda(assinatura.valor)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(assinatura.status)}
                      </TableCell>
                      <TableCell>{formatarData(assinatura.dataInicio)}</TableCell>
                      <TableCell>{formatarData(assinatura.proximoVencimento)}</TableCell>
                      <TableCell>
                        {assinatura.notaFiscalEmitida ? (
                          <Box>
                            <Chip color="info" label="⚙️ Configurada" size="small" />
                            {assinatura.notaFiscalNumero && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Config: {assinatura.notaFiscalNumero}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Chip color="warning" label="⏳ Não Configurada" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {!assinatura.notaFiscalEmitida ? (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => abrirModalEmitir(assinatura)}
                            disabled={loading}
                          >
                            ⚙️ Configurar Auto-Emissão
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => abrirModalVisualizar(assinatura)}
                          >
                            📄 Ver Notas Emitidas
                          </Button>
                        )}
        {/* Modal de listagem de notas fiscais emitidas */}
        <Dialog open={modalListaNotas} onClose={() => setModalListaNotas(false)} maxWidth="md" fullWidth>
          <DialogTitle>Notas Fiscais Emitidas</DialogTitle>
          <DialogContent>
            {loadingNotas ? (
              <Typography>Carregando notas fiscais...</Typography>
            ) : notasFiscais.length === 0 ? (
              <Typography>Nenhuma nota fiscal emitida para esta assinatura.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Data Emissão</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notasFiscais.map((nota) => (
                    <TableRow key={nota.id}>
                      <TableCell>{nota.id || nota.numero}</TableCell>
                      <TableCell>{nota.status}</TableCell>
                      <TableCell>{nota.valor ? nota.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}</TableCell>
                      <TableCell>{nota.dataEmissao ? new Date(nota.dataEmissao).toLocaleDateString('pt-BR') : ''}</TableCell>
                      <TableCell>
                        {nota.pdfUrl || nota.pdf ? (
                          <Button size="small" href={nota.pdfUrl || nota.pdf} target="_blank">Abrir PDF</Button>
                        ) : (
                          <Typography variant="caption">Sem PDF</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalListaNotas(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {assinaturas.length === 0 && (
              <Box textAlign="center" py={5}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  📋 Nenhuma assinatura encontrada
                </Typography>
                <Typography color="text.secondary">
                  Quando você tiver assinaturas ativas, elas aparecerão aqui.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Configuração de Nota Fiscal */}
        <Dialog open={modalEmitir} onClose={() => setModalEmitir(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            ⚙️ Configurar Emissão Automática de Notas Fiscais
          </DialogTitle>
          <DialogContent>
            {assinaturaSelecionada && (
              <>
                {/* Informações da Assinatura */}
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    📊 Dados da Assinatura
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography><strong>Empresa:</strong> {assinaturaSelecionada.empresaNome}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>CNPJ:</strong> {assinaturaSelecionada.cnpj}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Valor:</strong> {formatarMoeda(assinaturaSelecionada.valor)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Status:</strong> {getStatusChip(assinaturaSelecionada.status)}</Typography>
                    </Grid>
                  </Grid>
                </Alert>

                {/* Formulário da Nota Fiscal */}
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Série da Nota"
                      value={dadosNota.serie}
                      onChange={(e) => setDadosNota({...dadosNota, serie: e.target.value})}
                      placeholder="001"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Valor"
                      value={formatarMoeda(assinaturaSelecionada.valor)}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Descrição do Serviço"
                      value={dadosNota.descricao}
                      onChange={(e) => setDadosNota({...dadosNota, descricao: e.target.value})}
                      placeholder="Descrição detalhada do serviço..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Observações"
                      value={dadosNota.observacoes}
                      onChange={(e) => setDadosNota({...dadosNota, observacoes: e.target.value})}
                      placeholder="Observações adicionais..."
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalEmitir(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              onClick={emitirNotaFiscal} 
              disabled={loading}
              variant="contained"
            >
              {loading ? 'Configurando...' : '⚙️ Configurar Emissão Automática'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal para visualizar nota fiscal */}
        {modalVisualizar && notaSelecionada && (
          <VisualizarNotaFiscal
            open={modalVisualizar}
            onClose={() => {
              setModalVisualizar(false);
              setNotaSelecionada(null);
            }}
            serieNota={notaSelecionada.serie}
            numeroNota={notaSelecionada.numero}
          />
        )}

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          <Alert 
            onClose={() => setSnackbar({...snackbar, open: false})} 
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
};

export default PaginaNotasFiscais;
