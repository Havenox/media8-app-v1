# 064 - API: Refatoracao para PascalCase e Enriquecimento de Saldo com Snapshot

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 24/05/2026

---

## 🚀 Desafio de Engenharia

A API de Contratos e Saldos passou por uma série de melhorias arquiteturais para garantir conformidade com os padrões do ecossistema .NET e fornecer dados mais ricos ao frontend. Os principais desafios foram:

1. **Violação de Convenção (.NET PascalCase):** A documentação e as rotas estavam usando kebab-case (`/client-contracts`) e camelCase nos payloads JSON, violando a soberania do backend .NET que dita PascalCase como padrão.

2. **Contrato Pobre de Saldo:** O endpoint `GET /api/v1/ServiceBalances/MyBalances` retornava apenas `ServiceName` e `PackageName` (nomes genéricos), ocultando os dados críticos de Snapshot Técnico (`SnapshotVideoFormatName`, `SnapshotMaxDurationSeconds`) e o tipo de contrato (`ContractType`), forçando o frontend a fazer múltiplas chamadas para montar o dashboard do usuário.

3. **Serialização Incorreta:** O JSON serializer estava configurado para converter propriedades PascalCase para camelCase na rede, gerando inconsistência entre DTOs C# e payloads HTTP.

## 🧠 Estratégia da Solução

A solução foi dividida em três frentes de atuação simultâneas:

1. **Soberania do PascalCase:** Alterar todas as rotas de controllers (`ClientContractsController`, `ServiceBalancesController`) para usar PascalCase nativo do .NET, eliminando kebab-case.

2. **Enriquecimento de DTO:** Refatorar o `UnifiedServiceBalanceDto` para remover campos genéricos (`ServiceName`, `PackageName`) e adicionar todos os campos de Snapshot Comercial e Técnico, espelhando a estrutura do `ClientContract`.

3. **Configuração de Serialização:** Ajustar o `Program.cs` para definir `PropertyNamingPolicy = null`, garantindo que o JSON de saída mantenha exatamente os nomes das propriedades C# (PascalCase), sem conversão automática para camelCase.

## 🛠️ Implementação Técnica

### Backend (.NET 10 / C# 13)

#### 1. Controllers (Rotas PascalCase)
- **`ClientContractsController.cs`**: Route alterado de `[Route("api/v1/client-contracts")]` para `[Route("api/v1/ClientContracts")]`
- **`ServiceBalancesController.cs`**: Route alterado de `[Route("api/v1/service-balances")]` para `[Route("api/v1/ServiceBalances")]`

#### 2. DTOs (Campos de Snapshot)
- **`ServiceBalanceDtos.cs`**: 
  - Removido: `ServiceName`, `PackageName`
  - Adicionado: `SnapshotOfferName`, `SnapshotVideoQuantity`, `SnapshotVideoFormatName`, `SnapshotEditingStyleName`, `SnapshotMaxDurationSeconds`, `ContractType`
  - Mantido: `RemainingQuantity`, `TotalQuantity`, `ExpiresAt`, `PurchaseDate`, `Status`

#### 3. Mapeamento (Projeção de Dados)
- **`ServiceBalancesController.cs`**: Método `MapToUnifiedDto` refatorado para projetar todos os campos de snapshot do `ClientContract` para o DTO, incluindo conversão de `ContractType` (enum) para string.

#### 4. Serialização JSON
- **`Program.cs`**: Adicionado `options.JsonSerializerOptions.PropertyNamingPolicy = null` para preservar PascalCase nativo na saída HTTP.

### Documentação

#### 1. Consumo_Contratos_Snapshot_API.md
- Todas as URLs de endpoints corrigidas para PascalCase (`/ClientContracts`, `/ServiceBalances/MyBalances`)
- Parâmetros de query atualizados para PascalCase (`ClientId`, `Status`, `Page`, `PageSize`)
- Campos JSON em PascalCase (`SnapshotOfferName`, `SnapshotVideoFormatName`, etc.)
- Exemplos TypeScript atualizados para usar `contract.SnapshotVideoFormatName`
- Interfaces TypeScript migradas para PascalCase
- Guia de migração de camelCase para PascalCase incluído

## 🎯 Impacto e Resultado

* **Consistência Arquitetural**: 100% PascalCase em rotas, payloads e documentação, alinhado aos padrões .NET.
* **Dashboard Rico**: Frontend recebe todos os dados de snapshot em única chamada, eliminando N+1 queries.
* **Metadata Injection**: `ContractType` disponível para UI de planos e regras de negócio.
* **Validação Completa**: Snapshot técnico (`SnapshotVideoFormatName`, `SnapshotMaxDurationSeconds`) disponível para validação de pedidos.
* **Zero Ambiguidade**: Mesmos nomes em C#, JSON e TypeScript, reduzindo carga cognitiva.
* **Documentação Viva**: Guia de consumo reflete exatamente o contrato atual da API.

---

**Nota do Desenvolvedor:** *Esta refatoração consolida o princípio de que "o backend dita a lei" no ecossistema Media8. Ao forçar PascalCase em todas as camadas (rotas, DTOs, JSON, documentação), eliminamos ambiguidades e garantimos que a evolução da API seja previsível e padronizada. O enriquecimento do DTO de saldo com dados de snapshot é um investimento que evita idas e voltas ao banco de dados, entregando valor agregado ao frontend em uma única requisição leve.*
