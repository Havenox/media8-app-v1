# 070 - Correção de Navegação Reversa em EditingStyle (Erro 500 na Criação de VideoFormats)

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 26/05/2026

---

## 🚀 Desafio de Engenharia

Durante a operação normal do sistema, foi identificado um erro crítico **HTTP 500** ao tentar criar novos formatos de vídeo através do modal `/admin/video-formats`. O erro ocorria tanto na interface web (após remoção do campo `Tier`) quanto via API direta.

**Sintomas:**
- **Erro 500:** `POST /api/v1/video-formats` retornava erro interno do servidor
- **Mensagem do Banco:** `column "EditingStyleId" of relation "VideoFormats" does not exist` (SqlState: 42703)
- **Inconsistência:** O banco de dados estava correto (sem a coluna `EditingStyleId` em `VideoFormats`), mas o EF Core insistia em tentar inserir essa coluna
- **Frontend:** Modal de criação ainda exibia campo removido (`Tier` com dropdown "Standard/Premium/GodMode")

**Impacto:** Impossibilidade de cadastrar novos formatos de vídeo, bloqueando a expansão do catálogo dinâmico.

## 🧠 Estratégia da Solução

A problema foi identificado como uma **navegação reversa indesejada** no modelo do EF Core. A entidade `EditingStyle` possuía uma propriedade de navegação `ICollection<VideoFormat> VideoFormats`, o que fez o EF Core inferir automaticamente que deveria existir uma chave estrangeira `EditingStyleId` na tabela `VideoFormats`.

**Decisões de Arquitetura:**
1. **Remover Navegação Reversa:** A navegação `VideoFormats` em `EditingStyle` não era utilizada ativamente no código de negócio, violando a regra: "Se não é usado, não deve existir"
2. **Manter FK Unidirecional:** A relação entre `Offer` e `VideoFormat` deve permanecer unidirecional (de `Offer` para `VideoFormat`), sem navegação reversa
3. **Limpeza do Frontend:** Remover completamente o campo `Tier` do formulário, que havia sido removido do domínio mas permanecia na UI

## 🛠️ Implementação Técnica

### Backend (.NET 10 / C# 13)

**1. Remoção de Navegação Reversa em EditingStyle:**
```csharp
// ANTES (Media8.Domain/Entities/EditingStyle.cs)
public class EditingStyle {
    // ... propriedades ...
    
    // ❌ Esta navegação causava criação de FK indevida
    public ICollection<VideoFormat> VideoFormats { get; set; } = new List<VideoFormat>();
}

// DEPOIS
public class EditingStyle {
    // ... propriedades ...
    // ✅ Navegação removida - VideoFormat não gerencia EditingStyle
}
```

**2. Frontend - Remoção do Campo Tier:**
- **Arquivo:** `media8-web/src/pages/admin/VideoFormatsPage.tsx`
- **Linhas removidas:** 293-311 (modal de criação) e 503-521 (modal de edição)
- **Componente:** `Controller` com `Select` para "Standard/Premium/GodMode"
- **Imports:** Removido `Controller` de `react-hook-form` (não utilizado após remoção)

**3. Schema de Validação:**
- **Manter:** Apenas `name`, `slug`, `maxDurationSeconds`
- **Removido:** Validação de `tier` (existia no schema anterior)

### Migrations e Banco de Dados

- **Banco de Dados:** Tabela `VideoFormats` já estava correta (sem coluna `EditingStyleId`)
- **Migrations:** Não foi necessária nova migration, pois a correção foi no modelo em memória
- **Cache:** Necessário rebuild completo (`--no-cache`) da imagem Docker para atualizar o modelo do EF Core

## 🎯 Impacto e Resultado

* **Criação de VideoFormats Restabelecida:** API retorna sucesso ao criar novos formatos
* **Modelo de Domínio Limpo:** Fim de navegações reversas não utilizadas em `EditingStyle` e `VideoFormat`
* **Frontend Consistente:** Modal de criação reflete exatamente o contrato da API (sem `Tier`, sem `EditingStyleId`)
* **Lição Arquitetural:** Navegações bidirecionais no EF Core devem ser evitadas quando não há uso ativo de ambas as pontas

---

**Nota do Desenvolvedor:** *Este incidente reforça a importância da "Lei da Navegação Mínima": cada entidade deve conhecer apenas o que é estritamente necessário para sua função. Navegações reversas (ex: `EditingStyle.VideoFormats`) são úteis apenas quando o código de negócio precisa navegar de `EditingStyle` para `VideoFormats` com frequência. Caso contrário, são apenas peso no modelo e fonte de inferências incorretas pelo ORM. A regra prática: "Se você não precisa navegar, não declare a propriedade".*
