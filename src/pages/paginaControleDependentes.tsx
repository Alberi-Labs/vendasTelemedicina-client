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
  const [loading, setLoading] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Dependente | null>(null);
  const [formData, setFormData] = useState({ nome: "", cpf: "", nascimento: "" });

  const buscarDependentesDoServidor = async () => {
    setLoading(true);
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
        setErroBusca("⚠️ Resposta inválida do servidor (não é JSON).");
        return;
      }

      if (!response.ok) {
        setErroBusca(result?.error || "⚠️ Erro ao buscar dependentes do servidor.");
        return;
      }

      if (Array.isArray(result.dependentes)) {
        const dependentesFormatados = result.dependentes.map((dep: any, i: number) => ({
          id: i + 1,
          nome: dep.nome,
          cpf: dep.cpf,
          nascimento: dep.nascimento,
        }));

        setDependentes(dependentesFormatados);
      } else {
        setDependentes([]);
      }

    } catch (error: any) {
      console.error("❌ Erro ao buscar dependentes:", error);
      setErroBusca("❌ Erro ao buscar dependentes: " + error.message);
    } finally {
      setLoading(false);
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

  const handleSave = async () => {
    if (!formData.nascimento || !formData.nome || !formData.cpf) return;

    const novoDependente: Dependente = {
      id: editing ? editing.id : Date.now(),
      nome: formData.nome,
      cpf: formData.cpf,
      nascimento: formData.nascimento,
    };

    if (editing) {
      setDependentes((prev) =>
        prev?.map((d) => (d.id === editing.id ? novoDependente : d)) || []
      );
    } else {
      try {
        console.log(user)
        const response = await fetch("/api/dependente/cadastrarSulamerica", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nomeDependente: formData.nome,
            cpfDependente: formData.cpf,
            nascimentoDependente: formData.nascimento,
            cpfTitular: user?.cpf,
            nascimentoTitular: user?.dt_nascimento,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error("❌ Erro ao cadastrar dependente:", result.error);
          alert("Erro ao cadastrar dependente na SulAmérica: " + result.error);
          return;
        }
        await cadastrarBanco(novoDependente);

        console.log("✅ Dependente cadastrado com sucesso!");
      } catch (error: any) {
        console.error("❌ Erro ao chamar a API de cadastro:", error);
        alert("Erro ao cadastrar dependente: " + error.message);
        return;
      }

      setDependentes((prev) => [...(prev || []), novoDependente]);
    }

    handleClose();
  };

  const handleDelete = (id: number) => {
    setDependentes((prev) => prev?.filter((d) => d.id !== id) || []);
  };

  const cadastrarBanco = async (dependente: Dependente) => {
    try {
      const response = await fetch("/api/dependente/cadastrarBanco", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cpf: dependente.cpf,
          nascimento: dependente.nascimento,
          nome: dependente.nome,
          cpfTitular: user?.cpf,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("❌ Erro ao cadastrar no banco:", result.error);
        alert("Erro ao cadastrar dependente no banco: " + result.error);
      } else {
        console.log("✅ Cadastro no banco realizado com sucesso!");
      }
    } catch (err: any) {
      console.error("❌ Erro ao chamar cadastrarBanco:", err);
      alert("Erro ao cadastrar banco: " + err.message);
    }
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
      ) : erroBusca ? (
        <div className="text-center text-danger fw-bold">Erro ao buscar dependentes</div>
      ) : (
        <>
          {dependentes?.length === 0 && (
            <div className="text-center text-muted fw-semibold mb-4">
              Nenhum dependente encontrado!
            </div>
          )}

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

          {(dependentes === null || dependentes.length < 3) && (
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
                onChange={(e) => setFormData({ ...formData, nascimento: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>CPF</Form.Label>
              <Form.Control
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
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
