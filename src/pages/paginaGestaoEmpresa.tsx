import { useEffect, useState } from "react";
import { Button, Modal, Form, Table } from "react-bootstrap";
import { motion } from "framer-motion";

type Empresa = {
  idEmpresa: number;
  nomeEmpresa: string;
  nomeFantasia: string;
  email: string;
  cnpj: string;
  celular: string;
  cep: string;
  endereco: string;
  uf: string;
  cidade: string;
  createdAt: string;
  ativo: boolean | null;
  valor_plano: number | null;
  imagem_perfil?: string | null;
};

export default function PaginaGestaoEmpresa() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    nomeEmpresa: string;
    nomeFantasia: string;
    email: string;
    cnpj: string;
    celular: string;
    cep: string;
    endereco: string;
    uf: string;
    cidade: string;
    ativo: boolean;
    valor_plano: number;
    imagem_perfil: File | null;
  }>({
    nomeEmpresa: "",
    nomeFantasia: "",
    email: "",
    cnpj: "",
    celular: "",
    cep: "",
    endereco: "",
    uf: "",
    cidade: "",
    ativo: true,
    valor_plano: 0,
    imagem_perfil: null,
  });

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const res = await fetch("/api/empresas/buscarEmpresa");
      const data = await res.json();
      if (data.success) {
        setEmpresas(data.empresas);
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
    }
  };

  console.log("Empresas:", empresas); // Log para verificar os dados retornados
  const handleClose = () => {
    setShowModal(false);
    setEditing(null);
    setPreviewImagem(null);
    setFormData({
      nomeEmpresa: "",
      nomeFantasia: "",
      email: "",
      cnpj: "",
      celular: "",
      cep: "",
      endereco: "",
      uf: "",
      cidade: "",
      ativo: true,
      valor_plano: 0,
      imagem_perfil: null,
    });
  };
  
  const handleShow = (empresa?: Empresa) => {
    if (empresa) {
      setEditing(empresa);
      setFormData({
        nomeEmpresa: empresa.nomeEmpresa,
        nomeFantasia: empresa.nomeFantasia,
        email: empresa.email,
        cnpj: empresa.cnpj,
        celular: empresa.celular,
        cep: empresa.cep,
        endereco: empresa.endereco,
        uf: empresa.uf,
        cidade: empresa.cidade,
        ativo: empresa.ativo ?? false,
        valor_plano: empresa.valor_plano ?? 0,
        imagem_perfil: null,
      });
      setPreviewImagem(empresa.imagem_perfil ?? null);
    } else {
      handleClose();
    }
    setShowModal(true);
  };
  

  const handleSave = async () => {
    const form = new FormData();
    if (editing) form.append("idEmpresa", editing.idEmpresa.toString());
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "imagem_perfil") {
        if (value instanceof File) form.append("imagem_perfil", value);
      } else {
        form.append(key, String(value));
      }
    });

    try {
        const res = await fetch(editing ? "/api/empresas/editarEmpresa" : "/api/empresas/criarEmpresa", {
            method: editing ? "PUT" : "POST",
        body: form,
      });

      if (res.ok) {
        fetchEmpresas();
        handleClose();
      } else {
        console.error("Erro ao salvar empresa");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleDelete = async (idEmpresa: number) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;
    try {
      const res = await fetch(`/api/empresa/deletarEmpresa?id=${idEmpresa}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchEmpresas();
      } else {
        console.error("Erro ao deletar empresa");
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
        Gestão de Empresas
      </motion.h2>

      <div className="mb-3 text-end">
        <Button variant="success" onClick={() => handleShow()}>
          <i className="bi bi-building-add me-2"></i>Adicionar Empresa
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
              <th>Ativo</th>
              <th>Valor do Plano</th>
              <th>Imagem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((empresa, index) => (
              <motion.tr
                key={empresa.idEmpresa}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <td>{empresa.nomeEmpresa}</td>
                <td>{empresa.email}</td>
                <td>{empresa.ativo ? "Sim" : "Não"}</td>
                <td>
  R$ {empresa.valor_plano != null ? parseFloat(empresa.valor_plano as any).toFixed(2) : "0,00"}
</td>
                <td>
                  {empresa.imagem_perfil ? (
                    <img
                      src={empresa.imagem_perfil}
                      alt="Logo"
                      width={40}
                      height={40}
                    />
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShow(empresa)}
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(empresa.idEmpresa)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </Table>
      </motion.div>

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? "Editar Empresa" : "Nova Empresa"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {[
              "nomeEmpresa", "nomeFantasia", "email", "cnpj", "celular",
              "cep", "endereco", "uf", "cidade"
            ].map((field) => (
              <Form.Group className="mb-3" key={field}>
                <Form.Label>{field}</Form.Label>
                <Form.Control
                  type="text"
                  value={(formData as any)[field]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                />
              </Form.Group>
            ))}

            <Form.Group className="mb-3">
              <Form.Label>Valor do Plano</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={0.01}
                value={formData.valor_plano}
                onChange={(e) =>
                  setFormData({ ...formData, valor_plano: parseFloat(e.target.value) })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Empresa Ativa"
                checked={formData.ativo}
                onChange={(e) =>
                  setFormData({ ...formData, ativo: e.target.checked })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Imagem de Perfil</Form.Label>
              <Form.Control
  type="file"
  accept="image/*"
  onChange={(e) => {
    const fileInput = e.target as HTMLInputElement;
    const file = fileInput.files?.[0] ?? null;

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImagem(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImagem(null);
    }

    setFormData({ ...formData, imagem_perfil: file });
  }}
/>

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
            disabled={!formData.nomeEmpresa || !formData.email}
          >
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
