// pages/gestao-clientes.tsx
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
import { clientesApi, instituicoesEmpresaApi, vendaTelemedicinaApiCompat } from '../lib/api-client';
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
  const [loadingCancelamento, setLoadingCancelamento] = useState(false);
  const [instituicoes, setInstituicoes] = useState<InstituicaoOption[]>([]);
  const [instituicaoFiltro, setInstituicaoFiltro] = useState<string>('');
  const [busca, setBusca] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.perfil === 'admin') {
      instituicoesEmpresaApi.buscar()
        .then(data => { if (data.success) setInstituicoes(data.instituicoes || []); })
        .catch(() => {});
    }
  }, [user]);

  const carregarClientes = async () => {
    setLoading(true);
    try {
      const filtros: any = {};
      if (user?.perfil === 'admin' && instituicaoFiltro) {
        filtros.id_instituicao = parseInt(instituicaoFiltro, 10);
      }
      const data = await clientesApi.consultar(filtros);
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
      // usa filtros do backend quando possível
      const idUsuario = user?.id;
      const inst = user?.perfil === 'admin' && instituicaoFiltro
        ? Number(instituicaoFiltro)
        : undefined;

      const res = await vendaTelemedicinaApiCompat.consultarVenda(
        idUsuario, // opcional
        inst ? { id_instituicao: inst } : undefined
      );

      const vendasApi = (res.data?.data?.vendas || res.data?.vendas || []);
      const vendasCliente = vendasApi
        .filter((v: any) => v.id_cliente === cliente.idCliente)
        .slice(0, 5)
        .map((v: any) => ({
          idVenda: v.idVenda,
          data: v.criado_em || v.data || new Date().toISOString(),
          valor: Number(v.valor_venda || v.valor || 0),
        }));
      setVendas(vendasCliente);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoadingVendas(false);
    }
  };

  const handleEditarClick = async (cliente: Cliente) => {
    try {
      const data = await clientesApi.consultar({ cpf: cliente.cpf });
      const clienteCompleto = data.clientes?.[0] || data.data?.clientes?.[0];

      if (clienteCompleto) {
        setClienteEditando({
          ...clienteCompleto,
          data_nascimento: clienteCompleto.data_nascimento
            ? clienteCompleto.data_nascimento.split("/").reverse().join("-")
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
      await clientesApi.editar(clienteEditando.idCliente, {
        nome: clienteEditando.nome,
        email: clienteEditando.email,
        telefone: clienteEditando.telefone,
        cpf: clienteEditando.cpf.replace(/\D/g, ""),
        data_nascimento: clienteEditando.data_nascimento,
      });

      alert("Cliente atualizado com sucesso!");
      setModalEditarOpen(false);
      setClientes(prev =>
        prev.map(c => (c.idCliente === clienteEditando.idCliente ? clienteEditando : c))
      );
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      alert("Erro ao atualizar cliente.");
    }
  };

  const handleDeletarClick = async (cliente: Cliente) => {
    if (!window.confirm(`Deseja realmente deletar ${cliente.nome}?`)) return;

    try {
      await clientesApi.deletar(cliente.idCliente);
      alert("Cliente deletado!");
      setClientes(prev => prev.filter(c => c.idCliente !== cliente.idCliente));
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      alert("Erro ao deletar cliente.");
    }
  };

  const handleCancelarAssinatura = async (cliente: Cliente) => {
    if (!window.confirm(`Tem certeza que deseja cancelar a assinatura de ${cliente.nome}?`)) return;

    setLoadingCancelamento(true);
    try {
      // buscar vendas com filtro do usuário/instituição
      const idUsuario = user?.id;
      const inst = user?.perfil === 'admin' && instituicaoFiltro
        ? Number(instituicaoFiltro)
        : undefined;

      const res = await vendaTelemedicinaApiCompat.consultarVenda(
        idUsuario,
        inst ? { id_instituicao: inst } : undefined
      );
      const vendasApi = (res.data?.data?.vendas || res.data?.vendas || []);
      const vendasCliente = vendasApi.filter((v: any) => v.id_cliente === cliente.idCliente);

      if (!vendasCliente || vendasCliente.length === 0) {
        alert("Nenhuma assinatura encontrada para este cliente.");
        return;
      }

      const vendaAtiva = vendasCliente[0];

      const result = await vendaTelemedicinaApiCompat.cancelarAssinatura({
        idVenda: vendaAtiva.idVenda,
        motivo: "Cancelamento solicitado via gestão de clientes",
      });

      let mensagemFinal = "";
      if (result.success) {
        mensagemFinal = "Assinatura Asaas cancelada com sucesso!";

        // tentar cancelar na Sulamérica se existir seq_venda
        const clienteCompleto = await clientesApi.consultar({ cpf: cliente.cpf });
        const clienteData = clienteCompleto.clientes?.[0] || clienteCompleto.data?.clientes?.[0];

        if (clienteData?.seq_venda) {
          try {
            const r2 = await vendaTelemedicinaApiCompat.cancelarVidaSulamerica({
              seq_venda: clienteData.seq_venda,
            });
            if (r2.codigo === 0 || r2.codigo === '0' || r2.codigo === 200 || r2.codigo === '200' || r2.codigo === 21 || r2.codigo === '21') {
              mensagemFinal += "\n✅ Vida Sulamérica também cancelada/confirmada como cancelada!";
            } else {
              mensagemFinal += `\n⚠️ Erro ao cancelar na Sulamérica: ${r2.msg_retorno || 'Erro desconhecido'}`;
            }
          } catch (e) {
            console.error("Erro ao cancelar Sulamérica:", e);
            mensagemFinal += "\n⚠️ Erro ao cancelar na Sulamérica (falha de comunicação)";
          }
        } else {
          mensagemFinal += "\n(Cliente não possui cadastro na Sulamérica)";
        }

        alert(mensagemFinal);
        carregarClientes();
      } else {
        alert(`Erro ao cancelar assinatura: ${result.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      alert("Erro ao cancelar assinatura. Tente novamente.");
    } finally {
      setLoadingCancelamento(false);
    }
  };

  // Filtro derivado (placeholder atual)
  const clientesFiltrados = useMemo(() => {
    let base = clientes;
    if (busca) {
      const b = busca.toLowerCase();
      base = base.filter(c => `${c.nome} ${c.email} ${c.cpf}`.toLowerCase().includes(b));
    }
    return base;
  }, [clientes, busca]);

  return (
    <Container maxWidth="lg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Paper elevation={3} sx={{ p: 4, mt: 5 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Gestão de Clientes
          </Typography>
          <Grid container spacing={2} mt={1} alignItems="flex-end">
            <Grid item xs={12} md={4}>
              <TextField
                label="Pesquisar"
                size="small"
                fullWidth
                placeholder="Nome, email ou CPF"
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </Grid>
            {user?.perfil === 'admin' && (
              <Grid item xs={12} md={4}>
                <TextField
                  label="Instituição"
                  size="small"
                  select
                  fullWidth
                  value={instituicaoFiltro}
                  onChange={e => setInstituicaoFiltro(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {instituicoes.map(inst => (
                    <MenuItem key={inst.idInstituicao} value={inst.idInstituicao}>
                      {inst.nomeInstituicao}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} md={4} textAlign={{ xs: 'left', md: 'right' }}>
              <Chip label={`Total: ${clientesFiltrados.length}`} color="primary" variant="outlined" />
              {(busca || (user?.perfil==='admin' && instituicaoFiltro)) && (
                <Button size="small" sx={{ ml: 1 }} onClick={() => { setBusca(''); setInstituicaoFiltro(''); }}>
                  Limpar
                </Button>
              )}
            </Grid>
          </Grid>

          {loading ? (
            <Box display="flex" justifyContent="center"><CircularProgress /></Box>
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
                            onCancel={() => handleCancelarAssinatura(cliente)}
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
          <Button onClick={() => setModalOpen(false)} color="secondary">Fechar</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(`/novaVenda?cliente=${selectedCliente?.idCliente}`)}
          >
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
