import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
// Removendo ícones para evitar problemas de dependência
import { asaasApiClient } from '@/lib/api-client';

interface Cliente {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  mobilePhone: string;
  city: string;
  state: string;
}

interface Cobranca {
  id: string;
  value: number;
  dueDate: string;
  status: string;
  description: string;
  billingType: string;
  paymentDate?: string;
}

const statusColors = {
  'PENDING': 'warning',
  'RECEIVED': 'success',
  'OVERDUE': 'error',
  'REFUNDED': 'info'
} as const;

const statusLabels = {
  'PENDING': 'Pendente',
  'RECEIVED': 'Pago',
  'OVERDUE': 'Vencido',
  'REFUNDED': 'Estornado'
} as const;

const billingTypeLabels = {
  'BOLETO': 'Boleto',
  'CREDIT_CARD': 'Cartão de Crédito',
  'DEBIT_CARD': 'Cartão de Débito',
  'PIX': 'PIX',
  'TRANSFER': 'Transferência',
  'DEPOSIT': 'Depósito'
} as const;

export default function ConsultaAsaas() {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalCobrancas, setTotalCobrancas] = useState(0);

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCpfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCpf = formatCpf(event.target.value);
    if (formattedCpf.length <= 14) {
      setCpf(formattedCpf);
    }
  };

  const buscarCliente = useCallback(async () => {
    if (!cpf) {
      setError('Digite um CPF válido');
      return;
    }

    setLoading(true);
    setError(null);
    setCliente(null);
    setCobrancas([]);
    setTotalCobrancas(0);

    try {
      const cpfNumbers = cpf.replace(/\D/g, '');
      
      // Buscar cliente
      const clienteResponse = await asaasApiClient.buscarCliente({ 
        cpf: cpfNumbers 
      });
      
      if (clienteResponse.success && clienteResponse.data.length > 0) {
        const clienteEncontrado = clienteResponse.data[0];
        setCliente(clienteEncontrado);
        
        // Buscar cobranças do cliente
        const cobrancasResponse = await asaasApiClient.buscarCobrancasCliente(
          clienteEncontrado.id
        );
        
        if (cobrancasResponse.success) {
          setCobrancas(cobrancasResponse.data);
          setTotalCobrancas(cobrancasResponse.totalCount);
        }
      } else {
        setError('Cliente não encontrado');
      }
    } catch (err) {
      console.error('Erro ao consultar:', err);
      setError('Erro ao consultar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [cpf]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calcularResumoCobrancas = () => {
    const resumo = cobrancas.reduce((acc, cobranca) => {
      const status = cobranca.status;
      if (!acc[status]) {
        acc[status] = { count: 0, value: 0 };
      }
      acc[status].count += 1;
      acc[status].value += cobranca.value;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    return resumo;
  };

  const resumoCobrancas = calcularResumoCobrancas();

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Consulta Asaas
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="CPF do Cliente"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={buscarCliente}
              disabled={loading || !cpf}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {cliente && (
        <>
          {/* Informações do Cliente */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Dados do Cliente
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Nome:</strong> {cliente.name}</Typography>
                <Typography variant="body1"><strong>Email:</strong> {cliente.email}</Typography>
                <Typography variant="body1"><strong>CPF:</strong> {cliente.cpfCnpj}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1"><strong>Telefone:</strong> {cliente.phone}</Typography>
                <Typography variant="body1"><strong>Celular:</strong> {cliente.mobilePhone}</Typography>
                <Typography variant="body1"><strong>Cidade:</strong> {cliente.city}/{cliente.state}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Resumo das Cobranças */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Resumo das Cobranças ({totalCobrancas} total)
            </Typography>
            
            <Grid container spacing={2}>
              {Object.entries(resumoCobrancas).map(([status, dados]) => (
                <Grid item xs={12} sm={6} md={3} key={status}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">
                        <Chip 
                          label={statusLabels[status as keyof typeof statusLabels] || status}
                          color={statusColors[status as keyof typeof statusColors] || 'default'}
                          size="small"
                        />
                      </Typography>
                      <Typography variant="h4">{dados.count}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(dados.value)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Lista de Cobranças */}
          {cobrancas.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Accordion defaultExpanded>
                <AccordionSummary>
                  <Typography variant="h6">
                    Detalhes das Cobranças ({cobrancas.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Data Vencimento</TableCell>
                          <TableCell>Valor</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Descrição</TableCell>
                          <TableCell>Data Pagamento</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cobrancas.map((cobranca) => (
                          <TableRow key={cobranca.id}>
                            <TableCell>{formatDate(cobranca.dueDate)}</TableCell>
                            <TableCell>{formatCurrency(cobranca.value)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={statusLabels[cobranca.status as keyof typeof statusLabels] || cobranca.status}
                                color={statusColors[cobranca.status as keyof typeof statusColors] || 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {billingTypeLabels[cobranca.billingType as keyof typeof billingTypeLabels] || cobranca.billingType}
                            </TableCell>
                            <TableCell>
                              {cobranca.description || '-'}
                            </TableCell>
                            <TableCell>
                              {cobranca.paymentDate ? formatDate(cobranca.paymentDate) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}