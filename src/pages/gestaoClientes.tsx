import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// 🔹 Interface para Cliente
interface Cliente {
  idCliente: number;
  nome: string;
  cpf: string;
  email: string;
  creditos: number;
}

// 🔹 Interface para Venda
interface Venda {
  idVenda: number;
  data: string;
  valor: number;
}

export default function GestaoClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  // 🔹 Buscar todos os clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch("/api/cliente/consultar");
        const data = await response.json();
        setClientes(data.clientes);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  // 🔹 Buscar informações detalhadas do cliente selecionado
  const handleClienteClick = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setModalOpen(true);
    setLoadingVendas(true);

    try {
      const response = await fetch(`/api/venda/consultar?id_cliente=${cliente.idCliente}`);
      const data = await response.json();
      setVendas(data.vendas?.slice(0, 5) || []);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoadingVendas(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 5 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Gestão de Clientes
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nome</strong></TableCell>
                  <TableCell><strong>CPF</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientes?.map((cliente) => (
                  <TableRow key={cliente.idCliente}>
                    <TableCell>{cliente.nome}</TableCell>
                    <TableCell>{cliente.cpf}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleClienteClick(cliente)}
                      >
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 🔹 Modal de Detalhes do Cliente */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhes do Cliente</DialogTitle>
        <DialogContent>
          {selectedCliente && (
            <>
              <Typography><strong>Nome:</strong> {selectedCliente.nome}</Typography>
              <Typography><strong>CPF:</strong> {selectedCliente.cpf}</Typography>
              <Typography><strong>Email:</strong> {selectedCliente.email}</Typography>
              <Typography><strong>Créditos:</strong> {selectedCliente.creditos}</Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>Últimas 5 Vendas</Typography>
              {loadingVendas ? (
                <CircularProgress size={24} />
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Data</strong></TableCell>
                        <TableCell><strong>Valor</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vendas.length > 0 ? (
                        vendas.map((venda) => (
                          <TableRow key={venda.idVenda}>
                            <TableCell>{new Date(venda.data).toLocaleDateString()}</TableCell>
                            <TableCell>R$ {venda.valor ? parseFloat(venda.valor.toString()).toFixed(2) : "0.00"}</TableCell>
                            </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} align="center">Nenhuma venda encontrada.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="secondary">
            Fechar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(`/novaVenda?cliente=${selectedCliente?.idCliente}`)}
          >
            Nova Venda
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
