# 024 - Domain Integrity: Aplicação Prática de Imutabilidade

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 17/12/2025

---

## 🚀 Desafio de Engenharia
A lista de usuários exibia o nome *atual* do pacote atrelado. Se um administrador renomeasse "Pacote Básico" para "Pacote Legacy" no catálogo, todos os usuários antigos passavam a ver "Pacote Legacy".
Isso quebra o **Princípio da Imutabilidade Contratual**: O usuário comprou "Básico", ele deve ver "Básico" para sempre, independente de como o produto evolua no futuro.

## 🧠 Estratégia da Solução
Utilização das propriedades de **Snapshot** implementadas na arquitetura 016.
O Backend estava ignorando esses dados na listagem geral de usuários, fazendo um JOIN direto com a tabela de produtos (`Package`).
A correção forçou o sistema a respeitar a história: "Olhe primeiro para o contrato assinado (Snapshot). Se não houver (legado), olhe para o produto atual".

## 🛠️ Implementação Técnica
Lógica de **Fallback Coalescing** no Controller:

```csharp
// Prioridade: História > Estado Atual > Placeholder
Name = assignment.SnapshotPackageName 
    ?? assignment.Package?.Name 
    ?? "Unknown Package"
```

## 🎯 Impacto e Resultado
*   **Integridade**: A visualização do sistema agora reflete a realidade jurídica do contrato.
*   **Confiança**: O cliente não é surpreendido por mudanças de nome de produto que ele não solicitou.

---
**Nota do Desenvolvedor:** *Softwares de gestão devem ser cápsulas do tempo. Alterar o passado (nomes históricos) é um erro grave de design.*
