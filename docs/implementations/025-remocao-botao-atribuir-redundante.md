# Remoção de Botão Redundante de Atribuição (UserDetailsSheet)

## Contexto
A interface de detalhes do usuário (`UserDetailsSheet`) apresentava dois botões para a ação de "Atribuir Pacote":
1.  Um botão pequeno ("+ Atribuir") no cabeçalho da seção de Saldos e Serviços.
2.  Um botão principal ("Atribuir") no rodapé da janela (Footer).

## Problema
A duplicidade de botões causa poluição visual e carga cognitiva desnecessária.
O botão inferior (Footer) segue o padrão de design principal da aplicação (botão `premium`), sendo esteticamente superior e mais consistente.
O botão superior foi julgado desnecessário pela equipe de design/produto.

## Solução
Remover o botão superior ("+ Atribuir") do código JSX, mantendo apenas o título da seção "Saldos e Serviços".

### Antes
Header da seção continha `flex justify-between` com título e botão.

### Depois
Header da seção conterá apenas o título.

## Arquivos Afetados
*   `src/components/users/UserDetailsSheet.tsx`
