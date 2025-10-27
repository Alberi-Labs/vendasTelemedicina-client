import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';

interface NotaFiscalDetalhes {
  numero: string;
  serie: string;
  chave: string;
  dataEmissao: string;
  dataAutorizacao?: string;
  valor: number;
  status: string;
  empresaEmitente: {
    nome: string;
    cnpj: string;
    inscricaoEstadual: string;
    endereco: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  empresaDestinatario: {
    nome: string;
    cnpj: string;
    endereco?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  servicos: Array<{
    numero: number;
    codigo: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valorUnitario: number;
    valorTotal: number;
    aliquotaISS: number;
  }>;
  impostos: {
    baseCalculoISS: number;
    valorISS: number;
    baseCalculoPIS: number;
    valorPIS: number;
    baseCalculoCOFINS: number;
    valorCOFINS: number;
    valorTotalTributos: number;
  };
  observacoes?: string;
  xmlUrl?: string;
  pdfUrl?: string;
}

interface VisualizarNotaFiscalProps {
  open: boolean;
  onClose: () => void;
  numeroNota: string;
  serieNota: string;
}

const VisualizarNotaFiscal: React.FC<VisualizarNotaFiscalProps> = ({
  open,
  onClose,
  numeroNota,
  serieNota
}) => {
  const [notaFiscal, setNotaFiscal] = useState<NotaFiscalDetalhes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && numeroNota && serieNota) {
      carregarNotaFiscal();
    }
  }, [open, numeroNota, serieNota]);

  const carregarNotaFiscal = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notasFiscais/visualizar?numero=${numeroNota}&serie=${serieNota}`);
      
      if (response.ok) {
        const data = await response.json();
        setNotaFiscal(data.notaFiscal);
      } else {
        throw new Error('Erro ao carregar nota fiscal');
      }
    } catch (err) {
      console.error('Erro ao carregar nota fiscal:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const getStatusChip = (status: string) => {
    const statusMap = {
      'autorizada': { color: 'success' as const, label: 'Autorizada' },
      'cancelada': { color: 'error' as const, label: 'Cancelada' },
      'pendente': { color: 'warning' as const, label: 'Pendente' },
      'rejeitada': { color: 'error' as const, label: 'Rejeitada' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'default' as const, label: status };
    
    return <Chip color={statusInfo.color} label={statusInfo.label} size="small" />;
  };

  const handleDownload = (tipo: 'pdf' | 'xml') => {
    if (!notaFiscal) return;
    
    const url = tipo === 'pdf' ? notaFiscal.pdfUrl : notaFiscal.xmlUrl;
    if (url) {
      window.open(url, '_blank');
    } else {
      alert(`${tipo.toUpperCase()} não disponível para download`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Carregando nota fiscal...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Erro</DialogTitle>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!notaFiscal) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            📄 Nota Fiscal {notaFiscal.serie}-{notaFiscal.numero}
          </Typography>
          <Box>
            {notaFiscal.pdfUrl && (
              <IconButton onClick={() => handleDownload('pdf')} title="Download PDF">
                📄
              </IconButton>
            )}
            {notaFiscal.xmlUrl && (
              <IconButton onClick={() => handleDownload('xml')} title="Download XML">
                📁
              </IconButton>
            )}
            <IconButton onClick={handlePrint} title="Imprimir">
              🖨️
            </IconButton>
            <IconButton onClick={onClose}>
              ✕
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Cabeçalho da Nota */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                📊 Dados da Nota Fiscal
              </Typography>
              <Typography><strong>Número:</strong> {notaFiscal.serie}-{notaFiscal.numero}</Typography>
              <Typography><strong>Chave:</strong> {notaFiscal.chave}</Typography>
              <Typography><strong>Data de Emissão:</strong> {formatarData(notaFiscal.dataEmissao)}</Typography>
              {notaFiscal.dataAutorizacao && (
                <Typography><strong>Data de Autorização:</strong> {formatarDataHora(notaFiscal.dataAutorizacao)}</Typography>
              )}
              <Typography><strong>Status:</strong> {getStatusChip(notaFiscal.status)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                💰 Valores
              </Typography>
              <Typography><strong>Valor Total:</strong> {formatarMoeda(notaFiscal.valor)}</Typography>
              <Typography><strong>Total de Tributos:</strong> {formatarMoeda(notaFiscal.impostos.valorTotalTributos)}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Empresas */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                🏢 Emitente
              </Typography>
              <Typography><strong>{notaFiscal.empresaEmitente.nome}</strong></Typography>
              <Typography>CNPJ: {notaFiscal.empresaEmitente.cnpj}</Typography>
              <Typography>IE: {notaFiscal.empresaEmitente.inscricaoEstadual}</Typography>
              <Typography>{notaFiscal.empresaEmitente.endereco}</Typography>
              <Typography>{notaFiscal.empresaEmitente.cidade} - {notaFiscal.empresaEmitente.uf}</Typography>
              <Typography>CEP: {notaFiscal.empresaEmitente.cep}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                🏭 Destinatário
              </Typography>
              <Typography><strong>{notaFiscal.empresaDestinatario.nome}</strong></Typography>
              <Typography>CNPJ: {notaFiscal.empresaDestinatario.cnpj}</Typography>
              {notaFiscal.empresaDestinatario.endereco && (
                <>
                  <Typography>{notaFiscal.empresaDestinatario.endereco}</Typography>
                  <Typography>{notaFiscal.empresaDestinatario.cidade} - {notaFiscal.empresaDestinatario.uf}</Typography>
                  <Typography>CEP: {notaFiscal.empresaDestinatario.cep}</Typography>
                </>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Serviços */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            📋 Serviços Prestados
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Item</strong></TableCell>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Descrição</strong></TableCell>
                  <TableCell><strong>Qtd</strong></TableCell>
                  <TableCell><strong>Unid</strong></TableCell>
                  <TableCell><strong>Valor Unit.</strong></TableCell>
                  <TableCell><strong>Valor Total</strong></TableCell>
                  <TableCell><strong>Alíq. ISS</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notaFiscal.servicos.map((servico) => (
                  <TableRow key={servico.numero}>
                    <TableCell>{servico.numero}</TableCell>
                    <TableCell>{servico.codigo}</TableCell>
                    <TableCell>{servico.descricao}</TableCell>
                    <TableCell>{servico.quantidade}</TableCell>
                    <TableCell>{servico.unidade}</TableCell>
                    <TableCell>{formatarMoeda(servico.valorUnitario)}</TableCell>
                    <TableCell>{formatarMoeda(servico.valorTotal)}</TableCell>
                    <TableCell>{servico.aliquotaISS}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Impostos */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            💸 Resumo de Impostos
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2"><strong>PIS:</strong></Typography>
              <Typography>{formatarMoeda(notaFiscal.impostos.valorPIS)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2"><strong>COFINS:</strong></Typography>
              <Typography>{formatarMoeda(notaFiscal.impostos.valorCOFINS)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2"><strong>ISS:</strong></Typography>
              <Typography>{formatarMoeda(notaFiscal.impostos.valorISS)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2"><strong>Total Tributos:</strong></Typography>
              <Typography color="error.main" fontWeight="bold">
                {formatarMoeda(notaFiscal.impostos.valorTotalTributos)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Observações */}
        {notaFiscal.observacoes && (
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              📝 Observações
            </Typography>
            <Typography>{notaFiscal.observacoes}</Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
        {notaFiscal.pdfUrl && (
          <Button 
            onClick={() => handleDownload('pdf')} 
            variant="contained"
          >
            📄 Download PDF
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VisualizarNotaFiscal;
