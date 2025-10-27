// components/PaymentLinkPopup.tsx
import React from "react";
import { Button, Box, Typography, IconButton } from "@mui/material";

interface PaymentLinkPopupProps {
  show: boolean;
  onClose: () => void;
  paymentLink: string;
}

const PaymentLinkPopup: React.FC<PaymentLinkPopupProps> = ({ show, onClose, paymentLink }) => {
  if (!show) return null;

  return (
    <>
      {/* Overlay com animação */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 999,
          animation: "fadeIn 0.3s ease-in-out",
        }}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          zIndex: 1000,
          width: { xs: "90%", sm: "500px" },
          maxWidth: "500px",
          animation: "slideIn 0.3s ease-out",
          overflow: "hidden",
        }}
      >
        {/* Header com ícone de fechar */}
        <Box 
          sx={{ 
            position: "relative", 
            background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
            color: "white",
            p: 3,
            textAlign: "center"
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "white",
              fontSize: "24px",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" }
            }}
          >
            ✕
          </IconButton>
          
          <Typography variant="h4" fontWeight="bold">
            Assinatura Criada!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Sua assinatura de 12 meses foi criada com sucesso
          </Typography>
        </Box>

        {/* Conteúdo principal */}
        <Box sx={{ p: 4 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              textAlign: "center", 
              mb: 3,
              color: "#666",
              fontSize: "1.1rem"
            }}
          >
            Clique no botão abaixo para acessar a página de pagamento:
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => window.open(paymentLink, "_blank")}
            sx={{
              py: 2,
              fontSize: "1.1rem",
              fontWeight: "bold",
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              borderRadius: "12px",
              textTransform: "none",
              boxShadow: "0 8px 20px rgba(33, 150, 243, 0.3)",
              "&:hover": {
                background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
                boxShadow: "0 12px 25px rgba(33, 150, 243, 0.4)",
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease"
            }}
          >
            💳 Abrir Link de Pagamento
          </Button>

          {/* Informação adicional */}
          <Box 
            sx={{ 
              mt: 3, 
              p: 2, 
              backgroundColor: "#f8f9fa", 
              borderRadius: "12px",
              borderLeft: "4px solid #FF9800"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Box sx={{ color: "#FF9800", mr: 1, fontSize: "20px" }}>⏰</Box>
              <Typography variant="body2" fontWeight="bold" color="#FF9800">
                Importante
              </Typography>
            </Box>
            <Typography variant="body2" color="#666">
              Após a confirmação do primeiro pagamento, sua assinatura de 12 meses 
              será ativada automaticamente com cobrança mensal recorrente. 
              Aguarde até 24 horas para acessar nosso portal!
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* CSS para animações */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translate(-50%, -60%);
            scale: 0.9;
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%);
            scale: 1;
          }
        }
      `}</style>
    </>
  );
};

export default PaymentLinkPopup;