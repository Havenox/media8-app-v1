# 012 - UI Architecture: Padrão "Infinite Select" Reutilizável (Generics)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 15/12/2025

---

## 🚀 Desafio de Engenharia
Componentes de seleção (`<select>`) padrão HTML travam o navegador quando populados com milhares de opções (ex: lista de clientes). Precisávamos de uma solução que permitisse selecionar um item em uma base de 10.000 registros com a mesma performance de uma lista de 10 itens, mantendo a capacidade de busca textual.

## 🧠 Estratégia da Solução
Criação do componente `InfiniteCombobox`.
Uma abstração de UI baseada em **Virtualização** (Windowing) ou Scroll Infinito dentro do dropdown. Em vez de renderizar 10.000 nós no DOM, renderizamos apenas o que o usuário vê e carregamos o restante sob demanda.

## 🛠️ Implementação Técnica

### Generics em TypeScript/React
Para garantir o reuso (UserSelect, PackageSelect, etc), o componente foi tipado genericamente `<T>`.

```tsx
interface InfiniteComboboxProps<T> {
  items: T[];       // Array genérico
  renderItem: (item: T) => ReactNode; // Inversão de controle de renderização
  fetchNextPage: () => void;
  //...
}
```

### Composição
Utilizamos o padrão **Compound Component** para criar implementações específicas:
*   `UserSelect` = `InfiniteCombobox` + `useInfiniteUsers` hook.
*   `PackageSelect` = `InfiniteCombobox` + `useInfinitePackages` hook.

## 🎯 Impacto e Resultado
*   **Performance de Renderização**: Eliminação total de travamentos (jank) ao abrir dropdowns pesados.
*   **Produtividade**: O time de desenvolvimento não precisa mais reinventar a roda para cada novo select de entidade.

---
**Nota do Desenvolvedor:** *Criar componentes reutilizáveis agnósticos ao domínio é um investimento que se paga na terceira vez que você o utiliza.*
