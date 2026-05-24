# Guia de Consumo da API de Contratos com Snapshot Pattern

> **Documento Técnico para Equipe de Frontend**  
> **Versão:** 1.0  
> **Última Atualização:** 24/05/2026  
> **Status:** ✅ Implementado em Produção

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Endpoints Mapeados](#endpoints-mapeados)
3. [Estruturas de Payload](#estruturas-de-payload)
4. [Dicionário de Campos Primitivos](#dicionário-de-campos-primitivos)
5. [Diretrizes para o Frontend](#diretrizes-para-o-frontend)
6. [Exemplos de Uso](#exemplos-de-uso)

---

## Visão Geral

A API de Contratos do Media8 foi refatorada para adotar o **Snapshot Pattern**, que garante a imutabilidade dos contratos comerciais. Este padrão arquitetural assegura que:

- ✅ **Contratos são históricos**: Uma vez assinado, o contrato preserva os dados exatos da oferta no momento da contratação
- ✅ **Zero dependência de configurações dinâmicas**: O contrato não usa FKs para formatos de vídeo ou estilos de edição
- ✅ **Auditoria completa**: Mesmo que a oferta original seja alterada/excluída, o contrato do cliente permanece intacto
- ✅ **Segurança jurídica**: Foto exata do momento da assinatura é preservada

### O Que Mudou?

**Antes (Com FKs - Vulnerável):**
```json
{
  "offerId": "guid-da-oferta",
  "videoFormatId": "guid-do-formato",  // FK viva - muda se formato mudar
  "editingStyleId": "guid-do-estilo"   // FK viva - muda se estilo mudar
}
```

**Depois (Snapshot - Imutável):**
```json
{
  "offerId": "guid-da-oferta",
  "snapshotVideoFormatName": "Reels Premium",  // String imutável
  "snapshotEditingStyleName": "Corporativo",   // String imutável
  "snapshotMaxDurationSeconds": 60             // Número imutável
}
```

---

## Endpoints Mapeados

### 1. Listar Todos os Contratos

**Endpoint:** `GET /api/v1/ClientContracts`  
**Acesso:** Admin  
**Descrição:** Lista todos os contratos de clientes com filtros opcionais

#### Parâmetros de Query (Opcionais)

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `ClientId` | `Guid?` | Filtra por ID do cliente |
| `Status` | `AssignmentStatus?` | Filtra por status (`active`, `cancelled`, `expired`) |

#### Exemplo de Requisição

```bash
GET /api/v1/ClientContracts?ClientId=123e4567-e89b-12d3-a456-426614174000&Status=active
Authorization: Bearer {token}
```

#### Exemplo de Resposta (200 OK)

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "offerId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "clientId": "123e4567-e89b-12d3-a456-426614174000",
    "assignedBy": "admin-user-id",
    
    "snapshotOfferName": "Plano Growth",
    "snapshotVideoQuantity": 10,
    "snapshotPrice": 299.90,
    "snapshotValidityDays": 30,
    "snapshotDeliveryDays": 7,
    "snapshotWarrantyDays": 90,
    
    "snapshotVideoFormatName": "Reels Premium",
    "snapshotEditingStyleName": "Corporativo",
    "snapshotMaxDurationSeconds": 60,
    
    "assignedAt": "2026-05-24T10:00:00Z",
    "activatedAt": "2026-05-24T10:00:00Z",
    "expiresAt": "2026-06-23T10:00:00Z",
    "status": "active",
    "createdAt": "2026-05-24T10:00:00Z",
    "updatedAt": "2026-05-24T10:00:00Z"
  }
]
```

---

### 2. Buscar Contrato por ID

**Endpoint:** `GET /api/v1/ClientContracts/{id}`  
**Acesso:** Authenticated (Client vê apenas o próprio, Admin vê todos)  
**Descrição:** Busca um contrato específico por ID

#### Exemplo de Requisição

```bash
GET /api/v1/ClientContracts/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer {token}
```

#### Exemplo de Resposta (200 OK)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "offerId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "assignedBy": "admin-user-id",
  
  "snapshotOfferName": "Plano Growth",
  "snapshotVideoQuantity": 10,
  "snapshotPrice": 299.90,
  "snapshotValidityDays": 30,
  "snapshotDeliveryDays": 7,
  "snapshotWarrantyDays": 90,
  
  "snapshotVideoFormatName": "Reels Premium",
  "snapshotEditingStyleName": "Corporativo",
  "snapshotMaxDurationSeconds": 60,
  
  "assignedAt": "2026-05-24T10:00:00Z",
  "activatedAt": "2026-05-24T10:00:00Z",
  "expiresAt": "2026-06-23T10:00:00Z",
  "status": "active",
  "createdAt": "2026-05-24T10:00:00Z",
  "updatedAt": "2026-05-24T10:00:00Z"
}
```

---

### 3. Criar Novo Contrato

**Endpoint:** `POST /api/v1/ClientContracts`  
**Acesso:** Admin  
**Descrição:** Cria um novo contrato (atribuição de oferta a um cliente)

#### Body da Requisição

```json
{
  "OfferId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "ClientId": "123e4567-e89b-12d3-a456-426614174000",
  "AssignedByUserId": "admin-user-id"
}
```

#### Exemplo de Requisição

```bash
POST /api/v1/ClientContracts
Content-Type: application/json
Authorization: Bearer {token}

{
  "OfferId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "ClientId": "123e4567-e89b-12d3-a456-426614174000",
  "AssignedByUserId": "admin-user-id"
}
```

#### Exemplo de Resposta (201 Created)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "offerId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "assignedBy": "admin-user-id",
  
  "snapshotOfferName": "Plano Growth",
  "snapshotVideoQuantity": 10,
  "snapshotPrice": 299.90,
  "snapshotValidityDays": 30,
  "snapshotDeliveryDays": 7,
  "snapshotWarrantyDays": 90,
  
  "snapshotVideoFormatName": "Reels Premium",
  "snapshotEditingStyleName": "Corporativo",
  "snapshotMaxDurationSeconds": 60,
  
  "assignedAt": "2026-05-24T10:00:00Z",
  "activatedAt": "2026-05-24T10:00:00Z",
  "expiresAt": "2026-06-23T10:00:00Z",
  "status": "active",
  "createdAt": "2026-05-24T10:00:00Z",
  "updatedAt": "2026-05-24T10:00:00Z"
}
```

#### Respostas de Erro

**400 Bad Request - Oferta sem formato de vídeo:**
```json
{
  "message": "Oferta não possui formato de vídeo associado."
}
```

**404 Not Found - Oferta não encontrada:**
```json
{
  "message": "Oferta com ID {guid} não encontrada."
}
```

**500 Internal Server Error - Erro ao provisionar saldos:**
```json
{
  "message": "Erro ao provisionar saldos: {detalhe-do-erro}"
}
```

---

### 4. Listar Meus Saldos

**Endpoint:** `GET /api/v1/ServiceBalances/MyBalances`  
**Acesso:** Authenticated  
**Descrição:** Lista saldos de serviço do usuário autenticado

#### Parâmetros de Query (Opcionais)

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `Page` | `int` | `1` | Página para paginação |
| `PageSize` | `int` | `20` | Tamanho da página |
| `Status` | `string` | `"active"` | Filtro por status (`active`, `expired`, `depleted`) |

#### Exemplo de Requisição

```bash
GET /api/v1/ServiceBalances/MyBalances?Page=1&PageSize=20&Status=active
Authorization: Bearer {token}
```

#### Exemplo de Resposta (200 OK)

```json
[
  {
    "id": "balance-id-guid",
    "serviceName": "Reels Premium",
    "packageName": "Plano Growth",
    "remainingQuantity": 8,
    "totalQuantity": 10,
    "expiresAt": "2026-06-23T10:00:00Z",
    "purchaseDate": "2026-05-24T10:00:00Z",
    "status": "active"
  }
]
```

**Headers de Resposta:**
```
X-Total-Count: 1
```

---

## Dicionário de Campos Primitivos

### Snapshot Comercial

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `SnapshotOfferName` | `string` | Nome da oferta no momento da contratação | `"Plano Growth"` |
| `SnapshotVideoQuantity` | `int` | Quantidade total de vídeos inclusos | `10` |
| `SnapshotPrice` | `decimal` | Preço pago na contratação | `299.90` |
| `SnapshotValidityDays` | `int?` | Dias de validade do contrato | `30` |
| `SnapshotDeliveryDays` | `int?` | Prazo de entrega em dias | `7` |
| `SnapshotWarrantyDays` | `int?` | Tempo de garantia/fidelidade em dias | `90` |

### Snapshot Técnico

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `SnapshotVideoFormatName` | `string` | **Nome do formato de vídeo** (copia o NOME, não o ID) | `"Reels Premium"` |
| `SnapshotEditingStyleName` | `string` | **Nome do estilo de edição** (copia o NOME, não o ID) | `"Corporativo"` |
| `SnapshotMaxDurationSeconds` | `int` | Duração máxima em segundos | `60` |

### Campos de Navegação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `OfferId` | `Guid` | ID da oferta original (para rastreabilidade) |
| `ClientId` | `Guid` | ID do cliente dono do contrato |
| `AssignedBy` | `Guid` | ID do admin que atribuiu o contrato |
| `AssignedAt` | `DateTime` | Data de atribuição do contrato |
| `ActivatedAt` | `DateTime` | Data de ativação do contrato |
| `ExpiresAt` | `DateTime?` | Data de expiração do contrato |
| `Status` | `AssignmentStatus` | Status do contrato (`active`, `cancelled`, `expired`) |

---

## Diretrizes para o Frontend

### 1. Lendo Contratos para o Fluxo em Cascata

Ao criar um novo pedido, o frontend deve:

```typescript
// 1. Buscar contratos do cliente
const contracts = await clientContracts.query();

// 2. Para cada contrato, extrair o snapshot técnico
contracts.forEach(contract => {
  const videoFormat = contract.SnapshotVideoFormatName; // "Reels Premium"
  const editingStyle = contract.SnapshotEditingStyleName; // "Corporativo"
  const maxDuration = contract.SnapshotMaxDurationSeconds; // 60
  
  // 3. Usar para popular selects do formulário de pedidos
  //    (não faz FK para VideoFormat/EditingStyle)
});
```

### 2. Validando Formato de Vídeo no Pedido

```typescript
// ✅ CORRETO: Ler do snapshot do contrato
const contract = await getContractByBalanceId(balanceId);
const videoFormatName = contract.SnapshotVideoFormatName;

// ❌ ERRADO: Tentar acessar FK que não existe mais
// const videoFormatId = contract.videoFormatId; // Não existe!
```

### 3. Exibindo Histórico de Contratos

```typescript
// O snapshot preserva dados originais
// Mesmo que a oferta mude de nome, o contrato mostra o nome original
contract.SnapshotOfferName; // Sempre o nome original da oferta
contract.SnapshotPrice;     // Sempre o preço original pago
```

### 4. Tratando Expiração de Contratos

```typescript
const isExpired = contract.ExpiresAt && new Date(contract.ExpiresAt) < new Date();
const status = isExpired ? 'expired' : contract.Status;

// Frontend deve verificar ExpiresAt E Status
```

---

## Exemplos de Uso

### Exemplo 1: Listar Contratos Ativos de um Cliente

```typescript
const response = await fetch(
  '/api/v1/ClientContracts?ClientId=123e4567-e89b-12d3-a456-426614174000&Status=active',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const contracts = await response.json();

contracts.forEach(contract => {
  console.log(`Contrato: ${contract.SnapshotOfferName}`);
  console.log(`Formato: ${contract.SnapshotVideoFormatName}`);
  console.log(`Estilo: ${contract.SnapshotEditingStyleName}`);
  console.log(`Duração Máx: ${contract.SnapshotMaxDurationSeconds}s`);
});
```

### Exemplo 2: Criar Contrato e Extrair Snapshots

```typescript
const createResponse = await fetch('/api/v1/ClientContracts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    OfferId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    ClientId: '123e4567-e89b-12d3-a456-426614174000',
    AssignedByUserId: 'admin-user-id'
  })
});

const contract = await createResponse.json();

// Extrair snapshots para uso posterior
const snapshot = {
  offerName: contract.SnapshotOfferName,
  videoFormat: contract.SnapshotVideoFormatName,
  editingStyle: contract.SnapshotEditingStyleName,
  maxDuration: contract.SnapshotMaxDurationSeconds,
  quantity: contract.SnapshotVideoQuantity,
  price: contract.SnapshotPrice
};
```

### Exemplo 3: Listar Saldos com Nomes do Snapshot

```typescript
const response = await fetch('/api/v1/ServiceBalances/MyBalances', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const balances = await response.json();

balances.forEach(balance => {
  // ServiceName vem do snapshot do contrato
  console.log(`Serviço: ${balance.ServiceName}`); // "Reels Premium"
  console.log(`Pacote: ${balance.PackageName}`);   // "Plano Growth"
  console.log(`Restante: ${balance.RemainingQuantity}/${balance.TotalQuantity}`);
});
```

---

## Notas Importantes

### ✅ Boas Práticas

1. **Sempre ler snapshots**: Use `snapshot*` fields para exibir dados do contrato
2. **Validar expiração**: Verifique `expiresAt` e `status` antes de permitir ações
3. **Tratar nulos**: Campos snapshot podem ser `null` em contratos legados
4. **Preservar histórico**: Não tente "atualizar" snapshots - eles são imutáveis por design

### ❌ Armadilhas a Evitar

1. **Não criar FKs**: Não tente buscar `VideoFormat` ou `EditingStyle` por ID do contrato
2. **Não sobrescrever**: Snapshots são históricos - não os modifique após criação
3. **Não confiar apenas em `offerId`**: Use snapshots para dados comerciais/técnicos
4. **Não ignorar expiração**: Contratos expirados não podem gerar novos pedidos

---

## Migração de Contratos Legados

Se sua aplicação frontend ainda usa a estrutura antiga:

### Estrutura Antiga (Legado)
```typescript
interface OldContract {
  offerId: string;
  videoFormatId: string; // ❌ Não existe mais
  editingStyleId: string; // ❌ Não existe mais
}
```

### Estrutura Nova (Snapshot Pattern)
```typescript
interface NewContract {
  OfferId: string;
  SnapshotVideoFormatName: string; // ✅ String imutável
  SnapshotEditingStyleName: string;  // ✅ String imutável
  SnapshotMaxDurationSeconds: number;  // ✅ Número imutável
}
```

### Guia de Migração

```typescript
// ANTES
const formatId = contract.videoFormatId;
const styleId = contract.editingStyleId;

// DEPOIS
const formatName = contract.SnapshotVideoFormatName;
const styleName = contract.SnapshotEditingStyleName;
const maxDuration = contract.SnapshotMaxDurationSeconds;
```

---

## Suporte e Dúvidas

Para dúvidas sobre consumo da API ou implementação do Snapshot Pattern:

1. Consulte este documento primeiro
2. Verifique os DTOs em `Media8.Application/DTOs/Offers/ClientContractDtos.cs`
3. Revise os controllers em `Media8.Api/Controllers/ClientContractsController.cs`

---

**Documentação gerada em:** 24/05/2026  
**Última revisão:** 24/05/2026  
**Próxima revisão:** Após implementação do frontend
