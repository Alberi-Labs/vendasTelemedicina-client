import React from 'react';
import { motion } from 'framer-motion';

export default function FooterBar() {
  return (
    <a
      href="https://wa.me/5561998565628"
      target="_blank"
      rel="noopener noreferrer"
    >
      <motion.button
        className="btn btn-warning position-fixed bottom-0 end-0 mb-4 me-4 shadow-lg"
        style={{ borderRadius: "50px", padding: "10px 20px" }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <i className="bi bi-chat-dots me-2"></i> Suporte
      </motion.button>
    </a>
  );
}
