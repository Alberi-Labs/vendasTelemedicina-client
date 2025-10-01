import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { apolicesApi, carteirinhaApi, contratoApi } from '@/lib/api-client';

interface Props {
  open: boolean;
  onClose: () => void;
  clienteNome?: string;
  clienteCpf?: string;
  vigencia?: string | null; // formato: 'DD/MM/YYYY - DD/MM/YYYY'
  apolice?: string | null;
  operacao?: string | null;
  certificado?: string | null;
  contratoAssinado?: boolean;
  nomeInstituicao?: string | null;
}

/**
 * Modal para gerar/baixar Carteirinha, Apólice e Contrato (se assinado)
 * Reutiliza a lógica da página de Apólice para formatação e geração.
 */
export const GenerateCarteirinhaModal: React.FC<Props> = ({
  open,
  onClose,
  clienteNome,
  clienteCpf,
  vigencia,
  apolice,
  operacao,
  certificado,
  contratoAssinado,
  nomeInstituicao,
}) => {
  const [loading, setLoading] = useState<string | null>(null); // qual ação está carregando
  const [alert, setAlert] = useState<{ type: 'success'|'warning'|'error'; msg: string } | null>(null);

  const safeNome = clienteNome || 'Cliente';
  const safeCpf = (clienteCpf || '').replace(/\D/g,'');

  // Normalização de dados recebidos ou fallback
  let vigenciaInicio = '';
  let vigenciaFinal = '';
  if (vigencia && vigencia.includes('-')) {
    const partes = vigencia.split('-').map(p => p.trim());
    if (partes.length === 2) {
      vigenciaInicio = partes[0];
      vigenciaFinal = partes[1];
    }
  }
  const dadosContrato = {
    vigenciaInicio,
    vigenciaFinal,
    apolice: apolice || '—',
    operacao: operacao || '—',
    certificado: certificado || '—',
    nomeInstituicao: nomeInstituicao || 'Saúde e Cor'
  };

  const isVita = (nomeInstituicao || safeNome).toLowerCase().includes('vita');

  const closeAlert = () => setAlert(null);

  const handleBaixarApolice = async () => {
    if (!safeCpf || !safeNome) {
      setAlert({ type: 'error', msg: 'Dados insuficientes do cliente.' });
      return;
    }
    setLoading('apolice'); closeAlert();
    try {
      const dadosApolice = {
        nomeseg: safeNome,
        cpf: safeCpf,
        datanascimento: '', // desconhecida neste contexto
        matricula: '',
        numoperacao: dadosContrato.operacao !== '—' ? dadosContrato.operacao : '',
        numcertificado: dadosContrato.certificado !== '—' ? dadosContrato.certificado : '',
        numsorteio: '0',
        numapolice: dadosContrato.apolice !== '—' ? dadosContrato.apolice : '',
        dataemissao: new Date().toLocaleDateString('pt-BR'),
        valorplano: isVita ? '39,90' : '49,90',
      };
      const resp = await apolicesApi.gerar(dadosApolice);
      if (!resp.ok) throw new Error('Erro ao gerar apólice');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setAlert({ type: 'success', msg: 'Apólice gerada com sucesso!' });
    } catch (e:any) {
      setAlert({ type: 'error', msg: e.message || 'Falha ao gerar apólice.' });
    } finally { setLoading(null); }
  };

  const handleBaixarCarteirinha = async () => {
    if (!safeCpf || !safeNome) {
      setAlert({ type: 'error', msg: 'Dados insuficientes do cliente.' });
      return;
    }
    setLoading('carteirinha'); closeAlert();
    try {
      const primeiroNome = safeNome.split(' ')[0];
      const dados = {
        nome: safeNome,
        cpf: safeCpf,
        vigenciaInicio: dadosContrato.vigenciaInicio,
        vigenciaFinal: dadosContrato.vigenciaFinal,
        apolice: dadosContrato.apolice,
        operacao: dadosContrato.operacao,
        certificado: dadosContrato.certificado,
        empresa: dadosContrato.nomeInstituicao
      };
      const resp = await carteirinhaApi.gerar(dados);
      if (!resp.ok) throw new Error('Erro ao gerar carteirinha');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const nomeArquivo = `carteirinha-${primeiroNome}-${safeCpf}.png`;
      const link = document.createElement('a');
      link.href = url; link.download = nomeArquivo; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      setAlert({ type: 'success', msg: 'Carteirinha baixada!' });
    } catch (e:any) {
      setAlert({ type: 'error', msg: e.message || 'Falha ao gerar carteirinha.' });
    } finally { setLoading(null); }
  };

  const handleBaixarContratoAssinado = async () => {
    if (!safeCpf) { setAlert({ type:'error', msg: 'CPF ausente.' }); return; }
    setLoading('contrato'); closeAlert();
    try {
      const resp = await contratoApi.baixarContratoAssinado(safeCpf);
      if (!resp.ok) throw new Error('Contrato não assinado ou erro ao baixar.');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `contrato_assinado_${safeCpf}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      setAlert({ type: 'success', msg: 'Contrato assinado baixado!' });
    } catch (e:any) {
      setAlert({ type: 'error', msg: e.message || 'Falha ao baixar contrato.' });
    } finally { setLoading(null); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Downloads do Cliente</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">Selecione o que deseja gerar/baixar para <strong>{safeNome}</strong>.</Typography>
          {alert && <Alert severity={alert.type} onClose={closeAlert}>{alert.msg}</Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} divider={<Divider flexItem orientation="vertical" />}> 
            <Button
              variant="contained"
              disabled={loading==='contrato' || !contratoAssinado}
              onClick={handleBaixarContratoAssinado}
            >
              {loading==='contrato' ? <CircularProgress size={20} /> : (contratoAssinado ? 'Contrato Assinado' : 'Contrato não assinado')}
            </Button>
            <Button variant="outlined" disabled={loading==='carteirinha'} onClick={handleBaixarCarteirinha}>
              {loading==='carteirinha' ? <CircularProgress size={20} /> : 'Carteirinha'}
            </Button>
            <Button variant="outlined" disabled={loading==='apolice'} onClick={handleBaixarApolice}>
              {loading==='apolice' ? <CircularProgress size={20} /> : 'Apólice'}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerateCarteirinhaModal;
