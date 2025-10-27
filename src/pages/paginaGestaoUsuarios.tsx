"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Form, Table, Badge, OverlayTrigger, Tooltip, InputGroup } from "react-bootstrap";
import "../styles/gestaoUsuarios.css";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { usuariosApi, instituicoesApi, usuarioApi } from "@/lib/api-client";

// =====================
// Helpers de UI + dados
// =====================
const normalizaPerfil = (p?: string | null) => (p || "").toLowerCase();
const normalizaStatus = (s?: string | null) => {
  const v = (s || "").toString().trim().toLowerCase();
  if (["a", "ativo", "active", "1", "true"].includes(v)) return "ativo";
  if (["i", "inativo", "inactive", "0", "false"].includes(v)) return "inativo";
  return "ativo"; // default seguro
};

const perfilToVariant: Record<string, string> = {
  admin: "danger",
  gestor: "warning",
  vendedor: "info",
  cliente: "secondary",
};

const PerfilBadge = ({ perfil }: { perfil: string | null }) => {
  if (!perfil) return <Badge bg="secondary" className="text-uppercase small fw-semibold">N/A</Badge>;
  const key = normalizaPerfil(perfil);
  const variant = perfilToVariant[key] || "secondary";
  return <Badge bg={variant} className="text-uppercase small fw-semibold">{key}</Badge>;
};

// =====================
// Tipos locais
// =====================
type Instituicao = { idInstituicao: number; nomeInstituicao: string };

type UsuarioAdaptado = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  perfil: string | null;
  id_instituicao: number | null;
  status: "ativo" | "inativo";
};

// =====================
// Componente
// =====================
export default function PaginaGestaoUsuario() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioAdaptado[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UsuarioAdaptado | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    perfil: "",
    id_instituicao: "",
    status: "ativo",
  });
  const [filtroInstituicao, setFiltroInstituicao] = useState<string>("");
  const [filtroRole, setFiltroRole] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [busca, setBusca] = useState<string>("");

  // =====================
  // Carregamento inicial
  // =====================
  useEffect(() => {
    fetchUsuarios();
    fetchInstituicoes();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await usuarioApi.buscarUsuario();
      if (response?.success) {
        const adaptado: UsuarioAdaptado[] = response.usuarios.map((u: any) => ({
          id: u.id,
          nome: u.nome,
          email: u.email,
          cpf: u.cpf,
          perfil: u.perfil ?? null,
          id_instituicao: u.id_instituicao ?? null,
          status: normalizaStatus(u.status) as "ativo" | "inativo",
        }));
        setUsuarios(adaptado);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  const fetchInstituicoes = async () => {
    try {
      const response = await instituicoesApi.listar();
      if (response?.success) setInstituicoes(response.instituicoes);
    } catch (error) {
      console.error("Erro ao buscar instituições:", error);
    }
  };

  // =====================
  // Modal helpers
  // =====================
  const handleClose = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({ nome: "", email: "", cpf: "", perfil: user?.perfil === "gestor" ? "vendedor" : "", id_instituicao: "", status: "ativo" });
  };

  const handleShow = (usuario?: UsuarioAdaptado) => {
    if (usuario) {
      setEditing(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email || "",
        cpf: formatarCPF(usuario.cpf || ""),
        perfil: normalizaPerfil(usuario.perfil || ""),
        id_instituicao: usuario.id_instituicao?.toString() || "",
        status: normalizaStatus(usuario.status) as "ativo" | "inativo",
      });
    } else {
      // Gestor força vendedor + sua instituição
      if (normalizaPerfil(user?.perfil) === "gestor") {
        setFormData({ nome: "", email: "", cpf: "", perfil: "vendedor", id_instituicao: user?.id_instituicao?.toString() || "", status: "ativo" });
      } else {
        setFormData({ nome: "", email: "", cpf: "", perfil: "", id_instituicao: "", status: "ativo" });
      }
    }
    setShowModal(true);
  };

  // Garantir gestor único por instituição (frontend): rebaixa outros gestores da mesma instituição
  const garantirGestorUnico = async (idInstituicao: number, novoGestorId?: number) => {
    const gestoresMesma = usuarios.filter(u => u.id_instituicao === idInstituicao && normalizaPerfil(u.perfil) === "gestor" && u.id !== (novoGestorId ?? 0));
    for (const g of gestoresMesma) {
      try { await usuariosApi.editar(g.id, { perfil: "vendedor" }); } catch { /* noop */ }
    }
  };

  const handleSave = async () => {
    const cpfLimpo = formData.cpf.replace(/\D/g, "");
    const payload: any = {
      nome: formData.nome,
      email: formData.email || "",
      perfil: normalizaPerfil(user?.perfil) === "gestor" ? "vendedor" : formData.perfil,
      senha: cpfLimpo,
      telefone: "",
      imagem: null,
      cpf: cpfLimpo,
      data_nascimento: null,
      id_instituicao: normalizaPerfil(user?.perfil) === "gestor"
        ? (user?.id_instituicao ?? null)
        : (formData.id_instituicao ? parseInt(formData.id_instituicao) : null),
    };

    const isEditando = !!editing;
    try {
      const response = isEditando
        ? await usuariosApi.editar(editing!.id, payload)
        : await usuariosApi.cadastrar(payload);

      if (response?.success) {
        if (normalizaPerfil(user?.perfil) === "admin" && payload.perfil === "gestor" && payload.id_instituicao) {
          await garantirGestorUnico(payload.id_instituicao, editing?.id);
        }
        await fetchUsuarios();
        handleClose();
      } else {
        alert(`Erro ao salvar usuário: ${response?.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert("Erro ao salvar usuário");
    }
  };

  // =====================
  // Ações por linha
  // =====================
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      const response = await usuariosApi.deletar(id);
      if (response?.success) await fetchUsuarios(); else alert(`Erro ao excluir usuário: ${response?.error || "Erro desconhecido"}`);
    } catch (error) { alert("Erro ao excluir usuário"); }
  };

  const handleToggleStatus = async (id: number, currentStatus: "ativo" | "inativo") => {
    const isActive = currentStatus === "ativo";
    const action = isActive ? "inativar" : "reativar";
    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;

    try {
      const response = isActive ? await usuariosApi.deletar(id) : await usuariosApi.reativar(id);
      if (response?.success) await fetchUsuarios(); else alert(`Erro ao ${action} usuário: ${response?.error || "Erro desconhecido"}`);
    } catch (error) { alert(`Erro ao ${action} usuário`); }
  };

  // =====================
  // Utils
  // =====================
  function formatarCPF(cpf: string) {
    const apenasNumeros = cpf.replace(/\D/g, "").slice(0, 11);
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_m, p1, p2, p3, p4) => `${p1}.${p2}.${p3}${p4 ? `-${p4}` : ""}`);
  }

  // =====================
  // Filtragem + visibilidade
  // =====================
  const usuariosVisiveis = useMemo(() => {
    let base: UsuarioAdaptado[] = usuarios;
    const perfilUser = normalizaPerfil(user?.perfil);

    if (perfilUser === "gestor") {
      base = usuarios.filter(u => u.id_instituicao === (user?.id_instituicao ?? -1) && normalizaPerfil(u.perfil) === "vendedor");
    }

    return base.filter(u => {
      const st = normalizaStatus(u.status);
      if (filtroInstituicao && (u.id_instituicao?.toString() !== filtroInstituicao)) return false;
      if (filtroRole && normalizaPerfil(u.perfil) !== filtroRole) return false;
      if (filtroStatus && st !== filtroStatus) return false;
      if (busca) {
        const b = busca.toLowerCase();
        const alvo = `${u.nome} ${u.email || ""} ${u.cpf}`.toLowerCase();
        if (!alvo.includes(b)) return false;
      }
      return true;
    });
  }, [usuarios, user, filtroInstituicao, filtroRole, filtroStatus, busca]);

  const podeEditar = (u: UsuarioAdaptado) => {
    const perfilUser = normalizaPerfil(user?.perfil);
    if (perfilUser === "admin") return true;
    if (perfilUser === "gestor") return u.id_instituicao === (user?.id_instituicao ?? -1) && normalizaPerfil(u.perfil) === "vendedor";
    return false;
  };

  // =====================
  // UI
  // =====================
  const isValidCPF = formData.cpf.replace(/\D/g, "").length === 11;
  const canSave = !!formData.nome && !!formData.perfil && isValidCPF && (normalizaPerfil(user?.perfil) === "gestor" ? true : !!formData.id_instituicao);

  return (
    <div className="container py-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
          <div>
            <h2 className="mb-1 fw-bold" style={{ color: "#2f3b52" }}>Gestão de Usuários</h2>
            <div className="small text-muted">Controle centralizado de contas, perfis e status</div>
          </div>
          <div className="d-flex gap-2">
            {(filtroInstituicao || filtroRole || filtroStatus || busca) && (
              <Button variant="outline-secondary" onClick={() => { setFiltroInstituicao(""); setFiltroRole(""); setFiltroStatus(""); setBusca(""); }}>
                <i className="bi bi-x-circle me-1"/> Limpar filtros
              </Button>
            )}
            <Button variant="success" onClick={() => handleShow()}>
              <i className="bi bi-person-plus me-2"/> Novo Usuário
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="d-flex flex-column flex-lg-row gap-3 mb-3 align-items-lg-end">
          <div style={{ minWidth: 260 }}>
            <Form.Label className="small text-uppercase fw-semibold text-muted mb-1">Pesquisar</Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-white"><i className="bi bi-search" /></InputGroup.Text>
              <Form.Control placeholder="Nome, email ou CPF" value={busca} onChange={e => setBusca(e.target.value)} />
            </InputGroup>
          </div>
          <div style={{ minWidth: 220 }}>
            <Form.Label className="small text-uppercase fw-semibold text-muted mb-1">Instituição</Form.Label>
            <Form.Select value={filtroInstituicao} onChange={e => setFiltroInstituicao(e.target.value)} disabled={normalizaPerfil(user?.perfil) === "gestor"}>
              <option value="">Todas</option>
              {instituicoes.map(i => (
                <option key={i.idInstituicao} value={i.idInstituicao}>{i.nomeInstituicao}</option>
              ))}
            </Form.Select>
          </div>
          <div style={{ minWidth: 200 }}>
            <Form.Label className="small text-uppercase fw-semibold text-muted mb-1">Função</Form.Label>
            <Form.Select value={filtroRole} onChange={e => setFiltroRole(e.target.value)}>
              <option value="">Todas</option>
              <option value="admin">Admin</option>
              <option value="gestor">Gestor</option>
              <option value="vendedor">Vendedor</option>
              <option value="cliente">Cliente</option>
            </Form.Select>
          </div>
          <div style={{ minWidth: 180 }}>
            <Form.Label className="small text-uppercase fw-semibold text-muted mb-1">Status</Form.Label>
            <Form.Select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Form.Select>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
          <span>Total: {usuariosVisiveis.length}</span>
          {(filtroInstituicao || filtroRole || filtroStatus || busca) && <span>Filtros ativos</span>}
        </div>

        <div className="table-responsive">
          <Table striped bordered hover className="align-middle table-sticky">
            <thead className="table-dark">
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>CPF</th>
                <th>Função</th>
                <th>Instituição</th>
                <th>Status</th>
                <th style={{ width: 140 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosVisiveis.map((u) => {
                const empresaDoUsuario = instituicoes.find(e => e.idInstituicao === u.id_instituicao);
                const disabled = !podeEditar(u);
                const st = normalizaStatus(u.status);
                const isGestor = normalizaPerfil(u.perfil) === "gestor";
                return (
                  <tr key={u.id} className={`${isGestor ? "table-warning" : ""} ${st === "inativo" ? "table-secondary text-muted" : ""}`}>
                    <td className="fw-semibold">{u.nome}</td>
                    <td>{u.email || "—"}</td>
                    <td>{u.cpf}</td>
                    <td><PerfilBadge perfil={u.perfil} /></td>
                    <td>{empresaDoUsuario?.nomeInstituicao || "Não vinculada"}</td>
                    <td>
                      <Badge bg={st === "ativo" ? "success" : "secondary"} className="text-uppercase small fw-semibold">
                        {st === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <OverlayTrigger overlay={<Tooltip>Editar</Tooltip>}>
                          <span className="d-inline-block">
                            <Button size="sm" variant="outline-primary" disabled={disabled} onClick={() => !disabled && handleShow(u)}>
                              <i className="bi bi-pencil-square" />
                            </Button>
                          </span>
                        </OverlayTrigger>
                        <OverlayTrigger overlay={<Tooltip>{st === "ativo" ? "Inativar" : "Reativar"}</Tooltip>}>
                          <span className="d-inline-block">
                            <Button size="sm" variant={st === "ativo" ? "outline-warning" : "outline-success"} disabled={disabled} onClick={() => !disabled && handleToggleStatus(u.id, st)}>
                              <i className={`bi ${st === "ativo" ? "bi-slash-circle" : "bi-check-circle"}`} />
                            </Button>
                          </span>
                        </OverlayTrigger>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {/* Modal */}
        <Modal show={showModal} onHide={handleClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>{editing ? "Editar Usuário" : "Novo Usuário"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nome</Form.Label>
                <Form.Control type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>CPF</Form.Label>
                <Form.Control type="text" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: formatarCPF(e.target.value) })} isInvalid={!!formData.cpf && !isValidCPF} />
                <Form.Control.Feedback type="invalid">CPF precisa ter 11 dígitos.</Form.Control.Feedback>
              </Form.Group>

              {normalizaPerfil(user?.perfil) === "gestor" ? (
                <Form.Group className="mb-3">
                  <Form.Label>Função</Form.Label>
                  <Form.Control value="vendedor" disabled readOnly />
                  <Form.Text className="text-muted">Gestores só podem criar/editar vendedores.</Form.Text>
                </Form.Group>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>Função</Form.Label>
                  <Form.Select value={formData.perfil} onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}>
                    <option value="">Selecione um perfil</option>
                    <option value="cliente">Cliente</option>
                    <option value="admin">Admin</option>
                    <option value="gestor">Gestor</option>
                    <option value="vendedor">Vendedor</option>
                  </Form.Select>
                </Form.Group>
              )}

              {normalizaPerfil(user?.perfil) === "gestor" ? (
                <Form.Group className="mb-3">
                  <Form.Label>Instituição</Form.Label>
                  <Form.Control value={instituicoes.find(i => i.idInstituicao === (user?.id_instituicao ?? -1))?.nomeInstituicao || ""} disabled />
                </Form.Group>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>Instituição</Form.Label>
                  <Form.Select value={formData.id_instituicao} onChange={(e) => setFormData({ ...formData, id_instituicao: e.target.value })}>
                    <option value="">Selecione a instituição</option>
                    {instituicoes.map((i) => (
                      <option key={i.idInstituicao} value={i.idInstituicao}>{i.nomeInstituicao}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={!canSave}><i className="bi bi-save2 me-2"/>Salvar</Button>
          </Modal.Footer>
        </Modal>
      </motion.div>
    </div>
  );
}
