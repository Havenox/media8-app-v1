# Fix: User Page Crash on Invalid Date
<!-- id: 014 -->

## Descrição do Problema
O sistema apresentava um erro crítico (`Uncaught RangeError: Invalid time value`) ao tentar abrir o painel de detalhes (`UserDetailsSheet`) na página de usuários (`UsersPage`).

O erro ocorria porque o componente `UserDetailsSheet` tentava formatar datas (`user.createdAt`, `assignment.assignedAt`, `assignment.expiresAt`) diretamente usando `new Date()` e `date-fns/format` sem verificar se o valor era válido.
Se algum usuário ou atribuição tivesse uma data inválida (ex: string malformada ou desconhecida), a criação do objeto `Date` falhava ou resultava em `Invalid Date`, fazendo o `date-fns` lançar uma exceção que quebrava toda a renderização da página (Tela Branca).

## Solução Aplicada
Foi implementada uma função de "blindagem" (`safeFormatDate`) diretamente no componente `UserDetailsSheet.tsx`.

### Função `safeFormatDate`
Esta função encapsula a lógica de formatação em um bloco `try/catch` e realiza verificações prévias:

1.  **Verificação de Nulo:** Se a string de data for nula ou undefined, retorna `'-'`.
2.  **Verificação de Validade:** Tenta criar o objeto `Date`. Se `date.getTime()` retornar `NaN`, considera a data inválida e retorna `'-'`.
3.  **Captura de Erros:** Qualquer exceção lançada pelo `format` é capturada e retorna `'-'`.

### Mudanças no Código
Todas as chamadas diretas de formatação foram substituídas:

**Antes (Vulnerável):**
```tsx
{format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
```

**Depois (Blindado):**
```tsx
{safeFormatDate(user.createdAt, "dd 'de' MMMM 'de' yyyy")}
```

## Benefícios
*   **Estabilidade:** A aplicação não quebra mais se receber dados "sujos" ou incompletos do backend.
*   **Experiência do Usuário:** Em vez de uma tela branca, o usuário vê um traço (`-`) onde a data estaria, permitindo que continue usando o sistema.
