# 078 - [Backend/Database]: Introdução do SnapshotContractType em ClientContracts e Migração com Backfill

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 28/05/2026

---

## 🚀 Desafio de Engenharia
Na arquitetura do Media8, as atribuições de ofertas a clientes geram registros históricos imutáveis chamados `ClientContracts` (padrão Snapshot). No entanto, o tipo de contrato (`ContractType` — Avulso, Pacote ou Assinatura) residia apenas na oferta ativa (`Offer`). 
Isso causava dois problemas críticos de acoplamento e consistência:
1. **Acoplamento Dinâmico:** Para determinar se um saldo de serviço ativo era de uma "Assinatura" ou "Pacote" no dashboard do cliente, o sistema precisava fazer *eager loading* dinâmico navegando até a oferta original (`lot.Contract.Offer.ContractType`). Se a oferta original fosse alterada ou removida fisicamente, o histórico do contrato de cliente perdia essa informação ou retornava `"Desconhecido"`.
2. **Imutabilidade Violada:** O tipo de contrato define regras severas de expiração e renovação. Ele precisa ser capturado de forma imutável no momento da assinatura do contrato, assim como o preço e o formato do vídeo.

## 🧠 Estratégia da Solução
Seguindo os preceitos de Clean Architecture e as diretrizes da skill `dotnet-10-media8-best-practices`:
1. **Introdução da Coluna de Snapshot:** Adicionamos a propriedade `SnapshotContractType` na entidade de domínio `ClientContract` e na tabela correspondente no banco de dados.
2. **Retrocompatibilidade e Segurança (Mapeamento EF):** Mapeamos a nova coluna com valor padrão (`ContractType.Avulso`) para evitar falhas em registros pré-existentes.
3. **Migração Inteligente com Backfill:** Criamos uma migração EF Core contendo um comando SQL nativo (`UPDATE` via `JOIN`) para copiar retroativamente o tipo de contrato de cada oferta para as atribuições de contratos já existentes.
4. **Desacoplamento Completo do Endpoint:** Atualizamos o mapeamento do DTO no endpoint de saldos (`ServiceBalancesController`) para ler a propriedade de snapshot imutável, removendo a dependência de navegação até a oferta ativa e blindando o frontend.

## 🛠️ Implementação Técnico

### Backend
- **[ClientContract.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Domain/Entities/ClientContract.cs)**:
  - Adicionada a propriedade `public ContractType SnapshotContractType { get; set; }` mapeada do enum de domínio.
- **[ApplicationDbContext.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Infrastructure/Data/ApplicationDbContext.cs)**:
  - Mapeada a coluna no banco como `IsRequired()` com `HasDefaultValue(ContractType.Avulso)` para retrocompatibilidade física.
- **[ClientContractDtos.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Application/DTOs/Offers/ClientContractDtos.cs)**:
  - Adicionada a propriedade `SnapshotContractType` do tipo `Domain.Enums.ContractType` no DTO de resposta `ClientContractResponse`.
- **[ClientContractsController.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Api/Controllers/ClientContractsController.cs)**:
  - Atualizadas as instanciações e mapeamentos DTO em `GetAllContracts`, `GetContractById`, `CreateContract` (onde o snapshot da oferta é extraído) e `UpdateContract` para mapear o `SnapshotContractType` em PascalCase.
- **[ServiceBalancesController.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Api/Controllers/ServiceBalancesController.cs)**:
  - Modificado o DTO mapper `MapToUnifiedDto` para ler `ContractType` a partir de `lot.Contract?.SnapshotContractType.ToString()`. Fallbacks adequados para `lot.Contract?.Offer?.ContractType.ToString()` foram adicionados para blindagem de erros.
- **Migração EF Core & Backfill**:
  - Gerada a migração `AddSnapshotContractTypeToClientContracts` contendo o seguinte comando SQL:
    ```sql
    UPDATE "ClientContracts" cc 
    SET "SnapshotContractType" = o."ContractType" 
    FROM "Offers" o 
    WHERE cc."OfferId" = o."Id";
    ```
  - Banco de dados PostgreSQL local atualizado com sucesso.

### Frontend
- **[offers.ts](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/types/offers.ts)**:
  - Adicionada a propriedade opcional `SnapshotContractType?: string` na interface de domínio `ClientContract` para alinhar com o payload da API.

## 🎯 Impacto e Resultado
* **Imutabilidade Absoluta**: As regras de renovação e expiração do dashboard do cliente agora são regidas por dados de snapshot totalmente imutáveis, eliminando qualquer risco de inconsistência caso a oferta ativa seja excluída.
* **Segurança de Execução (Backfill Completo)**: Todos os registros legados foram corrigidos diretamente via migração de banco com integridade transacional.
* **Blindagem de Performance**: O endpoint `/ServiceBalances/MyBalances` não possui mais dependência estrita de carregamento de ofertas para computar a semântica visual das assinaturas.

---
**Nota do Desenvolvedor:** *Ao seguir a skill de boas práticas de arquitetura, focamos em manter a 'Soberania do Servidor' definindo o design em PascalCase e garantindo a 'Resiliência Transacional'. O uso de comandos SQL DML (Data Manipulation Language) embutidos no ciclo de vida de migrações DDL (Data Definition Language) do EF Core é a prática recomendada de nível sênior para manter bases de dados de produção íntegras e sincronizadas.*
