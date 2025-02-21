import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

interface EmpresaForm {
  idEmpresa?: string;
  nomeEmpresa: string;
  nomeFantasia: string;
  email: string;
  cnpj: string;
  celular: string;
  cep: string;
  endereco: string;
  uf: string;
  cidade: string;
}


interface CadastroEmpresaProps {
  isOpen: boolean;
  onClose: () => void;
  onEmpresaCadastrada: (novaEmpresa: EmpresaForm) => void;
}

export default function CadastroEmpresa({ isOpen, onClose, onEmpresaCadastrada }: CadastroEmpresaProps) {
  const [form, setForm] = useState<EmpresaForm>({
    nomeEmpresa: "",
    nomeFantasia: "",
    email: "",
    cnpj: "",
    celular: "",
    cep: "",
    endereco: "",
    uf: "",
    cidade: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/cadastroEmpresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Erro ao cadastrar empresa");
      }

      const novaEmpresa = await response.json();
      onEmpresaCadastrada(novaEmpresa);
      onClose();
    } catch (error) {
      alert("Erro ao cadastrar empresa");
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>Cadastro de Empresa</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control name="nomeEmpresa" placeholder="Nome da Empresa" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control name="nomeFantasia" placeholder="Nome Fantasia" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control type="email" name="email" placeholder="Email" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control name="cnpj" placeholder="CNPJ" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control name="celular" placeholder="Celular" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control name="cep" placeholder="CEP" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control name="endereco" placeholder="Endereço" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control name="cidade" placeholder="Cidade" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control name="uf" placeholder="Estado (Ex: São Paulo)" onChange={handleChange} required />
          </Form.Group>
          <Button variant="primary" type="submit">
            Cadastrar
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
