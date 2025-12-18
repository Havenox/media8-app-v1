# 010 - UI Scalability: Componentização de Scroll Infinito (Headless Pattern)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 14/12/2025

---

## 🚀 Desafio de Engenharia
A base de código possuía implementações duplicadas e frágeis de lógica de "Scroll Infinito" espalhadas por várias páginas (`UsersPage`, `LogsPage`). Cada implementação acoplava a lógica de detecção de viewport (`IntersectionObserver`) com a lógica de renderização, dificultando a manutenção e criando bugs inconsistentes (ex: scroll duplicado em uma página, mas não na outra).

## 🧠 Estratégia da Solução
Abstração da complexidade através do padrão **Container/Wrapper Component**.
Criei um componente genérico `<InfiniteScroll />` que isola a responsabilidade de "detectar o fim da lista" e "gerenciar estado de carregamento", deixando para o componente pai apenas a responsabilidade de renderizar os dados visuais.

## 🛠️ Implementação Técnica

### Interface Plug & Play
O componente aceita qualquer children, tornando-o agnóstico ao conteúdo (usuários, logs, produtos).

```tsx
<InfiniteScroll
    next={fetchNextPage}    // Função de trigger
    hasMore={hasNextPage}   // Flag de controle
    isLoading={isFetching}  // Debounce/Throttle visual
    loader={<MyCustomLoader />} // Customização (Inversão de Controle)
>
    {data.map(item => <Card item={item} />)}
</InfiniteScroll>
```

### Robustez do Intersection Observer
Implementação correta de *cleanup* no `useEffect` para desconectar observadores quando o componente desmonta, prevenindo **Memory Leaks** comuns em Single Page Applications (SPA).

## 🎯 Impacto e Resultado
*   **Redução de Código**: Removeu ~40 linhas de código repetitivo de cada página de listagem.
*   **Qualidade Visual**: Padronizou o comportamento de *Loading Spinners* e mensagens de *End of List* em toda a aplicação.
*   **Velocidade de Desenvolvimento**: Novas listagens agora ganham scroll infinito em minutos, bastando envolver a lista com o componente.

---
**Nota do Desenvolvedor:** *Abstrações prematuras são ruins, mas abstrações tardias geram débito técnico. Identifiquei o padrão de repetição na terceira implementação e refutei imediatamente para um componente compartilhado (DRY).*
