# Correção: Filtro de Categorias de Pacotes

**Data:** 13/12/2025
**Responsável:** Havenox
**Status:** Implementado

## Problema
O filtro de categorias na página de Gestão de Pacotes não está funcionando corretamente. Selecionar uma categoria (ex: "Assinatura") não retorna resultados, mesmo existindo pacotes dessa categoria.

## Causa Raiz
Divergência de **Case Sensitivity** (Maiúsculas/Minúsculas).
- O Backend retorna a categoria como `Assinatura` (PascalCase).
- O Frontend espera e filtra valores como `assinatura` (lowercase).
- A comparação estrita (`===`) falha: `"Assinatura" === "assinatura"` é falso.

## Solução Proposta
Normalizar a comparação no Frontend para ignorar diferenças de caixa (case-insensitive).

### Arquivo Alvo
`media8-web/src/pages/admin/PackagesPage.tsx`

### Mudança
Alterar a lógica de filtro no `useMemo`:

```typescript
// ANTES
const matchesCategory = categoryFilter === 'all' || pkg.category === categoryFilter;

// DEPOIS
const matchesCategory = categoryFilter === 'all' || pkg.category.toLowerCase() === categoryFilter.toLowerCase();
```

## Verificação
1. Abrir página de Pacotes.
2. Selecionar filtro "Assinatura".
3. Verificar se apenas pacotes de assinatura aparecem.
