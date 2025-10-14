import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { Modal, Button, Form } from 'react-bootstrap';
import { apiClient } from '@/lib/api-client';

export default function TopBar() {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [isSmall, setIsSmall] = useState<boolean>(false);

  const empresaNome = user?.dsc_instituicao ?? null;
  const empresaImagem =
    user?.imagem_empresa ||
    (typeof window !== 'undefined' ? localStorage.getItem('imagem_empresa') : null) ||
    '/default2.png';

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserName(parsed?.nome || 'Usuário');
        setUserRole(parsed?.perfil || '');
      } catch (e) {
        console.error('Erro parse user localStorage', e);
      }
    } else if (user) {
      setUserName(user?.nome || 'Usuário');
      setUserRole(user?.perfil || '');
    }
  }, [user]);

  useEffect(() => {
    function handleResize() {
      setIsSmall(window.innerWidth <= 480);
    }
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleToggleSidebar = () => {
    const ev = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(ev);
  };

  const headerStyle: React.CSSProperties = {
    height: '54px',
    background: '#232230', // mesma cor da sidebar
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1100,
    boxShadow: '0 2px 4px rgba(0,0,0,.25)',
  };

  const leftGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
  };

  const logoContainerStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none', // evita bloquear clique no hambúrguer
  };

  const logoLinkStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    textDecoration: 'none',
    pointerEvents: 'auto', // reabilita clique na própria logo
  };

  const logoImgStyle: React.CSSProperties = {
    maxHeight: isSmall ? '30px' : '40px',
    width: 'auto',
    objectFit: 'contain' as const,
    borderRadius: 8,
    display: 'block',
  };

  const userBlockStyle: React.CSSProperties = {
    textAlign: 'center',
    lineHeight: 1,
    minWidth: 160,
  };

  const [pwdOpen, setPwdOpen] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  const handleAlterarSenha = async () => {
    if (!user?.id) { setPwdMsg('Usuário não identificado.'); return; }
    if (!senhaAtual || !novaSenha || novaSenha.length < 6) { setPwdMsg('Preencha os campos. A nova senha deve ter ao menos 6 caracteres.'); return; }
    setSavingPwd(true); setPwdMsg(null);
    try {
      const resp = await apiClient.put('/usuario/alterarSenha', { id: user.id, senhaAtual, novaSenha });
      if (!resp.success) throw new Error(resp.error || 'Falha ao alterar senha');
      setPwdMsg('Senha alterada com sucesso.');
      setSenhaAtual(''); setNovaSenha('');
    } catch (e:any) {
      setPwdMsg(e.message || 'Erro ao alterar senha');
    } finally { setSavingPwd(false); }
  };

  return (
    <header style={headerStyle}>
      <div style={leftGroupStyle}>
        <button
          aria-label="Abrir menu"
          onClick={handleToggleSidebar}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '.35rem',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="bi bi-list" style={{ fontSize: '1.75rem', color: '#ffffffff' }} />
        </button>
      </div>

      <div style={logoContainerStyle}>
        {empresaImagem && empresaNome ? (
          <Link href="/paginaInicial" passHref legacyBehavior>
            <a style={logoLinkStyle} aria-label="Página inicial da instituição">
              <img src={empresaImagem} alt="Logo da instituicao" style={logoImgStyle} />
            </a>
          </Link>
        ) : (
          <p style={{ color: '#ccc', fontStyle: 'italic', fontSize: '0.9rem', margin: 0 }}>
            Sem instituição vinculada
          </p>
        )}
      </div>

      <div style={userBlockStyle}>
        <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{userName}</div>
        {userRole && (
          <div
            style={{
              fontSize: '.65rem',
              letterSpacing: '.5px',
              opacity: 0.85,
              marginTop: '6px',
            }}
          >
            {userRole.toUpperCase()}
          </div>
        )}
        <div style={{ marginTop: 6 }}>
          <button
            onClick={() => setPwdOpen(true)}
            style={{ background: 'transparent', border: '1px solid #666', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 12, cursor: 'pointer' }}
          >
            Alterar Senha
          </button>
        </div>
      </div>

      <Modal show={pwdOpen} onHide={() => setPwdOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Alterar Senha</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pwdMsg && <div className="alert alert-info py-2">{pwdMsg}</div>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Senha atual</Form.Label>
              <Form.Control type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Nova senha</Form.Label>
              <Form.Control type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
              <Form.Text>Mínimo de 6 caracteres.</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPwdOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleAlterarSenha} disabled={savingPwd}>
            {savingPwd ? 'Salvando...' : 'Salvar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </header>
  );
}
