# Otimização de Performance: Listagem de Usuários

## Contexto
A página `/users` apresentava um gargalo de performance identificado como "overfetching". Ao carregar a lista de usuários, o sistema disparava uma requisição para buscar 100 pacotes (`GET /packages?pageSize=100`), adicionando latência e consumo de dados desnecessários.

## Diagnóstico
A investigação revelou que o componente `UserDetailsSheet` chamava incondicionalmente o hook `usePackages`, mesmo quando o componente estava fechado (devido à renderização oculta na árvore do React) e, pior, não utilizava os dados retornados.

Além disso, confirmou-se que a listagem principal de usuários ("Tiles") já é otimizada, recebendo um resumo do pacote ativo (`ActivePackageSummary`) diretamente do Backend no DTO do usuário, sem necessidade de chamadas adicionais (N+1).

## Solução Implementada

### 1. Remoção de Código Morto (`UserDetailsSheet.tsx`)
*   **Ação:** Removido o hook `usePackages` e a variável não utilizada `packages`.
*   **Resultado:** Eliminação completa da chamada `GET /packages` no carregamento da página de usuários.

### 2. Renderização Condicional (`UsersPage.tsx`)
*   **Ação:** O componente `UserDetailsSheet` agora só é renderizado na árvore do DOM quando um usuário é explicitamente selecionado (`selectedUserForDetails !== null`).
*   **Código:**
    ```tsx
    {selectedUserForDetails && (
      <UserDetailsSheet
        user={selectedUserForDetails}
        open={!!selectedUserForDetails}
        ...
      />
    )}
    ```
*   **Resultado:** Os hooks internos do Sheet (como `useClientAssignments` para buscar o histórico detalhado) só são disparados quando o usuário clica no card, economizando recursos de rede e processamento inicial.

## Benefícios
*   Redução drástica no número de requisições iniciais da página `/users`.
*   Melhoria no TTI (Time to Interactive).
*   Manutenção da arquitetura limpa, confiando na projeção do Backend para a lista resumida.
