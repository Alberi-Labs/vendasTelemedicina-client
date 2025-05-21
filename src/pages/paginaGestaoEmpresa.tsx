import { useEffect, useState } from "react";
import { Button, Modal, Form, Table } from "react-bootstrap";
import { motion } from "framer-motion";

type Instituicao = {
  idInstituicao: number;
  nomeInstituicao: string;
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
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Instituicao | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    nomeInstituicao: string;
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
    nomeInstituicao: "",
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
    fetchInstituicoes();
  }, []);

  const fetchInstituicoes = async () => {
    try {
      const res = await fetch("/api/instituicoes/buscarEmpresa");
      const data = await res.json();
      if (data.success) {
        setInstituicoes(data.instituicoes);
      }
    } catch (error) {
      console.error("Erro ao buscar instituicoes:", error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditing(null);
    setPreviewImagem(null);
    setFormData({
      nomeInstituicao: "",
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
  
  const handleShow = (instituicao?: Instituicao) => {
    if (instituicao) {
      setEditing(instituicao);
      setFormData({
        nomeInstituicao: instituicao.nomeInstituicao,
        nomeFantasia: instituicao.nomeFantasia,
        email: instituicao.email,
        cnpj: instituicao.cnpj,
        celular: instituicao.celular,
        cep: instituicao.cep,
        endereco: instituicao.endereco,
        uf: instituicao.uf,
        cidade: instituicao.cidade,
        ativo: instituicao.ativo ?? false,
        valor_plano: instituicao.valor_plano ?? 0,
        imagem_perfil: null,
      });
      setPreviewImagem(instituicao.imagem_perfil ?? null);
    } else {
      handleClose();
    }
    setShowModal(true);
  };
  

  const handleSave = async () => {
    const form = new FormData();
    if (editing) form.append("idInstituicao", editing.idInstituicao.toString());
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "imagem_perfil") {
        if (value instanceof File) form.append("imagem_perfil", value);
      } else {
        form.append(key, String(value));
      }
    });

    try {
        const res = await fetch(editing ? "/api/instituicoes/editarEmpresa" : "/api/instituicoes/criarEmpresa", {
            method: editing ? "PUT" : "POST",
        body: form,
      });

      if (res.ok) {
        fetchInstituicoes();
        handleClose();
      } else {
        console.error("Erro ao salvar instituicao");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleDelete = async (idInstituicao: number) => {
    if (!confirm("Tem certeza que deseja excluir esta instituicao?")) return;
    try {
      const res = await fetch(`/api/instituicao/deletarEmpresa?id=${idInstituicao}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchInstituicoes();
      } else {
        console.error("Erro ao deletar instituicao");
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
          <i className="bi bi-building-add me-2"></i>Adicionar Instituicao
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
            {instituicoes.map((instituicao, index) => (
              <motion.tr
                key={instituicao.idInstituicao}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <td>{instituicao.nomeInstituicao}</td>
                <td>{instituicao.email}</td>
                <td>{instituicao.ativo ? "Sim" : "Não"}</td>
                <td>
  R$ {instituicao.valor_plano != null ? parseFloat(instituicao.valor_plano as any).toFixed(2) : "0,00"}
</td>
                <td>
                  {instituicao.imagem_perfil ? (
                    <img
                      src={instituicao.imagem_perfil}
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
                    onClick={() => handleShow(instituicao)}
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(instituicao.idInstituicao)}
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
          <Modal.Title>{editing ? "Editar Instituicao" : "Nova Instituicao"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {[
              "nomeInstituicao", "nomeFantasia", "email", "cnpj", "celular",
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
                label="Instituicao Ativa"
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
            disabled={!formData.nomeInstituicao || !formData.email}
          >
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
