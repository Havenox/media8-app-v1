# Centralização de Lógica de Paginação (Infinite Scroll)

## Objetivo
Implementar uma arquitetura centralizada para o cálculo de "Próxima Página" em listas infinitas, eliminando a duplicação de código e garantindo consistência em toda a aplicação. Segue o princípio DRY (Don't Repeat Yourself).

## Problema Atual
A lógica que decide se "existe uma próxima página" estava duplicada em três lugares:
1. `useUsers.ts`
2. `usePackages.ts`
3. `useServiceBalances.ts`

Embora a lógica tenha sido corrigida recentemente, ela ainda é *repetida*. Se quisermos alterar a tolerância ou o comportamento padrão no futuro, teríamos que editar 3 arquivos.

E se quisessemos adicionar a lógica em mais algum lugar, precisariamos duplicar o código novamente.

## Solução Arquitetural

### 1. Novo Helper (`src/lib/pagination.ts`)
Criaremos uma função pura e genérica capaz de calcular a próxima página baseada apenas nos dados recebidos e na configuração de tamanho.

```typescript
/**
 * Calcula o índice da próxima página para Infinite Scroll.
 * Baseado na premissa de Array Length: Se recebemos menos itens que o solicitado,
 * atingimos o fim da lista.
 */
export const getNextPageParam = <T>(
  lastPage: T[] | { data: T[] }, // Suporta array direto ou objeto com property data
  allPages: unknown[],
  pageSize: number
): number | undefined => {
  // Normalização: Extrai o array de dados independentemente do formato
  const lastPageData = Array.isArray(lastPage) 
    ? lastPage 
    : (lastPage as any).data || [];

  // Regra de Ouro: Se a página veio incompleta, acabou.
  if (lastPageData.length < pageSize) {
    return undefined;
  }

  // Senão, próxima página.
  return allPages.length + 1;
};
```

### 2. Refatoração dos Hooks
Todos os hooks passarão a importar e usar essa função única.

**Exemplo (Antes):**
```typescript
getNextPageParam: (lastPage, allPages) => {
  if (lastPage.length < pageSize) return undefined;
  return allPages.length + 1;
}
```

**Exemplo (Depois):**
```typescript
import { getNextPageParam } from '@/lib/pagination';

// ...
getNextPageParam: (lastPage, allPages) => getNextPageParam(lastPage, allPages, pageSize),
```

## Benefícios
1.  **Fonte Única da Verdade:** Toda a lógica de paginação do sistema reside em um arquivo.
2.  **Robustez:** O helper lida automaticamente com formatos variados de resposta (Array puro vs Objeto `{ data: [] }`), protegendo contra inconsistências de API.
3.  **Manutenibilidade:** Alterações futuras (ex: suporte a cursores) são feitas em um só lugar.
