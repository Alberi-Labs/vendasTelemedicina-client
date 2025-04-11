import { useEffect, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";

interface Dependente {
  id: number;
  nome: string;
  cpf: string;
  nascimento: string;
}

export default function PaginaControleDependentes() {
  const [dependentes, setDependentes] = useState<Dependente[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Dependente | null>(null);
  const [formData, setFormData] = useState({ nome: "", cpf: "", nascimento: "" });

  const buscarDependentesDoServidor = async () => {
    setLoading(true); // começa o show do spinner
    try {
      const response = await fetch("/api/dependente/consultarDependente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titularCpf: user?.cpf,
          titularNascimento: user?.dt_nascimento,
        }),
      });
  
      const responseText = await response.text();
      let result;
  
      try {
        result = JSON.parse(responseText);
      } catch (err) {
        throw new Error("Resposta não é JSON válido: " + responseText);
      }
  
      if (!response.ok) {
        throw new Error(result.error || "Erro ao buscar dependentes");
      }
  
      if (Array.isArray(result.dependentes)) {
        const dependentesFormatados = result.dependentes.map((dep: any, i: number) => ({
          id: i + 1,
          nome: dep.nome,
          cpf: dep.cpf,
          nascimento: dep.nascimento,
        }));
  
        setDependentes(dependentesFormatados);
      }
  
    } catch (error) {
      console.error("❌ Erro ao buscar dependentes:", error);
    } finally {
      setLoading(false); // para o show
    }
  };
  

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
      setDependentes((prev) => prev?.map((d) => (d.id === editing.id ? novoDependente : d)) || []);
    } else {
      setDependentes((prev) => [...(prev || []), novoDependente]);
    }

    handleClose();
  };

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
    setDependentes((prev) => prev?.filter((d) => d.id !== id) || []);
  };

  useEffect(() => {
    buscarDependentesDoServidor();
  }, []);

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
  
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando dependentes...</span>
          </div>
          <p className="mt-2">Carregando dependentes...</p>
        </div>
      ) : (
        <>
          <div className="row justify-content-center">
            {dependentes?.map((dep, index) => (
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
                    <p className="mb-3"><strong>Nascimento:</strong> {dep.nascimento}</p>
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
  
          {(dependentes?.length ?? 0) < 3 && (
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
        </>
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
