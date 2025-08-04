import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "react-bootstrap";
import { useAuth } from "@/app/context/AuthContext";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import AssinaturaDigital from "@/components/assinaturaDigital/AssinaturaDigital";
import ContratoPopup from "@/components/contratoPopup/ContratoPopup";

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
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [showContratoPopup, setShowContratoPopup] = useState(false);
  const [dadosContrato, setDadosContrato] = useState<any>(null);
  const [urlContratoVisualizacao, setUrlContratoVisualizacao] = useState<string | null>(null);
  const [loadingContrato, setLoadingContrato] = useState(false);

  const { user, updateUser } = useAuth();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Verificar status do contrato assinado quando a página carregar
  useEffect(() => {
    const verificarStatusContrato = async () => {
      if (!user?.cpf || !user?.dsc_instituicao?.includes("Vita")) {
        return;
      }

      try {
        const response = await fetch("/api/contrato/verificarStatusContrato", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: user.cpf }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Atualizar contexto se o status for diferente
          if (data.contrato_assinado !== user.contrato_assinado) {
            updateUser({ contrato_assinado: data.contrato_assinado });
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status do contrato:", error);
      }
    };

    verificarStatusContrato();
  }, [user?.cpf, user?.dsc_instituicao, user?.contrato_assinado, updateUser]);

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

  const handleGerarContratoVita = async () => {
    if (!user) {
      setAvisoMensagem("Usuário não encontrado. Faça login novamente.");
      setAvisoTipo("danger");
      setShowAviso(true);
      return;
    }

    // Preparar dados do contrato
    const dadosContratoTemp = {
      nomeseg: user.nome,
      cpf: user.cpf,
      datanascimento: user.dt_nascimento?.split("-").reverse().join("/"),
      endereco: `${user.cidade || ""}${user.cidade && user.uf ? ", " : ""}${user.uf || ""}`.trim() || "—",
    };

    // Salvar dados do contrato e abrir popup
    setDadosContrato(dadosContratoTemp);
    setShowContratoPopup(true);
  };

  const handleBaixarSemAssinar = async () => {
    if (!dadosContrato) {
      setAvisoMensagem("Erro nos dados do contrato. Tente novamente.");
      setAvisoTipo("danger");
      setShowAviso(true);
      return;
    }

    try {
      const response = await fetch("/api/contrato/gerarContratoVita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosContrato),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar contrato");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Fazer download do arquivo
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato_vita_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      
      // Limpar URL
      window.URL.revokeObjectURL(url);

      setAvisoMensagem("Contrato baixado com sucesso!");
      setAvisoTipo("success");
      setShowAviso(true);

    } catch (err) {
      console.error("Erro ao baixar contrato:", err);
      setAvisoMensagem("Erro ao baixar contrato. Tente novamente.");
      setAvisoTipo("danger");
      setShowAviso(true);
    }
  };

  const handleBaixarContratoAssinado = async () => {
    if (!user?.cpf) {
      setAvisoMensagem("Erro: CPF do usuário não encontrado.");
      setAvisoTipo("danger");
      setShowAviso(true);
      return;
    }

    try {
      const response = await fetch("/api/contrato/baixarContratoAssinado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf_usuario: user.cpf }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao baixar contrato");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Fazer download do arquivo
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato_vita_assinado_${user.nome?.replace(/\s+/g, '_') || 'cliente'}.pdf`;
      link.click();
      
      // Limpar URL
      window.URL.revokeObjectURL(url);

      setAvisoMensagem("Contrato assinado baixado com sucesso!");
      setAvisoTipo("success");
      setShowAviso(true);

    } catch (err: any) {
      console.error("Erro ao baixar contrato assinado:", err);
      setAvisoMensagem(err.message || "Erro ao baixar contrato assinado. Tente novamente.");
      setAvisoTipo("danger");
      setShowAviso(true);
    }
  };

  const handleBaixarContrato = () => {
    if (urlContratoVisualizacao) {
      const link = document.createElement('a');
      link.href = urlContratoVisualizacao;
      link.download = `contrato_vita_${user?.nome?.replace(/\s+/g, '_') || 'cliente'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleIniciarAssinatura = () => {
    setShowContratoPopup(false);
    setShowAssinatura(true);
  };

  const handleAssinaturaConcluida = async (assinaturaBase64: string) => {
    setShowAssinatura(false);
    
    if (!user || !dadosContrato) {
      setAvisoMensagem("Erro nos dados do contrato. Tente novamente.");
      setAvisoTipo("danger");
      setShowAviso(true);
      return;
    }

    try {
      // Obter informações da sessão
      const userAgent = navigator.userAgent;
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;

      // Salvar a assinatura no banco de dados
      const salvarAssinaturaResponse = await fetch("/api/contrato/salvarAssinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf_usuario: user.cpf,
          tipo_contrato: "vita",
          dados_contrato: dadosContrato,
          assinatura_digital: assinaturaBase64,
          ip_assinatura: ipAddress,
          user_agent: userAgent
        }),
      });

      if (!salvarAssinaturaResponse.ok) {
        throw new Error("Erro ao salvar assinatura");
      }

      // Marcar contrato como assinado na tabela tb_clientes
      const marcarAssinadoResponse = await fetch("/api/contrato/marcarAssinado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: user.cpf
        }),
      });

      if (!marcarAssinadoResponse.ok) {
        throw new Error("Erro ao atualizar status do contrato");
      }

      // Gerar contrato com assinatura
      const dadosComAssinatura = {
        ...dadosContrato,
        assinaturaDigital: assinaturaBase64
      };

      const response = await fetch("/api/contrato/gerarContratoVita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosComAssinatura),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar contrato assinado");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Atualizar dados do usuário no contexto
      updateUser({ contrato_assinado: true });

      setAvisoMensagem("Contrato assinado com sucesso! O documento foi salvo e está sendo baixado.");
      setAvisoTipo("success");
      setShowAviso(true);

    } catch (err) {
      console.error("Erro ao processar assinatura:", err);
      setAvisoMensagem("Erro ao processar assinatura. Tente novamente.");
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
            <>
              <Button
                variant="primary"
                size="lg"
                onClick={handlePreencherCarteirinha}
                className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-3"
              >
                <i className="bi bi-credit-card fs-5"></i>
                Gerar Carteirinha
              </Button>
              
              {!user?.contrato_assinado ? (
                <Button
                  variant="warning"
                  size="lg"
                  onClick={handleGerarContratoVita}
                  className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-3"
                >
                  <i className="bi bi-file-earmark-text fs-5"></i>
                  Gerar Contrato Vita
                </Button>
              ) : (
                <Button
                  variant="outline-info"
                  size="lg"
                  onClick={handleBaixarContratoAssinado}
                  className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-3"
                >
                  <i className="bi bi-download fs-5"></i>
                  Baixar Contrato Assinado
                </Button>
              )}
            </>
          )}

          {!user?.dsc_instituicao?.includes("Vita") && (
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

      {/* Modal de Assinatura Digital */}
      <AssinaturaDigital
        show={showAssinatura}
        onHide={() => setShowAssinatura(false)}
        onAssinar={handleAssinaturaConcluida}
        nomeUsuario={user?.nome || ""}
      />

      {/* Modal de Visualização do Contrato */}
      <ContratoPopup
        show={showContratoPopup}
        onHide={() => setShowContratoPopup(false)}
        onAssinar={() => {
          setShowContratoPopup(false);
          setShowAssinatura(true);
        }}
        onBaixarSemAssinar={handleBaixarSemAssinar}
        dadosContrato={dadosContrato}
        contratoAssinado={user?.contrato_assinado || false}
      />
    </div>
  );
}