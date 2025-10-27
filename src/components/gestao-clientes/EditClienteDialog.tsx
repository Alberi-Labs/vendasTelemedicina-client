import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

export interface EditClienteData {
  idCliente: number;
  nome: string;
  cpf: string;
  telefone?: string | null;
  email: string;
  data_nascimento: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  cliente: EditClienteData | null;
  onChange: (data: EditClienteData) => void;
  onSave: () => void;
}

export const EditClienteDialog: React.FC<Props> = ({ open, onClose, cliente, onChange, onSave }) => {
  if (!cliente) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Cliente</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Nome" fullWidth size="small" value={cliente.nome} onChange={e => onChange({ ...cliente, nome: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="CPF" fullWidth size="small" value={cliente.cpf} onChange={e => onChange({ ...cliente, cpf: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Telefone" fullWidth size="small" value={cliente.telefone || ''} onChange={e => onChange({ ...cliente, telefone: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Email" fullWidth size="small" value={cliente.email} onChange={e => onChange({ ...cliente, email: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField type="date" label="Nascimento" InputLabelProps={{ shrink: true }} fullWidth size="small" value={cliente.data_nascimento || ''} onChange={e => onChange({ ...cliente, data_nascimento: e.target.value })} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSave}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
};
