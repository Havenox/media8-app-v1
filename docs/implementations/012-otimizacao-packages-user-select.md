# Otimização Gestão de Pacotes: Componente UserSelect

## Contexto
A tela de Gestão de Pacotes sofria de problemas de performance devido ao carregamento antecipado (Eager Loading) de 1000 clientes para preencher um dropdown de atribuição.

## Solução Técnica

# Otimização Gestão de Pacotes: Arquitetura "Plug & Play" (InfiniteCombobox)

## Contexto
A ideia é criar uma solução **genérica** e desacoplada para seleção de itens em grandes listas (Usuários, Pacotes, Edições), evitando a repetição de código (DRY) de dropdowns com paginação e busca.

## Solução Técnica

### 1. `InfiniteCombobox` (Genérico)
Um componente UI puro, agnóstico ao domínio, localizado em `src/components/ui/infinite-combobox.tsx`.

**Responsabilidades:**
*   Renderizar input de busca e lista virtualizada.
*   Detectar scroll e pedir próxima página (`fetchNextPage`).
*   Gerenciar estados de carregamento visual.
*   **NÃO** sabe quem são "usuários" ou "pacotes".

**Contrato (Props Genéricas):**
```tsx
interface InfiniteComboboxProps<T> {
  // Dados
  items: T[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  
  // Busca
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  
  // Seleção
  value?: string;
  onChange: (value: string) => void;
  
  // Renderização
  renderItem: (item: T) => React.ReactNode;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
}
```

### 2. Implementações Específicas (Wrappers)

#### `UserSelect` (src/components/users/UserSelect.tsx)
O componente "Especialista" que conecta o hook de dados ao componente genérico.

```tsx
export function UserSelect({ role, value, onChange }: UserSelectProps) {
  // 1. Gerencia Busca
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // 2. Chama Hook existente
  const { data, fetchNextPage, ... } = useInfiniteUsers(role, 20, debouncedSearch);

  // 3. Renderiza o Genérico
  return (
    <InfiniteCombobox 
       items={users}
       searchValue={search}
       onSearchChange={setSearch}
       renderItem={(user) => <span>{user.name} ({user.email})</span>}
       {...props}
    />
  );
}
```

## Benefícios (DRY)
Quando precisarmos criar um `PackageSelect` ou `OrderSelect`:
1.  Não reescreveremos lógica de scroll/popover.
2.  Apenas criaremos o Wrapper que chama `useInfinitePackages`.
3.  Reuso de 90% do código UI.
