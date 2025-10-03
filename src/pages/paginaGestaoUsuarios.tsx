import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Form, Table, Badge, OverlayTrigger, Tooltip, InputGroup } from "react-bootstrap";
import '../styles/gestaoUsuarios.css';
import { motion } from "framer-motion";
import { Usuario } from "./api/usuario/buscarUsuario";
import { useAuth } from "@/app/context/AuthContext";
import { decrypt } from "@/lib/cryptoHelper";
import { usuariosApi, instituicoesApi } from "@/lib/api-client";

type Instituicao = {
  idInstituicao: number;
  nomeInstituicao: string;
};

export default function PaginaGestaoUsuario() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    perfil: "",
    id_instituicao: "",
  });
  const [filtroInstituicao, setFiltroInstituicao] = useState<string>('');
  const [filtroRole, setFiltroRole] = useState<string>('');
  const [busca, setBusca] = useState<string>('');


  useEffect(() => {
    fetchUsuarios();
    fetchInstituicoes();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await usuariosApi.buscar();
      if (response.success) {
        const adaptado = response.usuarios.map((u: any) => ({
          id: u.id,
          nome: u.nome,
          email: u.email,
          cpf: u.cpf,
          perfil: u.perfil,
          id_instituicao: u.id_instituicao,
        }));
        setUsuarios(adaptado);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const fetchInstituicoes = async () => {
    try {
      const response = await instituicoesApi.listar();
      if (response.success) {
        setInstituicoes(response.instituicoes);
      }
    } catch (error) {
      console.error('Erro ao buscar instituições:', error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({ nome: "", email: "", cpf: "", perfil: "", id_instituicao: "" });
  };

  const handleShow = (usuario?: Usuario) => {
    if (usuario) {
      setEditing(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        perfil: usuario.perfil?.toLowerCase() ?? '',
        id_instituicao: usuario.id_instituicao?.toString() ?? "",
      });

    } else {
      // Se gestor criando, força vendedor e instituição dele
      if (user?.perfil === 'gestor') {
        setFormData({ nome: "", email: "", cpf: "", perfil: "vendedor", id_instituicao: user.id_instituicao?.toString() || "" });
      } else {
        setFormData({ nome: "", email: "", cpf: "", perfil: "", id_instituicao: "" });
      }
    }
    setShowModal(true);
  };

  // Garantir gestor único por instituição (frontend) - troca antigos gestores para vendedor
  const garantirGestorUnico = async (idInstituicao: number, novoGestorId?: number) => {
    const gestoresMesma = usuarios.filter(u => u.id_instituicao === idInstituicao && u.perfil?.toLowerCase() === 'gestor' && u.id !== novoGestorId);
    for (const g of gestoresMesma) {
      try {
        await usuariosApi.editar(g.id, { perfil: 'vendedor' });
      } catch (e) {
        console.warn('Falha ao rebaixar gestor antigo', g.id);
      }
    }
  };

  const handleSave = async () => {
    const payload = {
      nome: formData.nome,
      email: formData.email || "",
      perfil: user?.perfil === 'gestor' ? 'vendedor' : formData.perfil, // gestor só cria/edita vendedores
      senha: formData.cpf.replace(/[.\-]/g, ''), // senha padrão é o CPF sem pontos e traços
      telefone: "",
      imagem: null,
      cpf: formData.cpf.replace(/[.\-]/g, ''), // CPF limpo sem pontos e traços
      data_nascimento: null,
      id_instituicao: user?.perfil === 'gestor'
        ? (user.id_instituicao ?? null)
        : (formData.id_instituicao ? parseInt(formData.id_instituicao) : null),
    };


    const isEditando = !!editing;

    try {
      let response;
      if (isEditando) {
        response = await usuariosApi.editar(editing.id, payload);
      } else {
        response = await usuariosApi.cadastrar(payload);
      }

      if (response.success) {
        // Se admin está promovendo a gestor, garantir unicidade por instituição
        if (user?.perfil === 'admin' && payload.perfil === 'gestor' && payload.id_instituicao) {
          await garantirGestorUnico(payload.id_instituicao, editing?.id);
        }
        await fetchUsuarios();
        handleClose();
      } else {
        console.error("Erro ao salvar usuário:", response.error);
        alert(`Erro ao salvar usuário: ${response.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert("Erro ao salvar usuário");
    }
  };


  const handleDelete = async (id: number) => {
    console.log('🗑️ Tentando excluir usuário com ID:', id);
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      console.log('📡 Chamando API para excluir usuário...');
      const response = await usuariosApi.deletar(id);
      console.log('📡 Resposta da API:', response);
      
      if (response.success) {
        console.log('✅ Usuário excluído com sucesso');
        await fetchUsuarios();
      } else {
        console.error('❌ Erro da API:', response.error);
        alert(`Erro ao excluir usuário: ${response.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("❌ Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário");
    }
  };

  function formatarCPF(cpf: string) {
    const apenasNumeros = cpf.replace(/\D/g, "").slice(0, 11);
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (match, p1, p2, p3, p4) => {
      return `${p1}.${p2}.${p3}${p4 ? `-${p4}` : ""}`;
    });
  }

  // Filtragem de visibilidade: gestor só vê seus vendedores / admin vê tudo
  const usuariosVisiveis = useMemo(() => {
    let base: Usuario[];
    if (user?.perfil === 'admin') base = usuarios;
    else if (user?.perfil === 'gestor') {
      base = usuarios.filter(u => u.id_instituicao === user.id_instituicao && u.perfil?.toLowerCase() === 'vendedor');
    } else base = usuarios;

    // Filtros adicionais
    return base.filter(u => {
      if (filtroInstituicao) {
        if (!u.id_instituicao || u.id_instituicao.toString() !== filtroInstituicao) return false;
      }
      if (filtroRole) {
        if (u.perfil?.toLowerCase() !== filtroRole) return false;
      }
      if (busca) {
        const b = busca.toLowerCase();
        const alvo = `${u.nome} ${u.email || ''} ${u.cpf}`.toLowerCase();
        if (!alvo.includes(b)) return false;
      }
      return true;
    });
  }, [usuarios, user, filtroInstituicao, filtroRole, busca]);

  // Checa se linha pode ser editada pelo usuário logado
  const podeEditar = (u: Usuario) => {
    const canEdit = (() => {
      if (user?.perfil === 'admin') return true;
      if (user?.perfil === 'gestor') {
        return u.id_instituicao === user.id_instituicao && u.perfil?.toLowerCase() === 'vendedor';
      }
      return false;
    })();
    
    console.log('🔐 Verificando permissão de edição:', {
      user: user?.perfil,
      userInst: user?.id_instituicao,
      targetUser: u.nome,
      targetInst: u.id_instituicao,
      targetPerfil: u.perfil,
      canEdit
    });
    
    return canEdit;
  };



  const badgeForPerfil = (perfil: string | null) => {
    if (!perfil) {
      return <Badge bg="secondary" className="text-uppercase small fw-semibold">N/A</Badge>;
    }
    const p = perfil.toLowerCase();
    const map: Record<string, string> = { admin: 'danger', gestor: 'warning', vendedor: 'info', cliente: 'secondary' };
    const variant = map[p] || 'secondary';
    return <Badge bg={variant} className="text-uppercase small fw-semibold">{perfil}</Badge>;
  };


  return (
    <div className="container py-5">
      <motion.h2 className="text-center mb-5 fw-bold">Gestão de Usuários</motion.h2>
      <div className="d-flex flex-column flex-lg-row gap-3 mb-4 align-items-lg-end justify-content-between">
        <div className="flex-grow-1 d-flex flex-column flex-md-row gap-3">
          <div style={{ minWidth: 240 }}>
            <Form.Label className="small text-uppercase fw-semibold text-muted mb-1">Pesquisar</Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-white"><i className="bi bi-search" /></InputGroup.Text>
              <Form.Control placeholder="Nome, email ou CPF" value={busca} onChange={e => setBusca(e.target.value)} />
            </InputGroup>
          </div>
          <div style={{ minWidth: 200 }}>
            <Form.Label className="small text-uppercase fw-semibold text-muted mb-1">Instituição</Form.Label>
            <Form.Select value={filtroInstituicao} onChange={e => setFiltroInstituicao(e.target.value)} disabled={user?.perfil === 'gestor'}>
              <option value="">Todas</option>
              {instituicoes.map(i => (
                <option key={i.idInstituicao} value={i.idInstituicao}>{i.nomeInstituicao}</option>
              ))}
            </Form.Select>
          </div>
          <div style={{ minWidth: 180 }}>
            <Form.Label className="small text-uppercase fw-semibold text-muted mb-1">Função</Form.Label>
            <Form.Select value={filtroRole} onChange={e => setFiltroRole(e.target.value)}>
              <option value="">Todas</option>
              <option value="admin">Admin</option>
              <option value="gestor">Gestor</option>
              <option value="vendedor">Vendedor</option>
              <option value="cliente">Cliente</option>
            </Form.Select>
          </div>
        </div>
        <div className="d-flex gap-2">
          {(filtroInstituicao || filtroRole || busca) && (
            <Button variant="outline-secondary" onClick={() => { setFiltroInstituicao(''); setFiltroRole(''); setBusca(''); }}>Limpar</Button>
          )}
          <Button variant="success" onClick={() => handleShow()}>
            <i className="bi bi-person-plus me-2"></i>Novo Usuário
          </Button>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
        <span>Total: {usuariosVisiveis.length}</span>
        {(filtroInstituicao || filtroRole || busca) && <span>Filtros ativos</span>}
      </div>
      <Table striped bordered hover responsive className="align-middle">
        <thead className="table-dark">
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Cpf</th>
            <th>Função</th>
            <th>Instituicao</th> {/* NOVO */}
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuariosVisiveis.map((userRow) => {
            const empresaDoUsuario = instituicoes.find((e) => e.idInstituicao === userRow.id_instituicao);
            const disabled = !podeEditar(userRow);

            return (
              <tr key={userRow.id} className={userRow.perfil?.toLowerCase()==='gestor' ? 'table-warning' : ''}>
                <td className="fw-semibold">{userRow.nome}</td>
                <td>{userRow.email}</td>
                <td>{userRow.cpf}</td>
                <td>{badgeForPerfil(userRow.perfil)}</td>
                <td>{empresaDoUsuario?.nomeInstituicao || "Não vinculada"}</td>
                <td>
                  <div className="d-flex gap-2">
                    <OverlayTrigger overlay={<Tooltip>Editar</Tooltip>}>
                      <span className="d-inline-block">
                        <Button size="sm" variant="outline-primary" disabled={disabled} onClick={() => !disabled && handleShow(userRow)}>
                          <i className="bi bi-pencil" />
                        </Button>
                      </span>
                    </OverlayTrigger>
                    <OverlayTrigger overlay={<Tooltip>Excluir</Tooltip>}>
                      <span className="d-inline-block">
                        <Button 
                          size="sm" 
                          variant="outline-danger" 
                          disabled={disabled} 
                          onClick={() => {
                            console.log('🖱️ Clique no botão excluir. Disabled:', disabled, 'UserRow:', userRow);
                            if (!disabled) handleDelete(userRow.id);
                          }}
                        >
                          <i className="bi bi-trash" />
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


      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? "Editar Usuário" : "Novo Usuário"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>CPF</Form.Label>
              <Form.Control
                type="text"
                value={formData.cpf}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cpf: formatarCPF(e.target.value),
                  })
                }
              />
            </Form.Group>


            {user?.perfil === 'gestor' ? (
              <Form.Group className="mb-3">
                <Form.Label>Função</Form.Label>
                <Form.Control value="vendedor" disabled readOnly />
                <Form.Text className="text-muted">Gestores só podem criar/editar vendedores.</Form.Text>
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>Função</Form.Label>
                <Form.Select
                  value={formData.perfil}
                  onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                >
                  <option value="">Selecione um perfil</option>
                  <option value="cliente">Cliente</option>
                  <option value="admin">Admin</option>
                  <option value="gestor">Gestor</option>
                  <option value="vendedor">Vendedor</option>
                </Form.Select>
              </Form.Group>
            )}

            {user?.perfil === 'gestor' ? (
              <Form.Group className="mb-3">
                <Form.Label>Instituição</Form.Label>
                <Form.Control value={instituicoes.find(i => i.idInstituicao === user.id_instituicao)?.nomeInstituicao || ''} disabled />
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>Instituicao</Form.Label>
                <Form.Select
                  value={formData.id_instituicao}
                  onChange={(e) => setFormData({ ...formData, id_instituicao: e.target.value })}
                >
                  <option value="">Selecione a instituicao</option>
                  {instituicoes.map((instituicao) => (
                    <option key={instituicao.idInstituicao} value={instituicao.idInstituicao}>
                      {instituicao.nomeInstituicao}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}



          </Form>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!formData.nome || !formData.cpf || !formData.perfil}
          >
            Salvar
          </Button>

        </Modal.Footer>
      </Modal>
    </div>
  );
}
