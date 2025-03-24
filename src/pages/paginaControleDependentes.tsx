import { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { motion } from "framer-motion";

interface Dependente {
  id: number;
  nome: string;
  cpf: string;
  nascimento: string;
}

export default function PaginaControleDependentes() {
  const [dependentes, setDependentes] = useState<Dependente[]>([
    { id: 1, nome: "Lucas Santos", cpf: "123.456.789-00", nascimento: "2011-04-10" },
    { id: 2, nome: "Joana Lima", cpf: "987.654.321-00", nascimento: "2015-09-25" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Dependente | null>(null);
  const [formData, setFormData] = useState({ nome: "", cpf: "", nascimento: "" });

  const handleClose = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({ nome: "", cpf: "", nascimento: "" });
  };

  const handleShow = (dependente?: Dependente) => {
    if (dependente) {
      setEditing(dependente);
      setFormData({
        nome: dependente.nome,
        cpf: dependente.cpf,
        nascimento: dependente.nascimento,
      });
    } else {
      setFormData({ nome: "", cpf: "", nascimento: "" });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.nascimento) return;

    const novoDependente: Dependente = {
      id: editing ? editing.id : Date.now(),
      nome: formData.nome,
      cpf: formData.cpf,
      nascimento: formData.nascimento,
    };

    if (editing) {
      setDependentes((prev) =>
        prev.map((d) => (d.id === editing.id ? novoDependente : d))
      );
    } else {
      setDependentes((prev) => [...prev, novoDependente]);
    }

    handleClose();
  };

  // Simulação de preenchimento automático com base na data de nascimento
  const handleNascimentoChange = (value: string) => {
    let nome = "";
    let cpf = "";

    if (value === "2010-01-01") {
      nome = "Carlos Junior";
      cpf = "111.111.111-11";
    } else if (value === "2012-06-15") {
      nome = "Marina Silva";
      cpf = "222.222.222-22";
    } else if (value === "2014-12-30") {
      nome = "Beatriz Souza";
      cpf = "333.333.333-33";
    }

    setFormData({ nome, cpf, nascimento: value });
  };

  const handleDelete = (id: number) => {
    setDependentes((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="container py-5">
      <motion.h2
        className="text-center mb-5 fw-bold"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Gestão de Dependentes
      </motion.h2>

      <div className="row justify-content-center">
        {dependentes.map((dep, index) => (
          <motion.div
            key={dep.id}
            className="col-12 col-md-6 col-lg-4 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            <div className="card shadow border-0 h-100">
              <div className="card-body">
                <h5 className="fw-semibold">{dep.nome}</h5>
                <p className="mb-1"><strong>CPF:</strong> {dep.cpf}</p>
                <p className="mb-3"><strong>Nascimento:</strong> {new Date(dep.nascimento).toLocaleDateString()}</p>
                <div className="d-flex justify-content-end gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => handleShow(dep)}>
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(dep.id)}>
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {dependentes.length < 3 && (
        <motion.div
          className="text-center mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button variant="success" size="lg" onClick={() => handleShow()}>
            <i className="bi bi-person-plus me-2"></i> Adicionar Dependente
          </Button>
        </motion.div>
      )}

      {/* Modal */}
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? "Editar Dependente" : "Novo Dependente"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Data de Nascimento</Form.Label>
              <Form.Control
                type="date"
                value={formData.nascimento}
                onChange={(e) => handleNascimentoChange(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control type="text" value={formData.nome} readOnly />
            </Form.Group>
            <Form.Group>
              <Form.Label>CPF</Form.Label>
              <Form.Control type="text" value={formData.cpf} readOnly />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={!formData.nome}>Salvar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
