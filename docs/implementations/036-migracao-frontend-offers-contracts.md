# 036 - Frontend: Migração da Engine de Packages para Offers/Contracts

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

Com a refatoração completa do backend (Épico 3) que substituiu a modelo `Package` por `Offer` e `ClientContract`, o frontend React estava obsoleto e incompatível. O código existente referenciava `packageService`, `usePackages` e tipos `Package`, gerando:
- **Erros de compilação** devido a rotas de API inexistentes (`/api/v1/packages`)
- **Quebra de funcionalidades** de listagem e atribuição de contratos
- **Impossibilidade** de consumir os novos endpoints baseados em Snapshot Pattern

Era necessário migrar toda a camada de estado (Types, Services, Hooks) para espelhar a nova arquitetura do backend sem quebrar a interface do usuário.

## 🧠 Estratégia da Solução

A migração foi executada em 4 fases atômicas com commits independentes para garantir rastreabilidade e permitir rollback seguro:

1. **Tipagem Estrita**: Criação de `offers.ts` com interfaces espelhando DTOs do C# (`Offer`, `ClientContract`, `CreateOfferRequest`), incluindo enum `ContractType` ('Avulso' | 'Pacote' | 'Assinatura').
2. **Camada HTTP**: Implementação de `offerService.ts` e `clientContractService.ts` usando Axios, centralizando chamadas para `/api/v1/offers` e `/api/v1/client-contracts`.
3. **Gerenciamento de Estado**: Criação de hooks TanStack Query (`useOffers`, `useClientContracts`) com invalidação automática de cache após mutations.
4. **Purga do Legado**: Remoção segura de 7 arquivos órfãos (`packageService`, `usePackages`, etc.) após confirmação de build verde.

A estratégia de **commits atômicos** permitiu validação incremental e documentação clara da evolução do código.

## 🛠️ Implementação Técnica

### Backend (Já consolidado no Épico 3)
- Controllers: `OffersController`, `ClientContractsController`
- DTOs: `OfferDtos.cs`, `ClientContractDtos.cs` com Snapshot Pattern
- Enums: `ContractType`, `AssignmentStatus` em `SharedEnums.cs`

### Frontend (Esta implementação)

**1. Tipos (`media8-web/src/types/offers.ts`):**
```typescript
export type ContractType = 'Avulso' | 'Pacote' | 'Assinatura';
export interface Offer { /* ... */ }
export interface ClientContract { 
  snapshotOfferName?: string;
  snapshotPrice?: number;
  // ... campos imutáveis
}
```

**2. Services (`offerService.ts`, `clientContractService.ts`):**
- `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- Uso de `api` (Axios instance) com interceptors de auth
- Exportação de funções `resetOffersState` para consistência

**3. Hooks (`useOffers.ts`, `useClientContracts.ts`):**
- Query keys estruturadas: `['offers']`, `['client-contracts']`
- Mutations com `invalidateQueries` para `['offers']` e `['service-balances']`
- Tratamento de erro com `toast` via `sonner`

**4. Atualização de Services.ts:**
```typescript
export interface ServiceBalanceLot {
  contract?: ClientContract; // FK para ClientContract
  snapshotOfferName?: string; // Derivado do snapshot
}
```

**5. Arquivos Removidos:**
- `types/packages.ts`
- `services/packageService.ts`, `packageAssignmentService.ts`
- `hooks/usePackages.ts`, `usePackageAssignments.ts`
- `components/packages/PackageSelect.tsx`, `DeletePackageDialog.tsx`

## 🎯 Impacto e Resultado

* **Build 100% Verde**: Compilação TypeScript bem-sucedida (1,160 KB minified) sem erros de tipagem.
* **Sincronia Backend-Frontend**: Interfaces TypeScript espelham exatamente os DTOs do C#, garantindo contratos estáveis.
* **Estado Assíncrono Robusto**: TanStack Query gerencia cache, retry e invalidação automaticamente.
* **Base para UI Admin**: Pronta para implementação das telas de CRUD de Ofertas e Atribuição de Contratos.
* **Documentação Viva**: Commits atômicos (`test(types)`, `feat(services)`, `feat(hooks)`, `refactor(frontend)`) criam histórico legível.

---

**Nota do Desenvolvedor:**

A decisão de executar em 4 commits atômicos ao invés de um "mega-commit" foi intencional e segue boas práticas de versionamento. Cada fase (Tipagem → Services → Hooks → Limpeza) representa um marco verificável e reversível. A exclusão dos arquivos legados só ocorreu **após** confirmação de build verde, prevenindo quebras acidentais. O uso de `ContractType` como união string ao invés de enum TypeScript foi deliberado para manter compatibilidade com serialização JSON do backend C#, evitando armadilhas de enum numérico/string.
