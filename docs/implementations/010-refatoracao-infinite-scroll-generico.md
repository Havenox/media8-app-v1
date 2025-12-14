# Refatoração: Infinite Scroll Genérico (Plug & Play)

## Contexto
A aplicação utilizava uma implementação *ad-hoc* de scroll infinito na página de usuários (`UsersPage`), acoplando a lógica de `IntersectionObserver` diretamente no componente da página. Para permitir a escalabilidade dessa funcionalidade para outras listagens (Logs, Pacotes, Serviços), foi desenhada uma arquitetura baseada em componente reutilizável.

## Solução Arquitetural

### O Componente `<InfiniteScroll />`
Foi adotado o padrão de **Container Component** para encapsular a complexidade do DOM e dos eventos de scroll.

**Localização:** `src/components/ui/infinite-scroll.tsx`

#### Responsabilidades:
1.  **Observação de Viewport:** Gerencia uma instância de `IntersectionObserver` para detectar quando o elemento "sentinela" (fim da lista) entra em visão.
2.  **Gestão de Estado de Loading:** Previne múltiplas chamadas simultâneas verificando a prop `isLoading` antes de invocar `next()`.
3.  **Renderização Condicional:** Exibe automaticamente os componentes de Feedback (Loader ou Mensagem de Fim) baseado nas props `hasMore` e `isLoading`.
4.  **Limpeza (Cleanup):** Garante a desconexão correta dos observadores ao desmontar o componente, prevenindo Memory Leaks.

### Contrato de Interface (API do Componente)

```typescript
interface InfiniteScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  // Dados Core
  children: React.ReactNode;
  
  // Controle de Fluxo
  next: () => void;           // Callback disparado ao atingir o fim
  hasMore: boolean;           // Flag: existem mais dados para buscar?
  isLoading: boolean;         // Flag: já existe uma request em andamento?
  
  // Customização Visual
  loader?: React.ReactNode;   // Componente de loading customizado (default: Loader2)
  endMessage?: React.ReactNode; // Mensagem de fim de lista (opcional)
  threshold?: number;         // Sensibilidade do trigger (0.0 a 1.0)
}
```

## Como Implementar em Novas Páginas (Guia de Uso)

Para adicionar scroll infinito em qualquer nova tela:

1.  Use o hook do React Query (`useInfiniteQuery`) para gerenciar os dados (conforme padrão já estabelecido em `useUsers`).
2.  Importe o componente `InfiniteScroll`.
3.  Envolva sua lista:

```tsx
import { InfiniteScroll } from '@/components/ui/infinite-scroll';

// ... dentro do componente
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(...);

return (
  <CardContent>
    <InfiniteScroll
      next={fetchNextPage}
      hasMore={!!hasNextPage}
      isLoading={isFetchingNextPage}
      endMessage={<p>Fim da lista.</p>}
    >
      {data.pages.map(page => (
        // Seus itens da lista aqui
      ))}
    </InfiniteScroll>
  </CardContent>
)
```

## Benefícios da Refatoração
1.  **Desacoplamento:** A lógica de UI não sabe *o que* está listando, apenas *quando* pedir mais.
2.  **Padronização Visual:** O spinner de loading é consistente em todas as telas.
3.  **Robustez:** Tratamento centralizado de edge cases (ex: observer desconectando prematuramente).
