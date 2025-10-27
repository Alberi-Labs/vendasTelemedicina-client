'use client';

import { useState } from "react";

export default function UploadApolices() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setStatus("Nenhum arquivo selecionado.");
      return;
    }

    setStatus("Enviando arquivo...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/apolices/inserirApolices", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok) {
        setStatus(json.message || "Upload concluído com sucesso.");
      } else {
        setStatus(`Erro: ${json.error || "Falha ao processar o PDF."}`);
      }
    } catch (error: any) {
      console.error("Erro:", error);
      setStatus("Erro ao enviar o arquivo.");
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">Importar Apólices</h2>
      <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button className="btn btn-primary mt-3" onClick={handleUpload}>Processar e Enviar</button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
