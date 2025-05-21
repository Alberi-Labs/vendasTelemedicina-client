import { useEffect, useState } from "react";
import { Button, Modal, Form, Table } from "react-bootstrap";
import { motion } from "framer-motion";
import { Usuario } from "./api/usuario/buscarUsuario";

type Instituicao = {
  idInstituicao: number;
  nomeInstituicao: string;
};

export default function PaginaGestaoUsuario() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    role: "",
    id_instituicao: "",
  });

  useEffect(() => {
    fetchUsuarios();
    fetchInstituicoes();
  }, []);

  const fetchUsuarios = async () => {
    const res = await fetch("/api/usuario/buscarUsuario");
    const data = await res.json();
    if (data.success) {
      const adaptado = data.usuarios.map((u: any) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        cpf: u.cpf,
        perfil: u.perfil,
        id_instituicao: u.id_instituicao,
      }));
      setUsuarios(adaptado);
    }
  };

  const fetchInstituicoes = async () => {
    const res = await fetch("/api/instituicoes/buscarInstituicao");
    const data = await res.json();
    if (data.success) setInstituicoes(data.instituicoes);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({ nome: "", email: "", cpf: "", role: "", id_instituicao: "" });
  };

  const handleShow = (usuario?: Usuario) => {
    if (usuario) {
      setEditing(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        role: usuario.perfil.toLowerCase(),
        id_instituicao: usuario.id_instituicao?.toString() ?? "",
      });
    } else {
      setFormData({ nome: "", email: "", cpf: "", role: "", id_instituicao: "" });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      nome: formData.nome,
      email: formData.email,
      perfil: formData.role,
      telefone: "",
      imagem: null,
      cpf: formData.cpf,
      creditos: 0,
      data_nascimento: null,
      id_instituicao: parseInt(formData.id_instituicao),
    };

    const isEditando = !!editing;

    const res = await fetch(
      isEditando ? "/api/usuario/editarUsuario" : "/api/usuario/cadastrarClienteUsuario",
      {
        method: isEditando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditando ? { id: editing.id, ...payload } : payload),
      }
    );

    if (res.ok) {
      fetchUsuarios();
      handleClose();
    } else {
      console.error("Erro ao salvar usuário");
    }
  };


  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    const res = await fetch(`/api/usuario/deletarUsuario?idUsuario=${id}`, {
      method: "DELETE",
    });

    if (res.ok) fetchUsuarios();
  };

  function formatarCPF(cpf: string) {
    const apenasNumeros = cpf.replace(/\D/g, "").slice(0, 11);
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (match, p1, p2, p3, p4) => {
      return `${p1}.${p2}.${p3}${p4 ? `-${p4}` : ""}`;
    });
  }


  return (
    <div className="container py-5">
      <motion.h2 className="text-center mb-5 fw-bold">Gestão de Usuários</motion.h2>
      <div className="mb-3 text-end">
        <Button variant="success" onClick={() => handleShow()}>
          <i className="bi bi-person-plus me-2"></i>Adicionar Usuário
        </Button>
      </div>
      <Table striped bordered hover responsive>
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
          {usuarios.map((user) => {
            const empresaDoUsuario = instituicoes.find((e) => e.idInstituicao === user.id_instituicao);

            return (
              <tr key={user.id}>
                <td>{user.nome}</td>
                <td>{user.email}</td>
                <td>{user.cpf}</td>
                <td>{user.perfil}</td>
                <td>{empresaDoUsuario?.nomeInstituicao || "Não vinculada"}</td> {/* NOVO */}
                <td>
                  <Button size="sm" variant="outline-primary" onClick={() => handleShow(user)}>
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="ms-2"
                    onClick={() => handleDelete(user.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
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


            <Form.Group className="mb-3">
              <Form.Label>Função</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="">Selecione um perfil</option>
                <option value="cliente">Cliente</option>
                <option value="admin">Admin</option>
                <option value="gestor">Gestor</option>
                <option value="vendedor">Vendedor</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
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
          </Form>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!formData.nome || !formData.email || !formData.cpf || !formData.role}
          >
            Salvar
          </Button>

        </Modal.Footer>
      </Modal>
    </div>
  );
}
