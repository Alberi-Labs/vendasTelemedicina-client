import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';

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
        setUserRole(parsed?.role || '');
      } catch (e) {
        console.error('Erro parse user localStorage', e);
      }
    } else if (user) {
      setUserName(user?.nome || 'Usuário');
      setUserRole(user?.role || '');
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
      </div>
    </header>
  );
}
