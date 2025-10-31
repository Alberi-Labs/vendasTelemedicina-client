import React, { useEffect, useState, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import { asaasApiClient } from '../../lib/api-client';
import { displayValue, displayCurrency, displayDate } from '../../lib/display';

interface Charge {
  id?: string;
  valor?: number;
  descricao?: string;
  status?: string;
  dueDate?: string;
  paymentDate?: string;
  billingType?: string;
  situacaoCalc?: 'Pago' | 'Pendente' | 'Atrasado';
  invoiceUrl?: string | null;
  originalObject?: OriginalObjectProps;
}

interface OriginalObjectProps{
  clientPaymentDate?: string;
}
interface ChargesModalProps {
  open: boolean;
  onClose: () => void;
  cpf?: string;
  email?: string;
}

export const ChargesModal: React.FC<ChargesModalProps> = ({ open, onClose, cpf, email }) => {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    value: '',
    description: '',
    billingType: 'PIX',
    firstDueDate: '',
    months: 1,
    intervalMonths: 1,
  });
  const [showGenerate, setShowGenerate] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected]);
  const [deletingBatch, setDeletingBatch] = useState(false);

  useEffect(() => {
    if (!open || (!cpf && !email)) return;
    let ativo = true;
    const carregar = async () => {
      setLoading(true); setErro(null);
      try {
        let todas: any[] = [];
        if (cpf) {
          const resp = await asaasApiClient.buscarTodasCobrancasPorCpf(cpf);
          console.log(`Cobrancas encontradas para ${cpf}:`, resp);
          if (resp?.data?.length) todas = resp.data;
        } else if (email) {
          const cli = await asaasApiClient.buscarCliente({ email });
            if (cli?.data?.length) {
              for (const c of cli.data) {
                try {
                  const cob = await asaasApiClient.buscarCobrancas({ customer: c.id, limit: 100 });
                  if (cob?.data?.length) todas.push(...cob.data);
                } catch (e) { /* ignora individual */ }
              }
            }
        }

        // Normalizar para Charge interface
        console.log(`Total de cobranças encontradas:`, todas);
        const normalizado: Charge[] = todas.map((c): Charge => ({
          id: c.id,
          valor: c.valor !== undefined ? Number(c.valor) : c.value !== undefined ? Number(c.value) : undefined,
          descricao: c.description,
          status: c.status,
          dueDate: c.dueDate,
          paymentDate: c.paymentDate || c.clientPaymentDate,
          billingType: c.billingType,
          invoiceUrl: c.invoiceUrl || c.bankSlipUrl || null,
          originalObject: { clientPaymentDate: c.originalObject.clientPaymentDate },
        }));
        console.log('Cobranças normalizadas:', normalizado);
        if (ativo) setCharges(normalizado);
      } catch (e: any) {
        if (ativo) setErro(e.message || 'Erro ao carregar cobranças');
      } finally { if (ativo) setLoading(false); }
    };
    carregar();
    return () => { ativo = false; };
  }, [open, cpf, email, refreshKey]);

  const filtered = useMemo(() => {
    return charges.filter(c => {
      if (statusFiltro && c.status !== statusFiltro) return false;
      if (busca) {
        const target = `${c.descricao || ''} ${c.billingType || ''}`.toLowerCase();
        if (!target.includes(busca.toLowerCase())) return false;
      }
      return true;
    });
  }, [charges, busca, statusFiltro]);

  const statusColor = (status?: string) => {
    switch (status) {
      case 'RECEIVED': return 'success';
      case 'PENDING': return 'warning';
      case 'OVERDUE': return 'error';
      case 'REFUNDED': return 'info';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  // Derivar situacao similar à página controle de pagamentos
  const derivarSituacao = (c: Charge): 'Pago' | 'Pendente' | 'Atrasado' => {
    if (c.status === 'RECEIVED') return 'Pago';
    const hoje = new Date(); hoje.setHours(23,59,59,999);
    if (c.dueDate && new Date(c.dueDate) < hoje) return 'Atrasado';
    return 'Pendente';
  };

  const reload = () => setRefreshKey(k => k + 1);

  const toggleSelect = (id?: string) => {
    if (!id) return;
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const clearSelection = () => setSelected({});

  const deletarSelecionadas = async () => {
    if (!selectedIds.length) return;
    setDeletingBatch(true);
    try {
      const resp = await asaasApiClient.deletarCobrancasLote(selectedIds);
      if ((resp as any)?.success) {
        clearSelection();
        reload();
      } else {
        alert((resp as any)?.error || 'Falha ao deletar cobranças selecionadas');
      }
    } catch (e: any) {
      alert(e.message || 'Erro ao deletar cobranças');
    } finally { setDeletingBatch(false); }
  };

  const truncate = (text?: string, max = 60) => {
    if (!text) return displayValue(undefined);
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  };

  const copyToClipboard = (value: string) => {
    if (!value) return;
    try { navigator.clipboard?.writeText(value); } catch {}
  };

  const handleChangeForm = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const podeCriar = () => {
    return !!form.value && !!form.firstDueDate && (cpf || email);
  };

  const criarCobrancas = async () => {
    if (!podeCriar()) return;
    setCreating(true); setCreateError(null); setCreateSuccess(null);
    try {
      const payload: any = {
        value: Number(form.value),
        description: form.description || undefined,
        billingType: form.billingType,
        firstDueDate: form.firstDueDate,
        months: form.months > 1 ? form.months : 1,
        intervalMonths: form.intervalMonths > 1 ? form.intervalMonths : 1,
      };
      if (cpf) payload.cpf = cpf; // prioridade CPF
      // (opcional futuramente: resolver customerId por email antes)
      const resp = await asaasApiClient.criarCobrancas(payload);
      if (resp.success) {
        setCreateSuccess(`Criadas ${resp.meta?.criadas || resp.data?.length || 0} / ${resp.meta?.totalSolicitadas || payload.months}`);
        reload();
      } else {
        setCreateError(resp.error || 'Falha ao criar cobranças');
      }
    } catch (e: any) {
      setCreateError(e.message || 'Erro inesperado');
    } finally { setCreating(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Cobranças do Cliente
        <Typography variant="caption" sx={{ ml: 1, opacity: .7 }}>({filtered.length})</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box display="flex" gap={1} mb={2} alignItems="center" flexWrap="wrap">
          <Button variant="contained" size="small" onClick={() => setShowGenerate(true)}>Gerar Cobrança(s)</Button>
          <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={reload}>Atualizar</Button>
          <Box flex={1} />
          <Button size="small" color="error" disabled={!selectedIds.length || deletingBatch} onClick={deletarSelecionadas}>
            Excluir selecionadas ({selectedIds.length})
          </Button>
        </Box>
        {/* filtros */}
        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
          <TextField
            size="small"
            label="Buscar"
            placeholder="Descrição ou tipo"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
            <TextField
              size="small"
              label="Status"
              select
              value={statusFiltro}
              onChange={e => setStatusFiltro(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {['RECEIVED','PENDING','OVERDUE','CANCELLED','REFUNDED'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
        </Box>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" color="inherit" onClick={reload}>Tentar novamente</Button>}>
            {erro}
          </Alert>
        )}
        {loading ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Descrição</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Vencimento</TableCell>
                <TableCell>Pagamento</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton width={140} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={60} /></TableCell>
                  <TableCell><Skeleton width={90} /></TableCell>
                  <TableCell><Skeleton width={90} /></TableCell>
                  <TableCell><Skeleton width={70} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : filtered.length > 0 ? (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox disabled />
                </TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Vencimento</TableCell>
                <TableCell>Pagamento</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell>Link</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c, i) => (
                <TableRow key={c.id || i} hover>
                  <TableCell padding="checkbox">
                    <Checkbox checked={!!selected[c.id || '']} onChange={() => toggleSelect(c.id)} disabled={!c.id || c.status === 'RECEIVED'} />
                  </TableCell>
                  <TableCell title={c.descricao || ''}>{truncate(c.descricao, 60)}</TableCell>
                  <TableCell>{displayValue(c.billingType)}</TableCell>
                  <TableCell>{typeof c.valor === 'number' ? displayCurrency(c.valor) : displayValue(c.valor)}</TableCell>
                  <TableCell>{c.dueDate ? displayDate(c.dueDate) : displayValue(undefined)}</TableCell>
                  <TableCell>{c.originalObject?.clientPaymentDate ? displayDate(c.originalObject?.clientPaymentDate) : displayValue(undefined)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={derivarSituacao(c)}
                      color={derivarSituacao(c)==='Pago' ? 'success' : derivarSituacao(c)==='Atrasado' ? 'error' : 'warning'}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    {c.invoiceUrl ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button size="small" variant="outlined" onClick={() => window.open(c.invoiceUrl as string, '_blank')}>Abrir</Button>
                        <Button size="small" onClick={() => copyToClipboard(c.invoiceUrl as string)}>Copiar</Button>
                      </Stack>
                    ) : displayValue(undefined)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Stack alignItems="center" py={5} spacing={1}>
            <Typography variant="body2" color="text.secondary">Nenhuma cobrança encontrada.</Typography>
            { (busca || statusFiltro) && <Button size="small" onClick={() => { setBusca(''); setStatusFiltro(''); }}>Remover filtros</Button> }
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
      <Dialog open={showGenerate} onClose={() => setShowGenerate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Gerar Cobranças</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField size="small" label="Valor" type="number" value={form.value} onChange={e => handleChangeForm('value', e.target.value)} />
            <TextField size="small" label="Descrição" value={form.description} onChange={e => handleChangeForm('description', e.target.value)} />
            <TextField size="small" label="Tipo" select value={form.billingType} onChange={e => handleChangeForm('billingType', e.target.value)}>
              {['PIX','BOLETO','CREDIT_CARD'].map(bt => <MenuItem key={bt} value={bt}>{bt}</MenuItem>)}
            </TextField>
            <TextField size="small" label="1º Vencimento" type="date" value={form.firstDueDate} onChange={e => handleChangeForm('firstDueDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
              <TextField size="small" label="Meses" type="number" value={form.months} onChange={e => handleChangeForm('months', Number(e.target.value))} />
              <TextField size="small" label="Intervalo (meses)" type="number" value={form.intervalMonths} onChange={e => handleChangeForm('intervalMonths', Number(e.target.value))} />
            </Stack>
            {createError && <Alert severity="error" onClose={() => setCreateError(null)}>{createError}</Alert>}
            {createSuccess && <Alert severity="success" onClose={() => setCreateSuccess(null)}>{createSuccess}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerate(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!podeCriar() || creating} onClick={async () => { await criarCobrancas(); if (!createError) setShowGenerate(false); }}>
            {creating ? <CircularProgress size={20} /> : 'Gerar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
