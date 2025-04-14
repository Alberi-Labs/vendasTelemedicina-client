import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "react-bootstrap";
import { useAuth } from "@/app/context/AuthContext";

type Apolice = {
  link: string;
  dataCadastro: string;
};

export default function PaginaApolice() {
  const [isMounted, setIsMounted] = useState(false);
  const [apolices, setApolices] = useState<Apolice[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchApolice = async () => {
      if (user?.cpf) {
        try {
          const res = await fetch(`/api/apolices/consultarApolice?cpf=${user.cpf}`);
          const data = await res.json();
          if (res.ok) {
            setApolices(data.apolices);
          } else {
            console.warn("Apólice não encontrada:", data.message);
          }
        } catch (error) {
          console.error("Erro ao buscar apólice:", error);
        }
      }
    };

    fetchApolice();
  }, [user?.cpf]);

  const formatarDataBR = (dataISO: string | undefined) => {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const calcularIdade = (dataNascimento: string | undefined): number => {
    if (!dataNascimento) return 0;
    const hoje = new Date();
    const [ano, mes, dia] = dataNascimento.split("-").map(Number);
    const nascimento = new Date(ano, mes - 1, dia);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();
    if (
      mesAtual < nascimento.getMonth() ||
      (mesAtual === nascimento.getMonth() && diaAtual < nascimento.getDate())
    ) {
      idade--;
    }
    return idade;
  };

  if (!isMounted) return null;

  const handleDownload = () => {
    if (apolices.length > 0) {
      window.open(apolices[0].link, "_blank");
    } else {
      alert("❌ Nenhuma apólice disponível para download.");
    }
  };

  return (
    <div className="container py-5">
      <motion.h1
        className="text-center mb-5 fw-bold"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Detalhes da Apólice
      </motion.h1>

      <div className="row justify-content-center gy-4">
        <motion.div
          className="col-12 col-md-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card shadow border-0 h-100">
            <div className="card-body">
              <h4 className="mb-3 fw-semibold">👤 Cliente</h4>
              <ul className="list-unstyled">
                <li><strong>Nome:</strong> {user?.nome}</li>
                <li><strong>CPF:</strong> {user?.cpf}</li>
                <li><strong>Data de nascimento:</strong> {formatarDataBR(user?.dt_nascimento)}</li>
                <li><strong>Idade:</strong> {calcularIdade(user?.dt_nascimento)}</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="col-12 col-md-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card shadow border-0 h-100">
            <div className="card-body">
              <h4 className="mb-3 fw-semibold">📄 Contrato / Apólice</h4>
              <ul className="list-unstyled">
                <li><strong>Situação:</strong> Contrato aprovado</li>
                <li>
                  <strong>Vigência:</strong> {user?.data_contrato_vigencia_inicio} - {user?.data_contrato_vigencia_final}
                </li>
                <li><strong>Operação:</strong> {user?.cod_contrato_retorno_operacao || "—"}</li>
                <li><strong>Certificado:</strong> {user?.num_contrato_retorno_certificado || "—"}</li>
                <li>
                  <strong>Links encontrados:</strong> {apolices.length}
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="text-center mt-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Button
            variant="success"
            size="lg"
            onClick={handleDownload}
            className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-3"
          >
            <i className="bi bi-download fs-5"></i>
            Baixar Apólice
          </Button>

          <a
            href="/Guia%20Explicativo%20+%20Anexo.pdf"
            download
            className="btn btn-danger d-inline-flex align-items-center gap-2 px-4 py-2 rounded-3"
          >
            <i className="bi bi-file-earmark-pdf fs-5"></i>
            Baixar Guia Explicativo
          </a>
        </div>
      </motion.div>
    </div>
  );
}
