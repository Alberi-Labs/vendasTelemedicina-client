import { Modal, Button, Table } from "react-bootstrap";

interface ConferenciaPopupProps {
  show: boolean;
  onHide: () => void;
  pessoas: { nome: string; cpf: string; nascimento: string; uf: string; genero: string }[];
  onConfirm: () => void;
}

export default function ConferenciaPopup({ show, onHide, pessoas, onConfirm }: ConferenciaPopupProps) {
  const totalVidas = pessoas.length;
  const valorTotal = totalVidas * 100; // Defina manualmente no código

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Conferência de Dados</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Data de Nascimento</th>
              <th>UF</th>
              <th>Genero</th>
            </tr>
          </thead>
          <tbody>
            {pessoas.map((pessoa, index) => (
              <tr key={index}>
                <td>{pessoa.nome}</td>
                <td>{pessoa.cpf}</td>
                <td>{pessoa.nascimento}</td>
                <td>{pessoa.uf}</td>
                <td>{pessoa.genero}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <h5 className="text-center mt-3">Total de Vidas: {totalVidas}</h5>
        <h5 className="text-center text-success">Valor Total: R$ {valorTotal},00</h5>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={onHide}>Cancelar</Button>
        <Button variant="success" onClick={onConfirm}>Confirmar Venda</Button>
      </Modal.Footer>
    </Modal>
  );
}
