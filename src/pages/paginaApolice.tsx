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
  const [avisoMensagem, setAvisoMensagem] = useState("");
  const [avisoTipo, setAvisoTipo] = useState<"success" | "warning" | "danger">("warning");

  const { user } = useAuth();
  useEffect(() => {
    setIsMounted(true);
  }, []);

  console.log(user)
  const dscEmpresa = encodeURIComponent(user?.dsc_instituicao || "");

  const calcularIdade = (dataNascimento: string | undefined): number => {
    if (!dataNascimento) return 0;

    let nascimento: Date;

    if (dataNascimento.includes("/")) {
      const [dia, mes, ano] = dataNascimento.split("/").map(Number);
      nascimento = new Date(ano, mes - 1, dia);
    } else if (dataNascimento.includes("-")) {
      nascimento = new Date(dataNascimento);
    } else {
      console.warn("Formato de data inválido:", dataNascimento);
      return 0;
    }

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

  const formatarDataNascimento = (data: string | undefined): string => {
    if (!data) return "—";

    if (data.includes("/")) return data;

    if (data.includes("-")) {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    }

    return "Formato inválido";
  };

  const formatarDataVigencia = (data: string | undefined): string => {
    if (!data) return "—";

    if (data.includes("/")) return data;

    if (data.includes("-")) {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    }

    return "Formato inválido";
  };


  if (!isMounted) return null;

  const handleDownload = async () => {
    if (!user) {
      setAvisoMensagem("Usuário não encontrado. Faça login novamente.");
      setAvisoTipo("danger");
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
      valorplano: user.dsc_instituicao?.includes("Vita") ? "39,90" : "49,90",
    };

    try {
      const response = await fetch("/api/apolices/gerarApolice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosApolice),
      });

      if (!response.ok) {
        console.error("Erro ao gerar PDF");
        setAvisoMensagem("Erro ao gerar apólice. Tente novamente mais tarde.");
        setAvisoTipo("danger");
        setShowAviso(true);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

    } catch (err) {
      console.error("Erro ao baixar apólice:", err);
      setAvisoMensagem("Apólice em processamento de geração, tente mais tarde.");
      setAvisoTipo("warning");
      setShowAviso(true);
    }
  };

  const handlePreencherCarteirinha = async () => {
    if (!user) {
      setAvisoMensagem("Usuário não encontrado. Faça login novamente.");
      setAvisoTipo("danger");
      setShowAviso(true);
      return;
    }

    const dadosCarteirinha = {
      nome: user.nome,
      cpf: user.cpf,
      vigenciaInicio: formatarDataVigencia(user.data_contrato_vigencia_inicio),
      vigenciaFinal: formatarDataVigencia(user.data_contrato_vigencia_final),
      apolice: user.num_contrato_retorno_apolice || "—",
      operacao: user.cod_contrato_retorno_operacao || "—",
      certificado: user.num_contrato_retorno_certificado || "—",
      empresa: user.dsc_instituicao
    };

    try {
      const response = await fetch("/api/carteirinha/gerarCarteirinha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosCarteirinha),
      });

      if (!response.ok) {
        console.error("Erro ao gerar carteirinha");
        setAvisoMensagem("Erro ao gerar carteirinha. Tente novamente mais tarde.");
        setAvisoTipo("danger");
        setShowAviso(true);
        return;
      }

      const blob = await response.blob();
      
      // Criar nome do arquivo com primeiro nome + CPF
      const primeiroNome = user.nome.split(' ')[0];
      const cpfLimpo = (user.cpf ?? "").replace(/[^\d]/g, '');
      const nomeArquivo = `carteirinha-${primeiroNome}-${cpfLimpo}.png`;
      
      // Forçar download da imagem
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setAvisoMensagem("Carteirinha baixada com sucesso!");
      setAvisoTipo("success");
      setShowAviso(true);

    } catch (err) {
      console.error("Erro ao gerar carteirinha:", err);
      setAvisoMensagem("Erro ao processar carteirinha. Tente novamente.");
      setAvisoTipo("danger");
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
          mensagem={avisoMensagem || "Processando solicitação..."}
          tipo={avisoTipo}
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
                <li><strong>Data de nascimento:</strong> {formatarDataNascimento(user?.dt_nascimento)}</li>
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
                  <strong>Vigência:</strong> {formatarDataVigencia(user?.data_contrato_vigencia_inicio)} - {formatarDataVigencia(user?.data_contrato_vigencia_final)}
                </li>
                <li><strong>Apólice:</strong> {user?.num_contrato_retorno_apolice || "—"}</li>
                <li><strong>Operação:</strong> {user?.cod_contrato_retorno_operacao || "—"}</li>
                <li><strong>Certificado:</strong> {user?.num_contrato_retorno_certificado || "—"}</li>
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

          {user?.dsc_instituicao?.includes("Vita") && (
            <Button
              variant="primary"
              size="lg"
              onClick={handlePreencherCarteirinha}
              className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-3"
            >
              <i className="bi bi-credit-card fs-5"></i>
              Gerar Carteirinha
            </Button>
          )}

          <a
            href={`/api/arquivo/downloadArquivo?dscEmpresa=${dscEmpresa}`}
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