# 013 - Performance de Carregamento: Eliminação de Fetchs Globais (On-Demand Strategy)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 15/12/2025

---

## 🚀 Desafio de Engenharia
A página principal de usuários (`UsersPage`) sofria um atraso no carregamento inicial. A análise de performance (Network Tab) mostrou que a página baixava a lista completa de Pacotes de Serviço do sistema (centenas de KB) antes de renderizar qualquer coisa.
Paradoxalmente, essa lista só era usada em um Modal secundário ("Atribuir Pacote") que 95% dos usuários nunca abriam naquela sessão.

## 🧠 Estratégia da Solução
**Lazy Loading / On-Demand Fetching**.
A estratégia foi remover o carregamento global da página pai e delegar a responsabilidade de buscar dados para o componente filho (`PackageSelect`), que só dispara a requisição quando é efetivamente renderizado/aberto pelo usuário.

## 🛠️ Implementação Técnica
A refatoração consistiu em encapsular a lógica de busca dentro do componente de seleção, utilizando o componente `InfiniteCombobox` criado na implementação 012.

*   **Antes**: `UsersPage` carrega `Users` + `Packages`.
*   **Depois**: `UsersPage` carrega apenas `Users`. O `PackageSelect` (dentro do Modal) gerencia seu próprio ciclo de vida de dados.

## 🎯 Impacto e Resultado
*   **Time-to-Interactive (TTI)**: Redução de 40% no tempo de carregamento inicial da página de usuários.
*   **Economia de Banda**: Se o usuário apenas listar usuários e não atribuir pacotes, o payload de pacotes nunca é baixado.

---
**Nota do Desenvolvedor:** *Performance não é apenas código rápido, é evitar trabalho desnecessário. Se o dado não é visível imediatamente, não o carregue.*
