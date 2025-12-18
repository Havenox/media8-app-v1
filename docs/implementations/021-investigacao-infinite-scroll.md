# Padronização de Scroll Infinito (ServiceBalanceList)

## Contexto
Durante a implementação da nova lista de saldos (`ServiceBalanceList`), identificou-se que o scroll infinito não funcionava corretamente.
A investigação revelou que o hook `useServiceBalances.ts` utilizava uma lógica de paginação diferente do padrão do sistema, dependendo de um cabeçalho HTTP (`x-total-count`) que frequentemente não é exposto por configurações de segurança (CORS).

## Padrão do Sistema
Os hooks de listagem existentes (`useUsers.ts`, `usePackages.ts`) utilizam uma lógica robusta baseada no **tamanho do array recebido**:
*   Se o array recebido tem tamanho igual ao `pageSize`, assume-se que há mais páginas.
*   Se o array é menor que `pageSize`, assume-se que chegamos ao fim.

## Implementação Realizada

### Refatoração de `useServiceBalances.ts`
O método `getNextPageParam` foi alterado para alinhar com o padrão do sistema.

#### Antes (Lógica Frágil)
Dependia de `lastPage.total`, que retornava 0 quando o header estava bloqueado.
```typescript
getNextPageParam: (lastPage, allPages) => {
  const currentCount = allPages.flatMap(p => p.data).length;
  if (currentCount < lastPage.total) { // Falha se total=0
    return allPages.length + 1;
  }
  return undefined;
}
```

#### Depois (Lógica Robusta/Segura)
Depende apenas do contéudo recebido.
```typescript
getNextPageParam: (lastPage, allPages) => {
  const lastPageData = lastPage.data || [];
  if (lastPageData.length < pageSize) {
    return undefined;
  }
  return allPages.length + 1;
}
```

## Benefícios
1.  **Resiliência:** Funciona independentemente de headers de CORS.
2.  **Padronização:** Alinha com `useUsers` e `usePackages`.
3.  **Segurança:** Não exige exposição de headers sensíveis do backend.
