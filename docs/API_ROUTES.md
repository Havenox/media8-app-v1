# Media 8 - Referência de API

> **Spec**: RESTful API v1 sobre HTTP/2. Respostas sempre em JSON.

---

## Sumário

1. [Base URL & Auth](#base-url--auth)
2. [Endpoints Essenciais](#endpoints-essenciais)
3. [Exemplos de Payload](#exemplos-de-payload)

---

## Base URL & Auth

**Production**: `https://api.media8.com.br/api/v1`
**Header**: `Authorization: Bearer <token>`

### Padrão de Resposta (Envelope)

```json
{
  "success": true,
  "data": { ... }, // Objeto ou Array
  "message": "Operação realizada",
  "errors": null
}
```

---

## Endpoints Essenciais

### 👤 Usuários

| Método | Endpoint | Regra |
|--------|----------|-------|
| `POST` | `/auth/login` | Acesso público. Retorna JWT. |
| `GET`  | `/users` | Admin único. Suporta `?search=` e `?page=`. |
| `GET`  | `/users/me` | Dados do próprio usuário logado. |

### 📦 Pacotes (Catálogo)

| Método | Endpoint | Regra |
|--------|----------|-------|
| `GET`  | `/packages` | Público (Landing Page). Lista apenas ativos. |
| `POST` | `/packages` | Admin. Cria novo produto. |
| `DELETE`| `/packages/:id` | Admin. **Safe Delete** (Falha se houver contratos). |

### 📜 Atribuições (Contratos)

| Método | Endpoint | Regra |
|--------|----------|-------|
| `GET`  | `/assignments/client/:id` | Lista contratos de um cliente específico. |
| `POST` | `/assignments` | Admin. Transforma um Pacote em Contrato para o Cliente. |

### 💰 Saldos (Service Balances) - **Core Feature**

| Método | Endpoint | Regra |
|--------|----------|-------|
| `GET`  | `/service-balances/my-balances` | **Single Source of Truth** para o cliente. Lista lotes disponíveis. |
| `POST` | `/service-balances/consume` | Consome 1 unidade de saldo (FIFO). |

---

## Exemplos de Payload

### 1. Criar Pacote (Shorts Edition)

Note a propriedade `maxDurationSeconds`.

```json
POST /packages
{
  "name": "Pacote Reels Viral",
  "category": "pacote",
  "price": 499.90,
  "videoQuantity": 10,
  "maxDurationSeconds": 60,  // <-- Atualizado v1.2
  "serviceTypes": ["reels_standard"],
  "features": ["Legendas", "Cortes Dinâmicos"]
}
```

### 2. Meus Saldos (Response)

Estrutura flat otimizada para listagem UI.

```json
GET /service-balances/my-balances
{
  "data": [
    {
      "id": "uuid-do-lote-1",
      "serviceName": "Reels Standard",
      "packageName": "Pacote Reels Viral",
      "remainingQuantity": 5,
      "totalQuantity": 10,
      "expiresAt": "2024-12-31T23:59:59Z",
      "status": "active"
    }
  ]
}
```

### 3. Pedido de Edição

```json
POST /orders
{
  "title": "Vídeo 01 - Lançamento",
  "briefing": "Cortar aos 15s...",
  "sourceFilesUrl": "https://drive...",
  "serviceType": "reels_standard",
  "deadline": "2024-10-20"
}
```
---
**Nota**: Documentação completa via Swagger em `/swagger` no ambiente de desenvolvimento.
