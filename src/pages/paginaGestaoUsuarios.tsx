import { useEffect, useState } from "react";
import { Button, Modal, Form, Table } from "react-bootstrap";
import { motion } from "framer-motion";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf:string;
  role: string;
}

export default function PaginaGestaoUsuario() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({ nome: "", email: "", cpf:"",role: "" });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuario/buscarUsuario");
      const data = await res.json();
      if (data.success) {
        const adaptado = data.usuarios.map((u: any) => ({
          id: u.id,
          nome: u.nome,
          email: u.email,
          cpf:u.cpf,
          role: u.perfil,
        }));
        setUsuarios(adaptado);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({ nome: "", email: "", cpf: "", role: "" });
  };

  const handleShow = (usuario?: Usuario) => {
    if (usuario) {
      setEditing(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        cpf:usuario.cpf,
        role: usuario.role.toLowerCase(),
      });
    } else {
      setFormData({ nome: "", email: "", cpf: "", role: "" });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      id: editing?.id,
      nome: formData.nome,
      email: formData.email,
      perfil: formData.role,
      telefone: "", // Adapte se quiser coletar
      imagem: null,
      cpf: "",
      creditos: 0,
      data_nascimento: null,
      id_empresa: 1,
    };

    try {
      const res = await fetch("/api/usuario/editarUsuario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchUsuarios();
        handleClose();
      } else {
        console.error("Erro ao salvar usuário");
      }
    } catch (error) {
      console.error("Erro ao editar:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const res = await fetch(`/api/usuario/deletarUsuario?idUsuario=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUsuarios();
      } else {
        console.error("Erro ao deletar usuário");
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  return (
    <div className="container py-5">
      <motion.h2
        className="text-center mb-5 fw-bold"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Gestão de Usuários
      </motion.h2>

      <div className="mb-3 text-end">
        <Button variant="success" onClick={() => handleShow()}>
          <i className="bi bi-person-plus me-2"></i>Adicionar Usuário
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Table striped bordered hover responsive className="shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Cpf</th>
              <th>Função</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user, index) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <td>{user.nome}</td>
                <td>{user.email}</td>
                <td>{user.cpf}</td>
                <td>{user.role}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShow(user)}
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </Table>
      </motion.div>

      {/* Modal */}
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
            <Form.Group>
  <Form.Label>Função</Form.Label>
  <Form.Select
    value={formData.role.toLowerCase()} // garante seleção correta mesmo se vier em maiúscula ou minúscula
    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
  >
    <option value="">Selecione um perfil</option>
    <option value="cliente">Cliente</option>
    <option value="admin">Admin</option>
    <option value="gestor">Gestor</option>
    <option value="vendedor">Vendedor</option>
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
            disabled={!formData.nome || !formData.email || !formData.role}
          >
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
