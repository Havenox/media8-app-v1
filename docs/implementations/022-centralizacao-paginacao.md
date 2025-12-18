# 022 - Code Quality: Centralização de Regras de Negócio (DRY)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 17/12/2025

---

## 🚀 Desafio de Engenharia
Após corrigir a lógica de paginação na implementação 021, percebemos que a mesma lógica (cálculo de próxima página) estava duplicada (Copy & Paste) em três módulos diferentes: Usuários, Pacotes e Saldos.
Qualquer bug encontrado ou melhoria futura exigiria alteração em três arquivos, violando o princípio **DRY (Don't Repeat Yourself)** e aumentando a superfície de erro.

## 🧠 Estratégia da Solução
**Refatoração para Bibliotecas Compartilhadas**.
Extração da regra de negócio para uma *Pure Function* utilitária, testável unitariamente e desacoplada dos componentes de UI ou Hooks.

## 🛠️ Implementação Técnica
Criação do helper `src/lib/pagination.ts`.

```typescript
export const getNextPageParam = <T>(lastPage: T[], allPages: unknown[], pageSize: number) => {
    // Normalização de Dados (Lida com Array ou { data: [] })
    const data = Array.isArray(lastPage) ? lastPage : (lastPage as any).data;
    
    // Regra de Ouro da Paginação Infinita
    return data.length < pageSize ? undefined : allPages.length + 1;
};
```
Todos os hooks do sistema (`useInfiniteQuery`) agora apenas importam e aplicam esta função.

## 🎯 Impacto e Resultado
*   **Manutenibilidade**: Redução de complexidade cognitiva. Ler um hook agora é trivial.
*   **Consistência**: Garantia matemática de que todas as listas do sistema se comportam exatamente da mesma maneira.

---
**Nota do Desenvolvedor:** *Código duplicado é o inimigo silencioso. Centralizar lógica trivial hoje evita bugs complexos amanhã.*
