// components/PaymentLinkPopup.tsx
import React from "react";
import { Button } from "@mui/material";

interface PaymentLinkPopupProps {
  show: boolean;
  onClose: () => void;
  paymentLink: string;
}

const PaymentLinkPopup: React.FC<PaymentLinkPopupProps> = ({ show, onClose, paymentLink }) => {
  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
        }}
        onClick={onClose}
      />
      {/* Modal Content */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          zIndex: 1000,
          borderRadius: "8px",
        }}
      >
        <button
          style={{
            position: "absolute",
            top: "5px",
            right: "5px",
            background: "transparent",
            border: "none",
            fontSize: "16px",
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          ×
        </button>
        <h4>Link Gerado!</h4>
        <p>Clique abaixo para abrir o link de pagamento:</p>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.open(paymentLink, "_blank")}
        >
          Clique aqui para abrir o link de pagamento!
        </Button>
      </div>
    </>
  );
};

export default PaymentLinkPopup;