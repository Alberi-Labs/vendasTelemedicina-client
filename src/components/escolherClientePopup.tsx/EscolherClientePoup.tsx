import React from "react";
import { Modal, Button, Form } from "react-bootstrap";

interface EscolherClientePopupProps {
  show: boolean;
  onClose: () => void;
  empresas: { idEmpresa: number; nomeEmpresa: string }[];
  onSelect: (id: string) => void;
}

const EscolherClientePopup: React.FC<EscolherClientePopupProps> = ({ show, onClose, empresas, onSelect }) => {
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSelect(e.target.value);
    onClose(); 
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Escolher Cliente</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Select onChange={handleSelect}>
          <option value="">Selecione um cliente</option>
          {empresas.map((empresa) => (
            <option key={empresa.idEmpresa} value={empresa.idEmpresa}>
              {empresa.nomeEmpresa}
            </option>
          ))}
        </Form.Select>
      </Modal.Body>
      <Modal.Footer>
      <a>Caso não encontre a empresa desejada, por favor realizar o cadastro na pagína anterior!</a>
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EscolherClientePopup;
