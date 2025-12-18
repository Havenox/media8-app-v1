# 020 - Code Hygiene: Eliminação de Dívida Técnica (Dead Code Removal)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 16/12/2025

---

## 🚀 Desafio de Engenharia
Após a migração para a nova arquitetura de Snapshots (Impl. 016) e Lista de Serviços (Impl. 019), o componente de Detalhes do Usuário continuava funcionando, mas lento.
Uma auditoria de código revelou que ele ainda disparava requisições para a API antiga (`/package-assignments`), processava os dados na memória do cliente, e então... **não fazia nada com eles**. Variáveis órfãs consumiam CPU e Rede.

## 🧠 Estratégia da Solução
**Refatoração de Limpeza**.
Identificar e remover agressivamente dependências não utilizadas. Código morto não é neutro; é passivo. Ele ocupa banda, confunde novos desenvolvedores e pode gerar bugs laterais.

## 🛠️ Implementação Técnica
1.  **Análise Estática**: Identificação de imports não utilizados no TypeScript.
2.  **Network Pruning**: Remoção do hook `useClientAssignments`.
3.  **Lógica de Render**: Simplificação para depender exclusivamente do novo endpoint `/service-balances`.

## 🎯 Impacto e Resultado
*   **Eficiência**: Redução de 50% nas requisições de rede ao abrir o painel.
*   **Legibilidade**: O arquivo reduziu 30 linhas, tornando o fluxo de dados claro para quem ler o código no futuro.

---
**Nota do Desenvolvedor:** *Entregar features é importante, mas limpar a bagunça depois é o que mantém o projeto saudável. "Deixar o acampamento mais limpo do que você encontrou".*
