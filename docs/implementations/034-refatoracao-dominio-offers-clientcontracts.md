# 034 - Refatoração de Domínio: Migração de Packages para Offers e ClientContracts

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

O sistema Media 8 operava com uma modelagem de domínio ambígua onde a entidade `Package` representava simultaneamente o **produto comercial** (catálogo) e o **direito adquirido** (contrato do cliente). Essa duplicidade gerava conflitos conceituais e limitava a flexibilidade operacional: o administrador não conseguia definir dinamicamente regras de validade, fidelidade e prazo de entrega por oferta, nem proteger o histórico do cliente contra alterações retroativas de preços ou regras.

O desafio era realizar uma refatoração arquitetural profunda para separar claramente:
- **Offer (Oferta):** Produto comercializável com regras dinâmicas definidas pelo admin.
- **ClientContract (Contrato):** Direito imutável adquirido pelo cliente, com snapshot dos dados no momento da contratação.

Além disso, era necessário padronizar toda a nomenclatura para PascalCase, eliminar código morto (legacy) e garantir integridade referencial com o novo modelo.

## 🧠 Estratégia da Solução

A estratégia seguiu o padrão **Dual-Run Parallel Migration** com as seguintes fases:

1. **Criação Paralela:** Implementação de `Offer` e `ClientContract` coexistindo com `Package` e `PackageAssignment` legados.
2. **Integração Gradual:** Adição de `ContractType` (enum) para governar regras de expiração/renovação.
3. **Migração de API:** Criação de controllers e DTOs para CRUD de Offers e ClientContracts.
4. **Purga do Legado:** Remoção física de entidades, repositórios, controllers e tabelas legadas.
5. **Padronização:** Mapeamento estrito PascalCase no `ApplicationDbContext`.

A decisão de usar Dual-Run foi crítica: permitiu validação progressiva sem quebrar funcionalidades existentes, garantindo rollback seguro a qualquer instante.

## 🛠️ Implementação Técnica

### Fase 1: Criação de Entidades de Domínio
- **`Offer.cs`**: Entidade com `ContractType`, `ValidityDays`, `LoyaltyMonths`, `DeliveryDays`, `VideoFormatId`, `EditingStyleId`.
- **`ClientContract.cs`**: Entidade com snapshot imutável (`SnapshotOfferName`, `SnapshotPrice`, `SnapshotVideoQuantity`, `SnapshotValidityDays`).
- **`ContractType` enum**: `Avulso`, `Pacote`, `Assinatura` para governar expiração/renovação.

### Fase 2: Camada de API
- **`OfferDtos.cs`**: `CreateOfferRequest`, `UpdateOfferRequest`, `OfferResponse` com validações DataAnnotations.
- **`ClientContractDtos.cs`**: `CreateClientContractRequest`, `UpdateClientContractRequest`, `ClientContractResponse`.
- **`OffersController.cs`**: CRUD completo com RBAC (Admin para escrita, Anônimo para leitura).
- **`ClientContractsController.cs`**: Gerenciamento de contratos com cálculo automático de expiração e snapshot.

### Fase 3: Atualização do DbContext
- Adicionados `DbSet<Offer>` e `DbSet<ClientContract>`.
- Mapeamento PascalCase estrito: `Offers`, `ClientContracts`, `VideoFormats`, `EditingStyles`.
- Configuração Fluent API para relacionamentos e validações.

### Fase 4: Purga do Legado
- **Arquivos Deletados**:
  - `PackageAggregate.cs`
  - `PackagesController.cs`
  - `PackageAssignmentsController.cs`
  - `PackageDtos.cs`
  - `IPackageRepository.cs`
  - `PackageRepository.cs`
- **Arquivos Atualizados**:
  - `ServiceBalanceLot.cs`: `Assignment` → `Contract`
  - `UserAggregate.cs`: Removido `Assignments`, adicionado `Contracts`
  - `ServiceBalancesController.cs`: Mapeamento para `Contract`
  - `UsersController.cs`: Substituição de `Assignments` por `Contracts`
  - `ApplicationDbContext.cs`: Remoção de DbSets e configurações legadas.

### Fase 5: Migração de Banco de Dados
- **Migration Gerada**: `20260520124425_RemoveLegacyPackagesAndAssignments`
- **Ações Físicas**:
  ```sql
  DROP TABLE "PackageVideoFormats";
  DROP TABLE "Packages";
  ALTER TABLE "ServiceBalanceLots" DROP COLUMN "ClientContractId";
  ALTER TABLE "ServiceBalanceLots" ADD CONSTRAINT "FK_ServiceBalanceLots_ClientContracts_AssignmentId" 
    FOREIGN KEY ("AssignmentId") REFERENCES "ClientContracts" ("Id") ON DELETE SET NULL;
  ```

### Validação
- **Build**: Successful (4.41s, 2 warnings)
- **Type Check**: 0 errors
- **Database**: Tabelas legadas removidas, constraints atualizadas.

## 🎯 Impacto e Resultado

* **Flexibilidade Administrativa Total**: Admins agora podem criar ofertas com regras dinâmicas de validade, fidelidade e entrega, sem necessidade de deploy de código.

* **Proteção do Histórico do Cliente**: Padrão Snapshot garante que contratos de clientes permaneçam imutáveis, mesmo que a oferta original sofra alterações de preço ou regras.

* **Código Limpo e Mantível**: Eliminação de 9 arquivos legados, redução de complexidade ciclomática e clareza conceitual com nomenclatura alinhada ao domínio de negócio.

* **Integridade Referencial Garantida**: Relacionamentos `Offer` → `VideoFormat` e `ClientContract` → `Offer` com FKs explícitas e cascade delete configurado corretamente.

* **Banco de Dados Padronizado**: Schema 100% PascalCase, facilitando consultas manuais e integração com ferramentas de BI/relatórios.

---

**Nota do Desenvolvedor:** *Esta refatoração representa um marco de maturidade arquitetural no Media 8. A separação entre "o que se vende" (Offer) e "o que se possui" (ClientContract) é um padrão clássico de SaaS que permite evolução independente do catálogo e dos contratos. A lição principal foi a importância da migração paralela (Dual-Run): criar o novo antes de destruir o legado, garantindo rollback seguro. O próximo passo natural seria a implementação de testes de integração E2E para validar fluxos completos de contratação e consumo de saldos.*
