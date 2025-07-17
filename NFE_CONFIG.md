# Configuração de Notas Fiscais Eletrônicas via Asaas

## ⚡ Integração com Asaas (Recomendado)

O Asaas oferece emissão automática de notas fiscais diretamente integrada com as assinaturas, simplificando todo o processo.

### Variáveis de Ambiente Necessárias

Adicione estas variáveis no seu arquivo `.env.local`:

```bash
# API do Asaas para Notas Fiscais
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_API_TOKEN=seu_token_do_asaas

# Para produção, altere para:
# ASAAS_API_URL=https://asaas.com/api/v3
```

## 📋 Configuração no Asaas

1. **Ative o módulo de Notas Fiscais** na sua conta Asaas
2. **Configure os dados da empresa emitente**
3. **Defina as alíquotas de impostos**
4. **Configure certificado digital** (se necessário)

### Exemplo de Configuração de Impostos

```javascript
const configImpostos = {
  retainIss: false,      // Não reter ISS
  iss: 5,                // 5% de ISS
  cofins: 3,             // 3% de COFINS  
  pis: 0.65,             // 0.65% de PIS
  csll: 1,               // 1% de CSLL (opcional)
  ir: 0,                 // 0% de IR (opcional)
  inss: 0                // 0% de INSS (opcional)
};
```

## 🚀 Fluxo de Emissão com Asaas (Atualizado)

O Asaas funciona com **configuração automática** de notas fiscais, não emissão manual:

1. **Assinatura Criada** ➜ Sistema cria assinatura no Asaas
2. **Configurar NF** ➜ Usuário clica em "Configurar Nota Fiscal" 
3. **Chamada API** ➜ `POST /subscriptions/{id}/invoiceSettings`
4. **Configuração** ➜ Asaas configura emissão automática para futuras cobranças
5. **Emissão Automática** ➜ Notas são emitidas automaticamente quando cobranças são pagas
6. **Consulta** ➜ `GET /invoices?subscription={id}` para listar notas emitidas

### Exemplo de Configuração

```javascript
// Configurar emissão automática de NF para uma assinatura
const response = await fetch(`${ASAAS_API_URL}/subscriptions/${assinaturaId}/invoiceSettings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_TOKEN
  },
  body: JSON.stringify({
    serviceDescription: 'Assinatura Plano Saúde e Cor PJ - 12 meses',
    observations: 'Assinatura de plano de saúde empresarial',
    externalReference: 'sub_123456789',
    effectiveDatePeriod: 'ON_PAYMENT_CONFIRMATION', // Emitir quando pago
    municipalServiceCode: '07498', // Código para planos de saúde
    taxes: {
      retainIss: false,
      iss: 5,
      cofins: 3,
      pis: 0.65
    }
  })
});
```

### Períodos de Emissão Disponíveis

- `ON_PAYMENT_CONFIRMATION` - ✅ **Recomendado**: Emitir quando cobrança for paga
- `ON_PAYMENT_DUE_DATE` - No dia do vencimento
- `BEFORE_PAYMENT_DUE_DATE` - Dias antes do vencimento (5, 10, 15, 30, 60)
- `ON_DUE_DATE_MONTH` - No 1º dia do mês do vencimento
- `ON_NEXT_MONTH` - No 1º dia do mês seguinte

## 🔄 Alternativa: APIs Externas de NFe

Caso prefira usar APIs especializadas em NFe:

## ✅ Vantagens da Integração Asaas

- **Simplicidade**: Uma única API para pagamentos e notas fiscais
- **Automação**: Emissão automática para cada cobrança
- **Compliance**: Totalmente integrado com a SEFAZ
- **Economia**: Sem custos adicionais de APIs externas
- **Suporte**: Suporte técnico unificado
- **Relatórios**: Dashboard integrado de cobrança e fiscalização

## 📊 Monitoramento e Consultas

```javascript
// Consultar status de uma NF
GET /subscriptions/{id}/invoices/{invoiceId}

// Listar todas as NFs de uma assinatura  
GET /subscriptions/{id}/invoices

// Baixar PDF da NF
GET /invoices/{id}/pdf
```

## 🛠️ Configuração de Produção

1. **Altere a URL da API** para produção
2. **Configure certificado digital** da empresa
3. **Teste emissão** em ambiente de homologação
4. **Valide impostos** com seu contador
5. **Configure backups** dos XMLs/PDFs gerados

---

## 🔄 Alternativa: APIs Externas de NFe (Opcional)

Caso prefira usar APIs especializadas:
- **URL:** https://focusnfe.com.br
- **Documentação:** https://focusnfe.com.br/doc/
- **Recursos:** NFe, NFCe, NFSe, MDFe, CTe
- **Preço:** A partir de R$ 0,15 por documento

### 2. WebMania
- **URL:** https://webmaniabr.com
- **Documentação:** https://webmaniabr.com/docs/rest-api-nfe/
- **Recursos:** NFe, NFCe, NFSe
- **Preço:** A partir de R$ 0,18 por documento

### 3. EnoTag
- **URL:** https://enotag.com.br
- **Documentação:** https://enotag.com.br/documentacao
- **Recursos:** NFe, NFCe, NFSe, CTe
- **Preço:** A partir de R$ 0,20 por documento

## Configuração Focus NFe (Exemplo)

```javascript
// Exemplo de configuração para Focus NFe
const NFE_CONFIG = {
  token: process.env.NFE_API_TOKEN,
  baseURL: process.env.NFE_API_URL,
  endpoints: {
    nfe: '/v2/nfe',
    consulta: '/v2/nfe/{ref}',
    cancelamento: '/v2/nfe/{ref}/cancelamento'
  }
};
```

## Estrutura de Dados NFe

```json
{
  "natureza_operacao": "Prestação de serviços",
  "data_emissao": "2024-07-16",
  "tipo_documento": "1",
  "serie_documento": "001",
  "numero_documento": "000001",
  "cnpj_emitente": "12345678000195",
  "nome_emitente": "Vita Saúde e Cor LTDA",
  "cnpj_destinatario": "98765432000110",
  "nome_destinatario": "Empresa Cliente LTDA",
  "valor_total": 299.90,
  "itens": [
    {
      "numero_item": "1",
      "codigo_produto": "PLANO-SAUDE-PJ",
      "descricao": "Assinatura Plano Saúde e Cor PJ - 12 meses",
      "quantidade": 1,
      "unidade": "UN",
      "valor_unitario": 299.90,
      "valor_total": 299.90,
      "cfop": "5933",
      "ncm": "99999999"
    }
  ]
}
```

## Fluxo de Emissão

1. **Validação dos Dados**
   - Verificar CNPJ válido
   - Validar valor da assinatura
   - Confirmar dados da empresa

2. **Geração do Número**
   - Buscar próximo número sequencial
   - Verificar série configurada

3. **Emissão via API**
   - Enviar dados para API de NFe
   - Aguardar autorização da SEFAZ
   - Receber chave de acesso

4. **Armazenamento**
   - Salvar dados no banco local
   - Associar à assinatura
   - Gerar PDF/XML para download

## Tratamento de Erros

- **Rejeição SEFAZ:** Corrigir dados e reenviar
- **Timeout API:** Implementar retry automático
- **Dados inválidos:** Validar antes do envio
- **Limite de documentos:** Controlar cota mensal

## Relatórios e Consultas

- Notas emitidas por período
- Status de autorização
- Cancelamentos realizados
- Faturamento mensal
- Impostos recolhidos
