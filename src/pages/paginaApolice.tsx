import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "react-bootstrap";
import { useAuth } from "@/app/context/AuthContext";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";

type Apolice = {
  link: string;
  dataCadastro: string;
};

export default function PaginaApolice() {
  const [isMounted, setIsMounted] = useState(false);
  const [apolices, setApolices] = useState<Apolice[]>([]);
  const [showAviso, setShowAviso] = useState(false);

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
            setShowAviso(true);
          }
        } catch (error) {
          console.error("Erro ao buscar apólice:", error);
          setShowAviso(true); 
        }
      }
    };

    fetchApolice();
  }, [user?.cpf]);


  const calcularIdade = (dataNascimento: string | undefined): number => {
    console.log(dataNascimento);
    if (!dataNascimento) return 0;
  
    const [dia, mes, ano] = dataNascimento.split("/").map(Number);
  
    const nascimento = new Date(ano, mes - 1, dia); 
  
    const hoje = new Date();
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

  const handleDownload = async () => {
    if (!user) {
      setShowAviso(true);
      return;
    }
  
    const dadosApolice = {
      nomeseg: user.nome,
      cpf: user.cpf,
      datanascimento: user.dt_nascimento?.split("-").reverse().join("/"),
      matricula: user.id,
      numoperacao: user.cod_contrato_retorno_operacao,
      numcertificado: user.num_contrato_retorno_certificado,
      numsorteio: "0",
      numapolice: user.num_contrato_retorno_apolice,
      dataemissao: new Date().toLocaleDateString("pt-BR"),
      premiomensal: "R$29,90",
    };
   
    try {
      const response = await fetch("/api/apolices/gerarApolice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosApolice),
      });
  
      if (!response.ok) {
        console.error("Erro ao gerar PDF");
        setShowAviso(true);
        return;
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");

    } catch (err) {
      console.error("Erro ao baixar apólice:", err);
      setShowAviso(true);
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

      {showAviso && (
        <AvisoAlerta 
          mensagem="Apólice em processamento de geração, tente mais tarde." 
          tipo="warning" 
          duracao={5000} 
        />
      )}

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
                <li><strong>Data de nascimento:</strong> {user?.dt_nascimento}</li>
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
            href="/api/arquivo/downloadArquivo"
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