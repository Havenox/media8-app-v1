# 023 - Backend Engineering: Extensão de Contrato de API (DTOs)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 17/12/2025

---

## 🚀 Desafio de Engenharia
O cliente reportou que o campo "Membro desde" na ficha do usuário exibia um placeholder (`-`).
A análise do frontend mostrou que a propriedade `user.createdAt` estava vindo `undefined`.
O desafio não era um bug de código (erro de sintaxe), mas um erro de **Definição de Contrato**: O DTO (`AdminUserDto`) que trafegava os dados do servidor para o cliente simplesmente não incluía essa propriedade, embora ela existisse no banco de dados.

## 🧠 Estratégia da Solução
**Evolução de API Controlada**.
A solução exigiu intervenção no Backend (.NET) para expor o dado.
O processo seguiu o fluxo de:
1.  **Diagnóstico Full Stack**: Rastrear o dado do Banco (`UserAggregate`) -> Controller -> DTO -> Frontend para achar o "elo perdido".
2.  **Mapping Explícito**: Adicionar a propriedade e garantir seu preenchimento manual no Controller, evitando frameworks de automapeamento "mágicos" que poderiam quebrar por convenção.

## 🛠️ Implementação Técnica
Alteração em `Media8.Application`:
```csharp
public class AdminUserDto {
    // ...
    public DateTime CreatedAt { get; set; } // Propriedade Adicionada
}
```
Atualização do `UsersController` para popular `CreatedAt = user.CreatedAt`.

## 🎯 Impacto e Resultado
*   **Correção de Bug**: Informação restaurada na interface.
*   **Qualidade**: O Frontend já estava preparado (defensivo) e passou a funcionar automaticamente assim que o contrato foi cumprido pelo Backend.

---
**Nota do Desenvolvedor:** *Isso demonstra a importância de DTOs tipados. Se estivéssemos retornando JSON dinâmico, talvez o erro passasse despercebido por mais tempo.*
