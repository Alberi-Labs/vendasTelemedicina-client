import { useState, useEffect, useMemo } from "react";
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
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { clientesApi, instituicoesEmpresaApi } from '../lib/api-client';
import { ActionButtons } from '@/components/gestao-clientes/ActionButtons';
import { ChargesModal } from '@/components/gestao-clientes/ChargesModal';
import { GenerateCarteirinhaModal } from '@/components/gestao-clientes/GenerateCarteirinhaModal';
import { EditClienteDialog } from '@/components/gestao-clientes/EditClienteDialog';
import { useAuth } from '@/app/context/AuthContext';

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

interface InstituicaoOption { idInstituicao: number; nomeInstituicao: string; }

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
  const [chargesOpen, setChargesOpen] = useState(false);
  const [carteirinhaOpen, setCarteirinhaOpen] = useState(false);
  const [instituicoes, setInstituicoes] = useState<InstituicaoOption[]>([]);
  const [instituicaoFiltro, setInstituicaoFiltro] = useState<string>('');
  const [busca, setBusca] = useState('');
  const { user } = useAuth();

  console.log("cliente selecionado", selectedCliente);
  useEffect(() => {
    // Carregar instituições só para admin (para filtro)
    if (user?.role === 'admin') {
      instituicoesEmpresaApi.buscarEmpresa().then(data => {
        if (data.success) setInstituicoes(data.instituicoes || []);
      }).catch(() => {});
    }
  }, [user]);

  const carregarClientes = async () => {
    setLoading(true);
    try {
      const filtros: any = {};
      if (user?.role === 'admin' && instituicaoFiltro) filtros.id_instituicao = parseInt(instituicaoFiltro);
      // (backend ainda ignora id_instituicao; fallback filtra no front)
      console.log('Carregando clientes com filtros:', filtros);
      const data = await clientesApi.consultar(filtros);
      console.log('Dados de clientes recebidos:', data);
      const lista = data.clientes || data.data?.clientes || [];
      setClientes(lista);
    } catch (e) {
      console.error('Erro ao carregar clientes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) carregarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, instituicaoFiltro]);

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

  // Filtro derivado (caso backend não filtre por instituicao)
  const clientesFiltrados = useMemo(() => {
    let base = clientes;
    if (user?.role !== 'admin' && user?.id_instituicao) {
      // TODO: Quando backend relacionar clientes a instituicoes dinamicamente, aplicar aqui
      // Sem origem no payload atual, mantemos todos (placeholder)
    } else if (user?.role === 'admin' && instituicaoFiltro) {
      // Se tivéssemos id_instituicao no cliente, filtraria aqui
    }
    if (busca) {
      const b = busca.toLowerCase();
      base = base.filter(c => `${c.nome} ${c.email} ${c.cpf}`.toLowerCase().includes(b));
    }
    return base;
  }, [clientes, busca, user, instituicaoFiltro]);

  return (
    <Container maxWidth="lg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Paper elevation={3} sx={{ p: 4, mt: 5 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Gestão de Clientes
          </Typography>
          <Grid container spacing={2} mt={1} alignItems="flex-end">
            <Grid item xs={12} md={4}>
              <TextField label="Pesquisar" size="small" fullWidth placeholder="Nome, email ou CPF" value={busca} onChange={e => setBusca(e.target.value)} />
            </Grid>
            {user?.role === 'admin' && (
              <Grid item xs={12} md={4}>
                <TextField label="Instituição" size="small" select fullWidth value={instituicaoFiltro} onChange={e => setInstituicaoFiltro(e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  {instituicoes.map(inst => (
                    <MenuItem key={inst.idInstituicao} value={inst.idInstituicao}>{inst.nomeInstituicao}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} md={4} textAlign={{ xs: 'left', md: 'right' }}>
              <Chip label={`Total: ${clientesFiltrados.length}`} color="primary" variant="outlined" />
              {(busca || (user?.role==='admin' && instituicaoFiltro)) && (
                <Button size="small" sx={{ ml: 1 }} onClick={() => { setBusca(''); setInstituicaoFiltro(''); }}>Limpar</Button>
              )}
            </Grid>
          </Grid>
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
                  {clientesFiltrados?.map((cliente) => (
                    <TableRow key={cliente.idCliente}>
                      <TableCell>{cliente.nome}</TableCell>
                      <TableCell>{cliente.cpf}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>
                        <div className="d-flex gap-2">
                          <ActionButtons
                            onView={() => handleClienteClick(cliente)}
                            onEdit={() => handleEditarClick(cliente)}
                            onCharges={() => { setSelectedCliente(cliente); setChargesOpen(true); }}
                            onCarteirinha={() => { setSelectedCliente(cliente); setCarteirinhaOpen(true); }}
                          />
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
      <EditClienteDialog
        open={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        cliente={clienteEditando as any}
        onChange={(data) => setClienteEditando(data as any)}
        onSave={handleSalvarEdicao}
      />

      <ChargesModal
        open={chargesOpen}
        onClose={() => setChargesOpen(false)}
        cpf={selectedCliente?.cpf}
        email={selectedCliente?.email}
      />
      <GenerateCarteirinhaModal
        open={carteirinhaOpen}
        onClose={() => setCarteirinhaOpen(false)}
        clienteNome={selectedCliente?.nome}
        clienteCpf={selectedCliente?.cpf}
        vigencia={(selectedCliente as any)?.vigencia_contrato || null}
        apolice={(selectedCliente as any)?.numero_apolice || null}
        operacao={(selectedCliente as any)?.numero_operacao || null}
        certificado={(selectedCliente as any)?.numero_certificado || null}
        contratoAssinado={(selectedCliente as any)?.contrato_assinado || false}
        nomeInstituicao={(selectedCliente as any)?.nomeInstituicao || (selectedCliente as any)?.dsc_instituicao || null}
      />

    </Container>
  );
}