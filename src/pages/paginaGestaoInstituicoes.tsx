import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Form, Table, Spinner, Badge } from "react-bootstrap";
import { motion } from "framer-motion";
import { instituicoesEmpresaApi } from "../lib/api-client";

export type Instituicao = {
  idInstituicao: number;
  nomeInstituicao: string;
  nomeFantasia: string;
  email: string;
  cnpj: string;
  celular: string;
  cep: string;
  endereco: string;
  uf: string;
  cidade: string;
  createdAt?: string;
  status: 'A' | 'I' | null;        // ⬅️ status string
  valor_plano: number | null;
  valor_comissao?: number | null;
  imagem_perfil?: string | null;
  chave_api?: string | null;
};

const emailValido = (email: string) => /.+@.+\..+/.test(email.trim());
const cnpjValido = (cnpj: string) => cnpj.replace(/\D/g, "").length === 14;
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function PaginaGestaoInstituicoes() {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Instituicao | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    nomeInstituicao: string;
    nomeFantasia: string;
    email: string;
    cnpj: string;
    celular: string;
    cep: string;
    endereco: string;
    uf: string;
    cidade: string;
    status: 'A' | 'I';
    valor_plano: number;
    imagem_perfil: File | null;
    valor_comissao: number | null;
    chave_api?: string | null;
  }>({
    nomeInstituicao: "",
    nomeFantasia: "",
    email: "",
    cnpj: "",
    celular: "",
    cep: "",
    endereco: "",
    uf: "",
    cidade: "",
    status: 'A',
    valor_plano: 0,
    imagem_perfil: null,
    valor_comissao: null,
    chave_api: "",
  });
  const [valorPlanoMasked, setValorPlanoMasked] = useState("R$ 0,00");
  const [valorComissaoMasked, setValorComissaoMasked] = useState("R$ 0,00");

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => { fetchInstituicoes(); }, []);

  const fetchInstituicoes = async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await instituicoesEmpresaApi.buscar();
      if (data.success) setInstituicoes(data.instituicoes);
      else setErro(data.error || "Falha ao carregar instituições");
    } catch (e: any) {
      setErro(e.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setPreviewImagem(null);
    setFormData({
      nomeInstituicao: "",
      nomeFantasia: "",
      email: "",
      cnpj: "",
      celular: "",
      cep: "",
      endereco: "",
      uf: "",
      cidade: "",
      status: 'A',
      valor_plano: 0,
      imagem_perfil: null,
      valor_comissao: null,
      chave_api: "",
    });
    setValorPlanoMasked("R$ 0,00");
    setValorComissaoMasked("R$ 0,00");

    setValidationErrors({});
  };

  const handleShow = (instituicao?: Instituicao) => {
    if (instituicao) {
      setEditing(instituicao);
      setFormData({
        nomeInstituicao: instituicao.nomeInstituicao || "",
        nomeFantasia: instituicao.nomeFantasia || "",
        email: instituicao.email || "",
        cnpj: instituicao.cnpj || "",
        celular: instituicao.celular || "",
        cep: instituicao.cep || "",
        endereco: instituicao.endereco || "",
        uf: instituicao.uf || "",
        cidade: instituicao.cidade || "",
        status: (instituicao.status ?? 'A') as 'A' | 'I',
        valor_plano: instituicao.valor_plano ?? 0,
        imagem_perfil: null,
        valor_comissao: instituicao.valor_comissao ?? null,
        chave_api: instituicao.chave_api ?? "",
      });
      setValorPlanoMasked(currencyFormatter.format(instituicao.valor_plano ?? 0));
      setValorComissaoMasked(currencyFormatter.format(instituicao.valor_comissao ?? 0));

      setPreviewImagem(instituicao.imagem_perfil ?? null);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    resetForm();
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.nomeInstituicao.trim()) errors.nomeInstituicao = "Obrigatório";
    if (formData.email && !emailValido(formData.email)) errors.email = "Email inválido";
    if (formData.cnpj && !cnpjValido(formData.cnpj)) errors.cnpj = "CNPJ inválido";
    if (formData.valor_plano < 0) errors.valor_plano = "Valor inválido";
    if (formData.valor_comissao !== null && formData.valor_comissao < 0) {
      errors.valor_comissao = "Valor de comissão inválido";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    // Envia apenas os campos aceitos pelo DTO do backend
    const form = new FormData();
    form.append('nomeInstituicao', formData.nomeInstituicao);
    form.append('status', formData.status);
    if (formData.imagem_perfil instanceof File) form.append('imagem_perfil', formData.imagem_perfil);
    if (formData.valor_plano !== null && formData.valor_plano !== undefined) {
      form.append('valor_plano', String(formData.valor_plano));
    }
    if (formData.valor_comissao !== null && formData.valor_comissao !== undefined) {
      form.append('valor_comissao', String(formData.valor_comissao));
    }
    if (formData.chave_api && formData.chave_api.trim() !== '') {
      form.append('chave_api', formData.chave_api.trim());
    }

    try {
      if (editing) await instituicoesEmpresaApi.editar(editing.idInstituicao, form);
      else await instituicoesEmpresaApi.criar(form);
      fetchInstituicoes();
      handleClose();
    } catch {
      alert("Erro inesperado ao salvar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta instituição?")) return;
    try {
      await instituicoesEmpresaApi.deletar(id);
      fetchInstituicoes();
    } catch {
      alert("Erro inesperado ao deletar");
    }
  };

  // Alterna status 'A' ↔ 'I' e persiste
  const toggleAtivo = async (inst: Instituicao) => {
    const nextStatus: 'A' | 'I' = inst.status === 'A' ? 'I' : 'A';
    try {
      const form = new FormData();
      form.append('nomeInstituicao', inst.nomeInstituicao || '');
      form.append('status', nextStatus);
      if (inst.valor_plano !== null && inst.valor_plano !== undefined) {
        form.append('valor_plano', String(inst.valor_plano));
      }
      if (inst.valor_comissao !== null && inst.valor_comissao !== undefined) {
        form.append('valor_comissao', String(inst.valor_comissao));
      }
      if (inst.chave_api) form.append('chave_api', String(inst.chave_api));
      await instituicoesEmpresaApi.editar(inst.idInstituicao, form);

      setInstituicoes(prev =>
        prev.map(i => i.idInstituicao === inst.idInstituicao ? { ...i, status: nextStatus } : i)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return instituicoes;
    return instituicoes.filter(i =>
      [i.nomeInstituicao, i.email, i.cnpj].some(f => f?.toLowerCase().includes(s))
    );
  }, [instituicoes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search]);

  const onChangeValorPlano = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const cents = parseInt(digits || "0", 10);
    const value = cents / 100;
    setFormData(f => ({ ...f, valor_plano: value }));
    setValorPlanoMasked(currencyFormatter.format(value));
  };


  const onChangeValorComissao = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const cents = parseInt(digits || "0", 10);
    const value = cents / 100;
    setFormData(f => ({ ...f, valor_comissao: value }));
    setValorComissaoMasked(currencyFormatter.format(value));
  };

  const disableSave =
    Object.keys(validationErrors).length > 0 ||
    !formData.nomeInstituicao;


  return (
    <div className="container py-5">
      <motion.h2 className="text-center mb-4 fw-bold" initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        Gestão de Instituições
      </motion.h2>

      <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center mb-3">
        <div className="flex-grow-1">
          <Form.Control
            placeholder="Pesquisar por nome, e-mail ou CNPJ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="text-md-end">
          <Button variant="success" onClick={() => handleShow()}>
            <i className="bi bi-building-add me-2" />
            Nova Instituição
          </Button>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
        <span>Total: {filtered.length}</span>
        {search && <span>Filtrado por: "{search}"</span>}
      </div>

      {erro && <div className="alert alert-danger py-2">{erro}</div>}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Table hover responsive bordered size="sm" className="shadow-sm align-middle">
            <thead className="table-dark">
              <tr><th>Nome</th><th>Email</th><th>CNPJ</th><th>Valor Plano</th><th>Valor Comissao</th><th>Chave API Asaas</th><th>Status</th><th>Imagem</th><th style={{ width: 150 }}>Ações</th></tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">Nenhuma instituição encontrada</td>
                </tr>
              )}
              {paginated.map((inst, idx) => (
                <motion.tr key={inst.idInstituicao} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <td className="fw-semibold">{inst.nomeInstituicao}</td>
                  <td>{inst.email}</td>
                  <td>{inst.cnpj}</td>
                  <td>{currencyFormatter.format(inst.valor_plano ?? 0)}</td>
                  <td>{currencyFormatter.format(inst.valor_comissao ?? 0)}</td>
                  <td>
                    {inst.chave_api
                      ? <span title={inst.chave_api} className="text-monospace">{inst.chave_api.slice(0, 4)}•••{inst.chave_api.slice(-4)}</span>
                      : <span className="text-muted small">—</span>}
                  </td>
                  <td>
                    <Badge
                      bg={inst.status === 'A' ? "success" : "secondary"}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleAtivo(inst)}
                      title="Alternar status"
                    >
                      {inst.status === 'A' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </td>
                  <td>
                    {inst.imagem_perfil
                      ? <img src={inst.imagem_perfil} alt="Logo" width={36} height={36} style={{ objectFit: 'cover', borderRadius: 4 }} />
                      : <span className="text-muted small">sem imagem</span>}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-primary" onClick={() => handleShow(inst)}>
                        <i className="bi bi-pencil" />
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(inst.idInstituicao)}>
                        <i className="bi bi-trash" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </Table>

          {filtered.length > pageSize && (
            <div className="d-flex justify-content-between align-items-center mt-2">
              <div className="small text-muted">Página {page} de {totalPages}</div>
              <div className="btn-group">
                <Button size="sm" variant="outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button size="sm" variant="outline-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={handleClose}
        centered
        size="lg"
        scrollable
        dialogClassName="instituicao-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Editar Instituição' : 'Nova Instituição'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold">Nome Instituição *</Form.Label>
                <Form.Control
                  value={formData.nomeInstituicao}
                  onChange={e => setFormData(f => ({ ...f, nomeInstituicao: e.target.value }))}
                  isInvalid={!!validationErrors.nomeInstituicao}
                />
                <Form.Control.Feedback type="invalid">{validationErrors.nomeInstituicao}</Form.Control.Feedback>
              </div>
              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold">Nome Fantasia</Form.Label>
                <Form.Control
                  value={formData.nomeFantasia}
                  onChange={e => setFormData(f => ({ ...f, nomeFantasia: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold">Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  isInvalid={!!validationErrors.email}
                />
                <Form.Control.Feedback type="invalid">{validationErrors.email}</Form.Control.Feedback>
              </div>
              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold">CNPJ</Form.Label>
                <Form.Control
                  value={formData.cnpj}
                  onChange={e => setFormData(f => ({ ...f, cnpj: e.target.value }))}
                  isInvalid={!!validationErrors.cnpj}
                />
                <Form.Control.Feedback type="invalid">{validationErrors.cnpj}</Form.Control.Feedback>
              </div>
              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold">Celular</Form.Label>
                <Form.Control
                  value={formData.celular}
                  onChange={e => setFormData(f => ({ ...f, celular: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold">CEP</Form.Label>
                <Form.Control
                  value={formData.cep}
                  onChange={e => setFormData(f => ({ ...f, cep: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold">Endereço</Form.Label>
                <Form.Control
                  value={formData.endereco}
                  onChange={e => setFormData(f => ({ ...f, endereco: e.target.value }))}
                />
              </div>
              <div className="col-6 col-md-2">
                <Form.Label className="fw-semibold">UF</Form.Label>
                <Form.Control
                  value={formData.uf}
                  onChange={e => setFormData(f => ({ ...f, uf: e.target.value }))}
                />
              </div>
              <div className="col-6 col-md-4">
                <Form.Label className="fw-semibold">Cidade</Form.Label>
                <Form.Control
                  value={formData.cidade}
                  onChange={e => setFormData(f => ({ ...f, cidade: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-4">
                <Form.Label className="fw-semibold">Valor do Plano</Form.Label>
                <Form.Control
                  value={valorPlanoMasked}
                  onChange={e => onChangeValorPlano(e.target.value)}
                  isInvalid={!!validationErrors.valor_plano}
                />
                <Form.Control.Feedback type="invalid">{validationErrors.valor_plano}</Form.Control.Feedback>
              </div>
              <div className="col-12 col-md-4">
                <Form.Label className="fw-semibold">Valor da Comissão</Form.Label>
                <Form.Control
                  value={valorComissaoMasked}
                  onChange={e => onChangeValorComissao(e.target.value)}
                  isInvalid={!!validationErrors.valor_comissao}
                />
                <Form.Control.Feedback type="invalid">{validationErrors.valor_comissao}</Form.Control.Feedback>
              </div>
              <div className="col-12">
                <Form.Label className="fw-semibold">Chave API Asaas da Instituição</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ex: $live_xxx... (opcional)"
                  value={formData.chave_api || ""}
                  onChange={e => setFormData(f => ({ ...f, chave_api: e.target.value }))}
                />
                <div className="form-text">Se preenchida, esta chave será usada nas cobranças/assinaturas desta instituição. Pode começar com "$".</div>
              </div>
              <div className="col-12 col-md-4 d-flex align-items-end">
                <Form.Check
                  type="switch"
                  label={formData.status === 'A' ? "Ativa" : "Inativa"}
                  checked={formData.status === 'A'}
                  onChange={e => setFormData(f => ({ ...f, status: e.target.checked ? 'A' : 'I' }))}
                />
              </div>
              <div className="col-12 col-md-8">
                <Form.Label className="fw-semibold">Imagem / Logo</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const input = e.target as HTMLInputElement;
                    const file = input.files?.[0] || null;
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setPreviewImagem(reader.result as string);
                      reader.readAsDataURL(file);
                    } else {
                      setPreviewImagem(null);
                    }
                    setFormData(f => ({ ...f, imagem_perfil: file }));
                  }}
                />
              </div>
              <div className="col-12 col-md-4 d-flex align-items-center justify-content-center">
                {previewImagem ? (
                  <img
                    src={previewImagem}
                    alt="preview"
                    style={{ maxWidth: '100%', maxHeight: 110, borderRadius: 6, objectFit: 'cover', boxShadow: '0 0 0 1px #ddd' }}
                  />
                ) : (
                  <span className="text-muted small">sem imagem</span>
                )}
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={disableSave}>Salvar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
