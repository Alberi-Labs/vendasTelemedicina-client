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
import { motion } from "framer-motion";

// 🔹 Interface para Cliente
interface Cliente {
  idCliente: number;
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  data_nascimento: string | null;
  idClienteDependente: number | null;
  data_vinculo: string | null;
  creditos: number | null;
}


interface Venda {
  idVenda: number;
  data: string;
  valor: number;
}

export default function PaginaGestaoClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  
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

  const handleEditarClick = async (cliente: Cliente) => {
  try {
    const response = await fetch(`/api/cliente/consultar?cpf=${cliente.cpf}`);
    const data = await response.json();

    if (data.success && data.clientes.length > 0) {
      const clienteCompleto = data.clientes[0];
      setClienteEditando({
        ...clienteCompleto,
        data_nascimento: clienteCompleto.data_nascimento
          ? clienteCompleto.data_nascimento.split("/").reverse().join("-") // de DD/MM/AAAA → YYYY-MM-DD
          : "",
      });
      setModalEditarOpen(true);
    } else {
      alert("Cliente não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao buscar cliente para edição:", error);
    alert("Erro ao buscar dados do cliente.");
  }
};

  
  const handleSalvarEdicao = async () => {
    if (!clienteEditando) return;
  
    try {
      const response = await fetch(`/api/cliente/editar?id=${clienteEditando.idCliente}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: clienteEditando.nome,
          email: clienteEditando.email,
          telefone: clienteEditando.telefone,
          cpf: clienteEditando.cpf.replace(/\D/g, ""), 
          data_nascimento: clienteEditando.data_nascimento,
          creditos: clienteEditando.creditos,
        }),
      });
      
  
      if (response.ok) {
        alert("Cliente atualizado com sucesso!");
        setModalEditarOpen(false);
        // Atualizar lista de clientes
        const updatedClientes = clientes.map((c) =>
          c.idCliente === clienteEditando.idCliente ? clienteEditando : c
        );
        setClientes(updatedClientes);
      } else {
        alert("Erro ao atualizar cliente.");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar cliente.");
    }
  };
  
  const handleDeletarClick = async (cliente: Cliente) => {
    if (!window.confirm(`Deseja realmente deletar ${cliente.nome}?`)) return;
  
    try {
      const response = await fetch(`/api/cliente/deletar?id=${cliente.idCliente}`, {
        method: "DELETE",
      });
  
      if (response.ok) {
        alert("Cliente deletado!");
        setClientes(clientes.filter((c) => c.idCliente !== cliente.idCliente));
      } else {
        alert("Erro ao deletar cliente.");
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };
  
  return (
    <Container maxWidth="lg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
  <div className="d-flex gap-2">
    <Button variant="contained" size="small" onClick={() => handleClienteClick(cliente)}>👁 Ver</Button>
    <Button variant="contained" size="small" onClick={() => handleEditarClick(cliente)}>✏️</Button>
    <Button variant="contained" color="error" size="small" onClick={() => handleDeletarClick(cliente)}>🗑️</Button>
    <Button variant="contained" size="small" onClick={() => router.push(`/gerarApolice?cliente=${cliente.idCliente}`)}>📄</Button>
  </div>
</TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </motion.div>
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
                            <TableCell>R$ {venda.valor}</TableCell>
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
          <Button variant="contained" color="primary" onClick={() => router.push(`/novaVenda?cliente=${selectedCliente?.idCliente}`)}>
            Nova Venda
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={modalEditarOpen} onClose={() => setModalEditarOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Editar Cliente</DialogTitle>
  <DialogContent>
  {clienteEditando && (
  <>
    <Box className="mb-3">
      <label>Nome</label>
      <input
        className="form-control"
        value={clienteEditando.nome}
        onChange={(e) =>
          setClienteEditando({ ...clienteEditando, nome: e.target.value })
        }
      />
    </Box>
    <Box className="mb-3">
  <label>CPF</label>
  <input
    className="form-control"
    value={clienteEditando.cpf}
    onChange={(e) => {
      const onlyNumbers = e.target.value.replace(/\D/g, "");
      const formattedCpf = onlyNumbers
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");

      setClienteEditando({ ...clienteEditando, cpf: formattedCpf });
    }}
  />
</Box>

    <Box className="mb-3">
      <label>Telefone</label>
      <input
        className="form-control"
        value={clienteEditando.telefone || ""}
        onChange={(e) =>
          setClienteEditando({ ...clienteEditando, telefone: e.target.value })
        }
      />
    </Box>

    <Box className="mb-3">
      <label>Email</label>
      <input
        className="form-control"
        value={clienteEditando.email}
        onChange={(e) =>
          setClienteEditando({ ...clienteEditando, email: e.target.value })
        }
      />
    </Box>

    <Box className="mb-3">
      <label>Data de Nascimento</label>
      <input
        type="date"
        className="form-control"
        value={clienteEditando.data_nascimento || ""}
        onChange={(e) =>
          setClienteEditando({ ...clienteEditando, data_nascimento: e.target.value })
        }
      />
    </Box>

  </>
)}

  </DialogContent>
  <DialogActions>
    <Button onClick={() => setModalEditarOpen(false)} color="secondary">
      Cancelar
    </Button>
    <Button variant="contained" onClick={handleSalvarEdicao}>
      Salvar Alterações
    </Button>
  </DialogActions>
</Dialog>

    </Container>
  );
}