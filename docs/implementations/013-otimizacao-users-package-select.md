# Otimização Gestão de Usuários: Remoção de Fetch Desnecessário de Pacotes

## Problema
A página de usuários (`UsersPage`) realiza um fetch de **todos** os pacote do sistema (`GET /api/v1/packages`) ao carregar.
Isso ocorre porque o modal de "Atribuir Pacote" usa um dropdown simples que precisa de todos os dados carregados na memória.
Embora a *listagem* de usuários mostre o pacote ativo corretamente (os dados vêm "inclusos" no objeto User), o componente da página faz essa carga extra desnecessária, impactando performance e escalabilidade.

## Solução Técnica

### 1. Novo Componente: `PackageSelect`
Implementar um wrapper para o `InfiniteCombobox` (já existente), conectando-o ao serviço de pacotes.

**Localização:** `src/components/packages/PackageSelect.tsx`

**Lógica:**
*   **Hook:** Usar `usePackages` refatorado para suportar `search` e paginação (atualmente `usePackages` retorna tudo, precisamos garantir que ele ou um novo hook suporte paginação/filtro se possível, mas como primeiro passo, usaremos o padrão `InfiniteCombobox` preparado para o futuro).
*   *Nota:* O hook `usePackages` atual pode precisar de ajustes no futuro para paginação real no backend, mas encapsula-lo no `InfiniteCombobox` agora já prepara a UI para o "Padrão Ouro" e permite remover o fetch global da página.

### 2. Refatoração `UsersPage`
*   **Remover:** `const { data: packages } = usePackages();`
*   **Substituir:** O dropdown nativo (`<Select>`) no modal de atribuição pelo novo `<PackageSelect />`.

## Benefícios
*   **Zero Fetch Inicial:** A página de usuários não carregará mais a lista de pacotes ao abrir.
*   **On-Demand:** Os pacotes só serão buscados quando o admin abrir o modal de atribuição.
*   **UX:** Busca e Scroll Infinito para selecionar pacotes (preparado para milhares de itens).
