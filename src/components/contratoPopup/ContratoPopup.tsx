import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';

interface ContratoPopupProps {
  show: boolean;
  onHide: () => void;
  onAssinar: () => void;
  onBaixarSemAssinar: () => void;
  dadosContrato: any;
  contratoAssinado: boolean;
  loading?: boolean;
}

const ContratoPopup: React.FC<ContratoPopupProps> = ({
  show,
  onHide,
  onAssinar,
  onBaixarSemAssinar,
  dadosContrato,
  contratoAssinado,
  loading = false
}) => {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [contractData, setContractData] = useState<string | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && dadosContrato) {
      carregarVisualizacaoContrato();
    }
  }, [show, dadosContrato]);

  const carregarVisualizacaoContrato = async () => {
    setLoadingContract(true);
    setError(null);
    setScrolledToBottom(false);
    
    try {
      const response = await fetch("/api/contrato/visualizarContratoVita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosContrato),
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar visualização do contrato");
      }

      const data = await response.json();
      
      if (data.success) {
        if (data.contractData) {
          setContractData(data.contractData);
        } else {
          setError(data.message || "Visualização não disponível neste ambiente");
        }
      } else {
        setError("Erro ao processar contrato");
      }
    } catch (err) {
      console.error("Erro ao carregar contrato:", err);
      setError("Erro ao carregar visualização do contrato");
    } finally {
      setLoadingContract(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLIFrameElement>) => {
    const iframe = e.target as HTMLIFrameElement;
    try {
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDocument) {
        const scrollTop = iframeDocument.documentElement.scrollTop || iframeDocument.body.scrollTop;
        const scrollHeight = iframeDocument.documentElement.scrollHeight || iframeDocument.body.scrollHeight;
        const clientHeight = iframeDocument.documentElement.clientHeight || iframe.clientHeight;
        
        // Considerar como "final" quando estiver a 50px do fim
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
        setScrolledToBottom(isAtBottom);
      }
    } catch (error) {
      // Se não conseguir acessar o conteúdo do iframe (CORS), assumir que pode prosseguir
      setScrolledToBottom(true);
    }
  };

  // Resetar estado quando o modal abrir
  React.useEffect(() => {
    if (show) {
      setScrolledToBottom(false);
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-file-earmark-text me-2"></i>
          Contrato Vita
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: 0 }}>
        {(loading || loadingContract) ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="text-muted">Carregando contrato...</p>
            </div>
          </div>
        ) : error ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <Alert variant="warning" className="m-3 text-center">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <div className="mt-2">
                <small>Você ainda pode baixar o contrato usando o botão "Baixar sem Assinar".</small>
              </div>
            </Alert>
          </div>
        ) : (
          <>
            <div style={{ height: '60vh', border: '1px solid #ddd' }}>
              {contractData ? (
                <iframe
                  src={contractData}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  title="Visualizar Contrato"
                  onLoad={() => {
                    // Tentar detectar scroll no iframe
                    const iframe = document.querySelector('iframe');
                    if (iframe?.contentWindow) {
                      try {
                        iframe.contentWindow.addEventListener('scroll', () => {
                          handleScroll({ target: iframe } as any);
                        });
                      } catch (error) {
                        // Fallback se não conseguir acessar o conteúdo
                        setTimeout(() => setScrolledToBottom(true), 3000);
                      }
                    }
                  }}
                />
              ) : (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <Alert variant="info" className="m-3">
                    <i className="bi bi-info-circle me-2"></i>
                    Carregando visualização do contrato...
                  </Alert>
                </div>
              )}
            </div>
            
            {!contratoAssinado && !scrolledToBottom && contractData && (
              <div className="alert alert-warning mx-3 mt-3 mb-0" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Atenção:</strong> Role até o final do documento para habilitar as opções de assinatura.
              </div>
            )}
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer className="d-flex justify-content-between">
        <div>
          <Button variant="outline-secondary" onClick={onHide}>
            Fechar
          </Button>
        </div>
        
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={onBaixarSemAssinar}
            className="d-inline-flex align-items-center gap-2"
          >
            <i className="bi bi-download"></i>
            Baixar sem Assinar
          </Button>
          
          {!contratoAssinado && (
            <Button 
              variant="success" 
              onClick={onAssinar}
              disabled={!scrolledToBottom && !!contractData}
              className="d-inline-flex align-items-center gap-2"
            >
              <i className="bi bi-pen"></i>
              {scrolledToBottom || !contractData ? 'Assinar Contrato' : 'Leia o contrato completo'}
            </Button>
          )}
          
          {contratoAssinado && (
            <div className="d-flex align-items-center text-success">
              <i className="bi bi-check-circle-fill me-2"></i>
              <strong>Contrato já assinado</strong>
            </div>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ContratoPopup;
