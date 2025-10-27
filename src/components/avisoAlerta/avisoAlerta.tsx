import { useEffect, useState } from "react";
import { Toast, ToastContainer, ProgressBar } from "react-bootstrap";

interface AvisoAlertaProps {
  mensagem: string;
  tipo?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";
  duracao?: number;
  onClose?: () => void;
  offsetTop?: number;
}

export default function AvisoAlerta({ mensagem, tipo = "danger", duracao = 5000, onClose, offsetTop = 0 }: AvisoAlertaProps) {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (mensagem) {
      setShow(false);
      setTimeout(() => setShow(true), 50);
      setProgress(100);

      const interval = setInterval(() => {
        setProgress((prev) => Math.max(prev - 100 / (duracao / 100), 0));
      }, 100);

      const timer = setTimeout(() => {
        setShow(false);
        if (onClose) onClose();
      }, duracao);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [mensagem, duracao, onClose]);

  return (
    <ToastContainer position="top-end" className="p-3" style={{ top: offsetTop }}>
      <Toast
        bg={tipo}
        show={show}
        onClose={() => setShow(false)}
        autohide
        delay={duracao}
        className="animate__animated animate__fadeInDown"
      >
        <Toast.Header>
          <strong className="me-auto">{tipo === "success" ? "✅ Sucesso" : "⚠️ Aviso"}</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{mensagem}</Toast.Body>
        <ProgressBar now={progress} variant={tipo} className="rounded-0" style={{ height: "3px" }} />
      </Toast>
    </ToastContainer>
  );
}
