import { useEffect, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import AvisoAlerta from "@/components/avisoAlerta/avisoAlerta";
import { dependenteApi } from '@/lib/api-client';

interface Dependente {
  id: number;
  nome: string;
  cpf: string;
  nascimento: string;
}

export default function PaginaControleDependentes() {
  const [dependentes, setDependentes] = useState<Dependente[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nome: "", cpf: "", nascimento: "" });
  const [loadingSave, setLoadingSave] = useState(false);
  const [showAviso, setShowAviso] = useState(false);
  const [avisoMensagem, setAvisoMensagem] = useState("");
  const [avisoTipo, setAvisoTipo] = useState<"success" | "warning" | "danger">("warning");

const buscarDependentesDoServidor = async () => {
  if (!user?.cpf) return;
  setLoading(true);
  try {
    // 1. Sincroniza com backend (Sulamérica + banco consolidado)
    const dadosSincronizar = {
      cpfTitular: user.cpf,
      nascimentoTitular: user.dt_nascimento // Incluir nascimento para consulta Sulamérica
    };
    await dependenteApi.sincronizar(dadosSincronizar);

    // 2. Consulta dependentes (já consolidados no backend após sincronização)
    const consulta = await dependenteApi.consultar(user.cpf);
    const resposta = (consulta as any);
    const lista = Array.isArray(resposta?.dependentes || resposta?.data?.dependentes)
      ? (resposta.dependentes || resposta.data.dependentes) : [];

    const adaptado = lista.map((dep: any, i: number) => ({
      id: i + 1,
      nome: dep.nome,
      cpf: dep.cpf,
      nascimento: dep.nascimento,
    }));
    setDependentes(adaptado);
    setErroBusca(null);
  } catch (error: any) {
    console.error('❌ Erro ao sincronizar/consultar dependentes', error);
    setErroBusca(error.message || 'Erro ao buscar dependentes');
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    setShowModal(false);
    setFormData({ nome: "", cpf: "", nascimento: "" });
  };

  const handleShow = () => {
    setFormData({ nome: "", cpf: "", nascimento: "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nascimento || !formData.nome || !formData.cpf) return;

    setLoadingSave(true);

    const novoDependente: Dependente = {
      id: Date.now(),
      nome: formData.nome,
      cpf: formData.cpf,
      nascimento: formData.nascimento,
    };

    try {
      const cadastro = await dependenteApi.cadastrar({
        nomeDependente: formData.nome,
        cpfDependente: formData.cpf,
        cpfTitular: user?.cpf || '',
        parentesco: 'dependente'
      });

      if (!cadastro.success) {
        console.error('❌ Erro ao cadastrar dependente:', cadastro.error);
        alert('Erro ao cadastrar dependente: ' + (cadastro.error || 'Falha desconhecida'));
        setLoadingSave(false);
        return;
      }

      // Recarrega lista após cadastro bem sucedido
      await buscarDependentesDoServidor();

    } catch (error: any) {
      console.error("❌ Erro ao chamar a API de cadastro:", error);
      alert("Erro ao cadastrar dependente: " + error.message);
      setLoadingSave(false);
      return;
    }

    setDependentes((prev) => [...(prev || []), novoDependente]);

    setLoadingSave(false);
    handleClose();
  };

  // Cadastro direto já consolidado no backend → função auxiliar removida

  const handleGerarCarteirinha = async (dependente: Dependente) => {
    if (!user) {
      setAvisoMensagem("Usuário não encontrado. Faça login novamente.");
      setAvisoTipo("danger");
      setShowAviso(true);
      return;
    }

    const dadosCarteirinha = {
      nome: dependente.nome,
      cpf: dependente.cpf,
      empresa: user.dsc_instituicao
    };

    try {
      const blobResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/carteirinha/gerar-dependente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosCarteirinha)
      });

      if (!blobResp.ok) {
        console.error('Erro ao gerar carteirinha do dependente');
        setAvisoMensagem('Erro ao gerar carteirinha. Tente novamente mais tarde.');
        setAvisoTipo('danger');
        setShowAviso(true);
        return;
      }

      const blob = await blobResp.blob();
      
      // Criar nome do arquivo com primeiro nome + CPF
      const primeiroNome = dependente.nome.split(' ')[0];
      const cpfLimpo = (dependente.cpf ?? "").replace(/[^\d]/g, '');
      const nomeArquivo = `carteirinha-dependente-${primeiroNome}-${cpfLimpo}.png`;
      
      // Forçar download da imagem
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setAvisoMensagem("Carteirinha do dependente baixada com sucesso!");
      setAvisoTipo("success");
      setShowAviso(true);

    } catch (err) {
      console.error("Erro ao gerar carteirinha do dependente:", err);
      setAvisoMensagem("Erro ao processar carteirinha. Tente novamente.");
      setAvisoTipo("danger");
      setShowAviso(true);
    }
  };

  useEffect(() => {
    buscarDependentesDoServidor();
  }, []);

  return (
    <div className="container py-5">
      <motion.h2
        className="text-center mb-5 fw-bold"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Gestão de Dependentes
      </motion.h2>

      {showAviso && (
        <AvisoAlerta
          mensagem={avisoMensagem || "Processando solicitação..."}
          tipo={avisoTipo}
          duracao={5000}
        />
      )}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando dependentes...</span>
          </div>
          <p className="mt-2">Carregando dependentes...</p>
        </div>
      ) : erroBusca ? (
        <div className="text-center text-danger fw-bold">Erro ao buscar dependentes</div>
      ) : (
        <>
          {dependentes?.length === 0 && (
            <div className="text-center text-muted fw-semibold mb-4">
              Nenhum dependente encontrado!
            </div>
          )}

          <div className="row justify-content-center">
            {dependentes?.map((dep, index) => (
              <motion.div
                key={dep.id}
                className="col-12 col-md-6 col-lg-4 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="card shadow border-0 h-100">
                  <div className="card-body">
                    <h5 className="fw-semibold">{dep.nome}</h5>
                    <p className="mb-1"><strong>CPF:</strong> {dep.cpf}</p>
                    <p className="mb-3"><strong>Nascimento:</strong> {dep.nascimento}</p>
                    
                    {user?.dsc_instituicao?.includes("Vita") && (
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleGerarCarteirinha(dep)}
                          className="d-inline-flex align-items-center gap-2"
                        >
                          <i className="bi bi-credit-card"></i>
                          Gerar Carteirinha
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {(dependentes === null || dependentes.length < 3) && (
            <motion.div
              className="text-center mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button variant="success" size="lg" onClick={() => handleShow()}>
                <i className="bi bi-person-plus me-2"></i> Adicionar Dependente
              </Button>
            </motion.div>
          )}
        </>
      )}


      {/* Modal */}
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Novo Dependente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Data de Nascimento</Form.Label>
              <Form.Control
                type="date"
                value={formData.nascimento}
                onChange={(e) => setFormData({ ...formData, nascimento: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>CPF</Form.Label>
              <Form.Control
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </Form.Group>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loadingSave}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={!formData.nome || loadingSave}
          >
            {loadingSave ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
