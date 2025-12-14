# Implementação: Modal de Confirmação de Deleção (Frontend)

**Data:** 13/12/2025
**Responsável:** Havenox
**Status:** Implementado

## Contexto
Para evitar cliques acidentais e reforçar a gravidade da ação de exclusão de pacotes (que pode ser bloqueada pelo backend), foi solicitada uma confirmação dupla.

## Solução Técnica
Implementação de um mecanismo de "Confirmação Destrutiva" na UI.

### Componentes
1.  **`DeletePackageDialog.tsx`**:
    - Componente isolado utilizando `AlertDialog` do shadcn/ui.
    - Exige que o usuário digite **exatamente o nome do pacote** para habilitar o botão de exclusão.
    - Feedback visual de carregamento (`isLoading`) durante a requisição.

2.  **Integração (`PackagesPage.tsx`)**:
    - O botão de "Excluir" no menu de ações agora abre este modal em vez de disparar a mutação diretamente.
    - O feedback de erro (caso o backend retorne 409 Conflict) é gerenciado globalmente pelo Toast da aplicação.

## UX Flow
1.  Usuário clica em "Excluir".
2.  Modal alerta sobre irreversibilidade.
3.  Usuário digita o nome do pacote.
4.  Sistema tenta deletar via API.
    *   **Sucesso**: Pacote some da lista.
    *   **Erro (409)**: Toast informa que o pacote tem vendas e não pode ser excluído.
