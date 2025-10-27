import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableHead, TableRow, TableCell, TableBody, Typography, CircularProgress } from '@mui/material';

interface NotaEmitida {
  id: string;
  numero: string;
  status: string;
  valor: number;
  descricao: string;
  dataEmissao: string;
  pdf?: string;
}

interface ListaNotasEmitidasProps {
  open: boolean;
  onClose: () => void;
  assinaturaId: string;
  onVisualizarNota: (nota: NotaEmitida) => void;
}

const ListaNotasEmitidas: React.FC<ListaNotasEmitidasProps> = ({ open, onClose, assinaturaId, onVisualizarNota }) => {
  const [notas, setNotas] = useState<NotaEmitida[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && assinaturaId) {
      buscarNotas();
    }
    // eslint-disable-next-line
  }, [open, assinaturaId]);

  const buscarNotas = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/notasFiscais/listarNotas?assinaturaId=${assinaturaId}`);
      const data = await resp.json();
      setNotas(data.notasFiscais || []);
    } catch (e) {
      setNotas([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Notas Fiscais Emitidas</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : notas.length === 0 ? (
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
              {notas.map((nota) => (
                <TableRow key={nota.id}>
                  <TableCell>{nota.numero}</TableCell>
                  <TableCell>{nota.status}</TableCell>
                  <TableCell>{nota.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  <TableCell>{new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => onVisualizarNota(nota)}>
                      Visualizar
                    </Button>
                    {nota.pdf && (
                      <Button size="small" href={nota.pdf} target="_blank">PDF</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ListaNotasEmitidas;
