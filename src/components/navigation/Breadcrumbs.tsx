import { useRouter } from 'next/router';
import Link from 'next/link';
import { modulesForRole } from '@/config/modulesConfig';
import { useAuth } from '@/app/context/AuthContext';
import { useMemo } from 'react';

/**
 * Breadcrumbs dinâmicos baseados em pathname.
 * Regras:
 * - Sempre começa em Página Inicial (/paginaInicial) se usuário logado.
 * - Segmentos subsequentes são acumulados se existirem rotas correspondentes.
 * - Último segmento não vira link.
 */
export default function Breadcrumbs() {
  const router = useRouter();
  const { user } = useAuth();
  const path = router.pathname; // ex: /paginaRelatorioVendas

  // Esconder em rotas de login/manutenção
  if (['/', '/manutencao', '/paginaInicial', '/loginCliente', '/loginFuncionario'].includes(path)) return null;

  const allowedModules = modulesForRole(user?.perfil);
  const byPath = new Map<string, string>();
  allowedModules.forEach(m => { if (m.path) byPath.set(m.path, m.label); });

  const segments = useMemo(() => {
    const parts = path.split('/').filter(Boolean); // remove vazio
    const acc: { href: string; label: string }[] = [];
    let cumulative = '';
    for (const p of parts) {
      cumulative += '/' + p;
      const label = byPath.get(cumulative) || p;
      acc.push({ href: cumulative, label });
    }
    return acc;
  }, [path, byPath]);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className="px-3 pt-3">
      <ol className="breadcrumb mb-2" style={{ background: 'transparent' }}>
        <li className="breadcrumb-item">
          <Link href="/paginaInicial">Início</Link>
        </li>
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;
          return (
            <li
              key={seg.href}
              className={`breadcrumb-item ${isLast ? 'active' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {isLast ? (
                <span>{seg.label}</span>
              ) : (
                <Link href={seg.href}>{seg.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
