# Exemplo de Uso da API Asaas

```typescript
import { asaasApiClient } from '@/lib/api-client';

// Exemplo 1: Buscar cliente por CPF
async function buscarClientePorCpf(cpf: string) {
  try {
    const response = await asaasApiClient.buscarCliente({ cpf });
    
    if (response.success && response.data.length > 0) {
      console.log('Cliente encontrado:', response.data[0]);
      return response.data[0];
    } else {
      console.log('Cliente não encontrado');
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return null;
  }
}

// Exemplo 2: Buscar todas as cobranças de um cliente
async function buscarCobrancasCliente(customerId: string) {
  try {
    const response = await asaasApiClient.buscarCobrancasCliente(customerId);
    
    if (response.success) {
      console.log(`Encontradas ${response.totalCount} cobranças:`, response.data);
      return response.data;
    } else {
      console.log('Nenhuma cobrança encontrada');
      return [];
    }
  } catch (error) {
    console.error('Erro ao buscar cobranças:', error);
    return [];
  }
}

// Exemplo 3: Buscar cobranças pendentes de um cliente
async function buscarCobrancasPendentes(customerId: string) {
  try {
    const response = await asaasApiClient.buscarCobrancasCliente(customerId, {
      status: 'PENDING'
    });
    
    if (response.success) {
      console.log(`${response.totalCount} cobranças pendentes:`, response.data);
      return response.data;
    } else {
      console.log('Nenhuma cobrança pendente');
      return [];
    }
  } catch (error) {
    console.error('Erro ao buscar cobranças pendentes:', error);
    return [];
  }
}

// Exemplo 4: Buscar cobranças por período
async function buscarCobrancasPorPeriodo(dataInicio: string, dataFim: string) {
  try {
    const response = await asaasApiClient.buscarCobrancas({
      dateCreatedGE: dataInicio,
      dateCreatedLE: dataFim,
      limit: 100
    });
    
    if (response.success) {
      console.log(`${response.totalCount} cobranças no período:`, response.data);
      return response.data;
    } else {
      console.log('Nenhuma cobrança encontrada no período');
      return [];
    }
  } catch (error) {
    console.error('Erro ao buscar cobranças por período:', error);
    return [];
  }
}

// Exemplo 5: Função completa de consulta de cliente e cobranças
async function consultarClienteCompleto(cpf: string) {
  // 1. Buscar cliente
  const cliente = await buscarClientePorCpf(cpf);
  
  if (!cliente) {
    return {
      cliente: null,
      cobrancas: [],
      cobrancasPendentes: [],
      totalCobrancas: 0
    };
  }
  
  // 2. Buscar todas as cobranças
  const cobrancas = await buscarCobrancasCliente(cliente.id);
  
  // 3. Buscar apenas cobranças pendentes
  const cobrancasPendentes = await buscarCobrancasPendentes(cliente.id);
  
  return {
    cliente,
    cobrancas,
    cobrancasPendentes,
    totalCobrancas: cobrancas.length
  };
}

// Uso da função completa
export async function exemploUso() {
  const cpf = '12345678901';
  const resultado = await consultarClienteCompleto(cpf);
  
  console.log('Resultado completo:', resultado);
  
  // Exibir informações resumidas
  if (resultado.cliente) {
    console.log(`Cliente: ${resultado.cliente.name}`);
    console.log(`Email: ${resultado.cliente.email}`);
    console.log(`Total de cobranças: ${resultado.totalCobrancas}`);
    console.log(`Cobranças pendentes: ${resultado.cobrancasPendentes.length}`);
    
    // Calcular valor total das cobranças pendentes
    const valorTotalPendente = resultado.cobrancasPendentes.reduce(
      (total, cobranca) => total + cobranca.value, 
      0
    );
    
    console.log(`Valor total pendente: R$ ${valorTotalPendente.toFixed(2)}`);
  } else {
    console.log('Cliente não encontrado');
  }
}
```

## Status e Tipos Comuns

```typescript
// Status de cobrança
export enum StatusCobranca {
  PENDING = 'PENDING',           // Aguardando pagamento
  RECEIVED = 'RECEIVED',         // Recebida (paga)
  OVERDUE = 'OVERDUE',          // Vencida
  REFUNDED = 'REFUNDED',        // Estornada
  RECEIVED_IN_CASH = 'RECEIVED_IN_CASH', // Recebida em dinheiro
}

// Tipos de cobrança
export enum TipoCobranca {
  BOLETO = 'BOLETO',           // Boleto bancário
  CREDIT_CARD = 'CREDIT_CARD', // Cartão de crédito
  DEBIT_CARD = 'DEBIT_CARD',   // Cartão de débito
  PIX = 'PIX',                 // PIX
  TRANSFER = 'TRANSFER',       // Transferência bancária
  DEPOSIT = 'DEPOSIT',         // Depósito identificado
}
```

## Interface para tipagem TypeScript

```typescript
export interface ClienteAsaas {
  object: 'customer';
  id: string;
  dateCreated: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  mobilePhone: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface CobrancaAsaas {
  object: 'payment';
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink: string;
  value: number;
  netValue: number;
  originalValue: number;
  interestValue: number;
  description: string;
  billingType: string;
  status: string;
  pixTransaction: any;
  dueDate: string;
  originalDueDate: string;
  paymentDate: string;
  clientPaymentDate: string;
  installmentNumber: number;
  transactionReceiptUrl: string;
  nossoNumero: string;
  invoiceUrl: string;
  bankSlipUrl: string;
  invoiceNumber: string;
}

export interface ResponseAsaas<T> {
  success: boolean;
  data: T[];
  totalCount: number;
  hasMore: boolean;
  error?: string;
}
```