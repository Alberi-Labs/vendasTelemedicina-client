import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

interface AssinaturaDigitalProps {
  show: boolean;
  onHide: () => void;
  onAssinar: (assinatura: string) => void;
  nomeUsuario: string;
}

const AssinaturaDigital: React.FC<AssinaturaDigitalProps> = ({
  show,
  onHide,
  onAssinar,
  nomeUsuario
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [assinaturaValida, setAssinaturaValida] = useState(false);

  useEffect(() => {
    if (show && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Configurar canvas
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Adicionar fundo branco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        setAssinaturaValida(false);
      }
    }
  }, [show]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        setAssinaturaValida(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const limparAssinatura = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setAssinaturaValida(false);
      }
    }
  };

  const confirmarAssinatura = () => {
    const canvas = canvasRef.current;
    if (canvas && assinaturaValida) {
      const assinaturaBase64 = canvas.toDataURL('image/png');
      onAssinar(assinaturaBase64);
    }
  };

  // Suporte para touch (mobile)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvasRef.current?.dispatchEvent(mouseEvent);
    setIsDrawing(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.stroke();
        setAssinaturaValida(true);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Assinatura Digital do Contrato</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-3">
          <h5>Olá, {nomeUsuario}!</h5>
          <p className="text-muted">
            Após ler e revisar seu contrato, confirme sua concordância assinando digitalmente no campo abaixo.
          </p>
          <div className="alert alert-info" perfil="alert">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Importante:</strong> Certifique-se de ter lido todo o contrato antes de assinar.
          </div>
        </div>
        
        <div className="d-flex justify-content-center mb-3">
          <div 
            style={{ 
              border: '2px solid #ddd', 
              borderRadius: '8px',
              backgroundColor: '#fff',
              position: 'relative'
            }}
          >
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              style={{ 
                cursor: 'crosshair',
                display: 'block',
                borderRadius: '6px'
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            <div 
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                fontSize: '12px',
                color: '#999',
                pointerEvents: 'none'
              }}
            >
              Assine aqui
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            variant="outline-secondary" 
            onClick={limparAssinatura}
            className="me-3"
          >
            Limpar Assinatura
          </Button>
          <Button 
            variant="success" 
            onClick={confirmarAssinatura}
            disabled={!assinaturaValida}
          >
            Confirmar Assinatura
          </Button>
        </div>

        <div className="mt-3">
          <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
            <h6 className="text-primary mb-2">
              <i className="bi bi-shield-check me-2"></i>
              Declaração de Concordância
            </h6>
            <small className="text-dark">
              Ao assinar digitalmente este documento, eu, <strong>{nomeUsuario}</strong>, declaro que:
            </small>
            <ul className="small text-dark mt-2 mb-0" style={{ fontSize: '0.85rem' }}>
              <li>Li e compreendi todos os termos e condições do contrato</li>
              <li>Concordo integralmente com as cláusulas apresentadas</li>
              <li>Estou ciente de que esta assinatura tem validade jurídica</li>
              <li>Autorizo a prestação dos serviços conforme especificado</li>
            </ul>
          </div>
          
          <small className="text-muted">
            <strong>Nota Legal:</strong> A assinatura digital possui a mesma validade jurídica que uma assinatura manuscrita, 
            conforme estabelecido pela Lei nº 14.063/2020 e MP 2.200-2/2001.
          </small>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default AssinaturaDigital;
