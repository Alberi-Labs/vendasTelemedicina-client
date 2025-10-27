export type AppRole = 'admin' | 'vendedor' | 'gerente' | 'gestor' | 'cliente' | 'clientePJ' | 'vendedorFarmacia';

export interface AppModuleItem {
  key: string;               // identificador interno
  label: string;             // texto exibido
  path?: string;             // rota interna
  href?: string;             // link externo
  icon: string;              // classe do ícone bootstrap
  description?: string;      // descrição (usada na página inicial)
  roles: AppRole[];          // perfis autorizados
  group?: string;            // agrupamento opcional (ex: relatorios)
  sidebar?: boolean;         // se aparece na sidebar
  homepage?: boolean;        // se aparece na página inicial
  order?: number;            // ordenação opcional
}

// Definição única de módulos/funcionalidades
export const APP_MODULES: AppModuleItem[] = [
  {
    key: 'vendaPf',
    label: 'Venda Plano Telemedicina',
    path: '/paginaVendaPf',
    icon: 'bi-cash-coin',
    description: 'Venda planos mensais com acesso à telemedicina.',
    roles: ['admin', 'vendedor', 'gerente', 'gestor'],
    sidebar: true,
    homepage: true,
    order: 10,
  },
  {
    key: 'relatorioVendas',
    label: 'Relatório de Vendas',
    path: '/paginaRelatorioVendas',
    icon: 'bi-file-earmark-bar-graph',
    description: 'Acompanhe os resultados das vendas por período e vendedor.',
    roles: ['admin', 'gerente', 'gestor', 'vendedor'],
    sidebar: true,
    homepage: true,
    order: 20,
    group: 'relatorios'
  },
  {
    key: 'gestaoClientes',
    label: 'Gestão de Clientes',
    path: '/paginaGestaoClientes',
    icon: 'bi-people',
    description: 'Visualize, edite ou remova dados de clientes cadastrados.',
    roles: ['admin', 'vendedor', 'gerente', 'gestor'],
    sidebar: true,
    homepage: true,
    order: 30,
    group: 'relatorios'
  },
  {
    key: 'gestaoInstituicoes',
    label: 'Gestão de Instituições',
    path: '/paginaGestaoInstituicoes',
    icon: 'bi-building',
    description: 'Visualize, edite ou remova dados de instituições cadastradas.',
    roles: ['admin', 'gerente'],
    sidebar: true,
    homepage: true,
    order: 40,
    group: 'relatorios'
  },
  {
    key: 'telemedicina',
    label: 'Consultar com médico online',
    path: '/paginaTelemedicina',
    icon: 'bi-clipboard-heart',
    description: 'Acesse consultas online com médicos da plataforma.',
    roles: ['admin', 'cliente', 'clientePJ', 'gerente'],
    sidebar: true,
    homepage: true,
    order: 50,
  },
  {
    key: 'apolice',
    label: 'Baixar Apólice/Guia Explicativo',
    path: '/paginaApolice',
    icon: 'bi-download',
    description: 'Faça o download da sua apólice ou do guia do usuário.',
    roles: ['admin', 'cliente', 'clientePJ'],
    sidebar: true,
    homepage: true,
    order: 60,
  },
  {
    key: 'controleDependentes',
    label: 'Controle de Dependentes',
    path: '/paginaControleDependentes',
    icon: 'bi-people-fill',
    description: 'Adicione e edite dependentes vinculados ao seu plano.',
    roles: ['admin', 'clientePJ', 'cliente'],
    sidebar: true,
    homepage: true,
    order: 70,
  },
  {
    key: 'controlePagamento',
    label: 'Controle de Pagamento',
    path: '/paginaControlePagamento',
    icon: 'bi-credit-card',
    description: 'Visualize boletos, comprovantes e status de pagamentos.',
    roles: ['admin', 'gerente', 'cliente'],
    sidebar: true,
    homepage: true,
    order: 80,
  },
  {
    key: 'cancelamento',
    label: 'Cancelamento',
    path: '/paginaCancelamento',
    icon: 'bi-x-circle',
    description: 'Solicite o cancelamento do plano ou serviço contratado.',
    roles: ['admin', 'gerente', 'cliente'],
    sidebar: true,
    homepage: true,
    order: 90,
  },
  {
    key: 'gestaoUsuarios',
    label: 'Gestão de Usuários',
    path: '/paginaGestaoUsuarios',
    icon: 'bi-person-gear',
    description: 'Gerencie permissões e dados dos usuários do sistema.',
    roles: ['admin', 'gestor'],
    sidebar: true,
    homepage: true,
    order: 100,
    group: 'relatorios'
  },
  {
    key: 'dashboardFinanceiro',
    label: 'Dashboard Financeiro',
    path: '/paginaDashboardFinanceiro',
    icon: 'bi-bar-chart-line',
    description: 'Visualize gráficos e indicadores financeiros atualizados.',
    roles: ['admin', 'gerente'],
    sidebar: true,
    homepage: true,
    order: 110,
    group: 'relatorios'
  },
  {
    key: 'relatorioAsaas',
    label: 'Gestão de Pagamento Asaas',
    path: '/relatorioAsass',
    icon: 'bi-file-earmark-medical',
    description: 'Visualize e sincronize pagamentos via plataforma Asaas.',
    roles: ['admin'],
    sidebar: true,
    homepage: true,
    order: 120,
    group: 'relatorios'
  },
  {
    key: 'crmVendas',
    label: 'CRM de Vendas',
    path: '/crmVendas',
    icon: 'bi-file-earmark-medical',
    description: 'Visualize os dados de suas vendas.',
    roles: ['vendedor', 'gerente', 'admin'],
    sidebar: true,
    homepage: true,
    order: 130,
    group: 'relatorios'
  },
  {
    key: 'suporte',
    label: 'Suporte e Ajuda',
    href: 'https://wa.me/5561996363963',
    icon: 'bi-question-circle',
    description: 'Fale com nosso suporte via WhatsApp para tirar dúvidas.',
    roles: ['admin', 'cliente', 'clientePJ', 'vendedor', 'gerente', 'gestor', 'vendedorFarmacia'],
    sidebar: true,
    homepage: true,
    order: 1000,
  }
];

export function modulesForRole(role: string | undefined) {
  if (!role) return [] as AppModuleItem[];
  return APP_MODULES.filter(m => m.roles.includes(role as AppRole));
}

export function sidebarModules(role: string | undefined) {
  return modulesForRole(role).filter(m => m.sidebar).sort((a,b) => (a.order||0) - (b.order||0));
}

export function homepageModules(role: string | undefined) {
  return modulesForRole(role).filter(m => m.homepage).sort((a,b) => (a.order||0) - (b.order||0));
}
