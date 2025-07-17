# Configuração do Asaas para Vendas PJ

## Configuração das Variáveis de Ambiente

1. Crie um arquivo `.env.local` na raiz do projeto
2. Adicione a variável `ASAAS_API_KEY` com sua chave da API do Asaas

### Para Ambiente de Teste (Sandbox)
```bash
ASAAS_API_KEY=sua_chave_sandbox_aqui
```

### Para Ambiente de Produção
```bash
ASAAS_API_KEY=sua_chave_producao_aqui
```

## Como Obter a Chave da API Asaas

1. Acesse o painel do Asaas: https://www.asaas.com/
2. Faça login na sua conta
3. Vá em **Configurações** → **Integrações** → **Chaves de API**
4. Para teste, use a **Chave Sandbox**
5. Para produção, use a **Chave de Produção**

## Funcionalidades Implementadas

### Venda PJ Simples (sem funcionários)
- Endpoint: `/api/vendaPlanoPj/vendaClientePj`
- Gera cobrança no Asaas para a empresa
- Suporta: PIX, Boleto, Cartão de Crédito

### Venda PJ com Lista de Funcionários (via CSV)
- Endpoint: `/api/vendaPlanoPj/vendaPjSaudeECor`
- Processa arquivo CSV com dados dos funcionários
- Cadastra funcionários no sistema Saúde e Cor
- Gera cobrança no Asaas baseada no número de funcionários

## Fluxo de Pagamento

1. **Dados da Empresa**: Informações básicas da empresa
2. **Endereço**: Dados de localização
3. **Upload de Funcionários** (opcional): Arquivo CSV com lista de funcionários
4. **Pagamento**: Escolha da forma de pagamento e geração da cobrança

## Tipos de Cobrança Suportados

- **PIX**: Retorna QR Code para pagamento
- **Boleto**: Retorna link do boleto bancário
- **Cartão de Crédito**: Retorna link da página de pagamento

## Valor da Cobrança

- **Venda Simples**: Valor fixo do plano
- **Venda com Funcionários**: Valor do plano × número de funcionários

## Observações

- O sistema detecta automaticamente se está em desenvolvimento ou produção
- Em desenvolvimento, usa a URL sandbox do Asaas
- Em produção, usa a URL oficial da API
- Todas as cobranças têm vencimento de 7 dias após a criação
