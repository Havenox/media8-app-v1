# 069 - Remoção de Campos Legados do VideoFormat (Tier, EditingStyleId, OfferId)

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 26/05/2026

---

## 🚀 Desafio de Engenharia

O domínio de `VideoFormat` havia evoluído para um estado inconsistente, mantendo campos de navegação reversa que não faziam mais sentido no modelo de negócio atual:

1. **Tier (Complexidade):** Campo removido do domínio, mas ainda presente no frontend e DTOs.
2. **EditingStyleId:** Relação que foi migrada para `Offer`, mas permanecia em `VideoFormat`.
3. **OfferId (Navegação Reversa):** O EF Core estava tentando criar uma FK `OfferId` na tabela `VideoFormats` devido à navegação `Offer.VideoFormatId`, gerando erros de *constraint* e impedindo a inicialização do backend.
4. **Crash Loop no Backend:** A tentativa de remover essas colunas via migrations gerava erros de *pending model changes* e *constraints inexistentes*, deixando o backend em reinicialização constante (Erro 139).

## 🧠 Estratégia da Solução

Adotou-se uma abordagem de "limpeza cirúrgica" em três camadas:

1. **Domínio e DTOs:** Remoção completa de `Tier`, `EditingStyleId` e navegações reversas das entidades e DTOs.
2. **Frontend:** Atualização de tipos TypeScript e remoção de colunas/inputs relacionados.
3. **Banco de Dados:** Criação de migrations para remover colunas físicas e *constraints* órfãs.
4. **Configuração EF Core:** Supressão de *warnings* de modelo pendente e remoção do `MigrateAsync()` inicial para permitir a evolução controlada do schema.

## 🛠️ Implementação Técnica

### Backend (.NET 10 / C# 13)

**1. Entidade `VideoFormat` Limpa:**
   - Removido `EditingStyleId` e navegação `EditingStyle`.
   - Removido enum `ComplexityLevel`.
   - Arquivo: `Media8.Domain/Entities/VideoFormat.cs`

**2. Entidade `Offer` Ajustada:**
   - Removida navegação `SupportedFormats` (N:N indesejado).
   - Mantido `VideoFormatId` (FK simples) mas removida a navegação reversa `VideoFormat` para evitar que o EF Core crie `OfferId` em `VideoFormats`.
   - Arquivo: `Media8.Domain/Entities/Offer.cs`

**3. DbContext e Configuração:**
   - Removida configuração implícita de FK reversa.
   - Adicionado `ConfigureWarnings` para ignorar `PendingModelChangesWarning`.
   - Removido `MigrateAsync()` do `Program.cs` para evitar falha de inicialização por modelo pendente.

**4. Migrations Criadas:**
   - `RemoveTierAndEditingStyleFromVideoFormat`: Remove coluna `EditingStyleId`.
   - `FixOfferIdConstraint`: Remove *constraint* órfã `FK_VideoFormats_Offers_OfferId` se existir.

### Frontend (React / TypeScript)

**1. Tipos Atualizados:**
   - Interface `VideoFormat` removida: `Tier`, `VideoFormatTier`, `EditingStyleId`.
   - Arquivo: `media8-web/src/types/api.ts`

**2. UI e Componentes:**
   - Removida coluna "Tier" da tabela em `VideoFormatsPage`.
   - Removido helper `getTierBadgeVariant`.
   - Removido campo de formulário "Complexidade (Tier)".
   - Ajustado `handleCreate` e `handleEdit` para não enviar `tier`.

**3. Correção de PascalCase:**
   - Garantido que todos os acessos a propriedades de `VideoFormat` usem PascalCase (`MaxDurationSeconds`, `IsActive`).

## 🎯 Impacto e Resultado

* **Modelo de Domínio Consistente:** `VideoFormat` agora reflete estritamente sua função (definir formato e duração), sem acoplamento reverso com `Offer`.
* **Backend Estável:** Fim do crash loop (Erro 139) e inicialização bem-sucedida.
* **Frontend Limpo:** Remoção de código morto (`Tier`) e alinhamento total com o contrato PascalCase.
* **Banco de Dados Híbrido:** Schema atualizado sem perdas de dados críticos (apenas remoção de colunas órfãs).

---

**Nota do Desenvolvedor:** *Esta refatoração expôs a fragilidade de navegações bidirecionais implícitas no EF Core. A regra de ouro passou a ser: "Se a navegação reversa não é usada ativamente no código de negócio, ela não deve existir na entidade". Isso evita que o ORM crie *constraints* e colunas fantasmas que comprometem a integridade do schema.*
