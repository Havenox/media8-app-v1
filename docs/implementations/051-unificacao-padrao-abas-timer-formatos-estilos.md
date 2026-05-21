# #051 - Unificação do Padrão de Abas e Timer em Formatos e Estilos

**Data:** 21 de Maio de 2026  
**Autor:** Media 8 Development Team  
**Status:** ✅ Concluído  
**Épico:** 4.0 - Conditional Deletion Pattern

---

## 📋 Visão Geral

Após o sucesso da implementação do padrão de abas e timer de purga na página de Ofertas (048), foi necessário replicar esta arquitetura para as páginas de **Formatos de Vídeo** e **Estilos de Edição**, garantindo consistência de UX em todo o admin.

## 🎯 Objetivo

Replicar o padrão de UI já consolidado em `OffersPage.tsx` para:
- `VideoFormatsPage.tsx`
- `EditingStylesPage.tsx`

Garantindo:
- Abas "Ativos" e "Arquivados"
- Timer visual de 5 segundos para exclusões destrutivas
- Reativação de registros arquivados
- Verificação da flag `canDeletePermanently`

## 🔧 Implementação

### 1. Atualização de Tipos (Frontend)

**Arquivo:** `media8-web/src/types/api.ts`

```typescript
export interface VideoFormat {
  id: string;
  name: string;
  slug: string;
  maxDurationSeconds: number;
  tier: VideoFormatTier;
  editingStyleId?: string;
  isActive: boolean; // ✅ Novo
  canDeletePermanently?: boolean; // ✅ Novo
}
```

**Arquivo:** `media8-web/src/types/services.ts`

```typescript
export interface EditingStyle {
  id: string;
  name: string;
  description?: string;
  isActive: boolean; // ✅ Novo
  createdAt: string;
  updatedAt: string;
  canDeletePermanently?: boolean; // ✅ Novo
}
```

### 2. Refatoração de VideoFormatsPage.tsx

**Componentes Adicionados:**
- `Tabs` do shadcn/ui para separação Ativos/Arquivados
- `Dialog` para confirmação de reativação
- `Dialog` para confirmação de exclusão com timer
- Barra de progresso regressiva

**Estado Local Adicional:**
```typescript
const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [formatToDelete, setFormatToDelete] = useState<VideoFormat | null>(null);
const [deleteCountdown, setDeleteCountdown] = useState<number>(5);
const [isDeleteCounting, setIsDeleteCounting] = useState(false);
const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
const [formatToRestore, setFormatToRestore] = useState<VideoFormat | null>(null);
```

**Lógica de Filtragem:**
```typescript
const filteredFormats = useMemo(() => {
  const tabFiltered = videoFormats.filter((format) => {
    if (activeTab === 'active') {
      return format.isActive;
    } else {
      return !format.isActive;
    }
  });

  return tabFiltered.filter(
    (format) =>
      format.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      format.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [videoFormats, activeTab, searchTerm]);
```

**Timer de Exclusão:**
```typescript
const startDeleteCountdown = () => {
  setIsDeleteCounting(true);
  setDeleteCountdown(5);

  const timer = setInterval(() => {
    setDeleteCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        if (formatToDelete) {
          deleteMutation.mutate(formatToDelete.id);
        }
        setIsDeleteDialogOpen(false);
        setFormatToDelete(null);
        setIsDeleteCounting(false);
        setDeleteCountdown(5);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};
```

### 3. Refatoração de EditingStylesPage.tsx

Mesma arquitetura de `VideoFormatsPage.tsx`, com as seguintes adaptações:

```typescript
const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [styleToDelete, setStyleToDelete] = useState<EditingStyle | null>(null);
const [deleteCountdown, setDeleteCountdown] = useState<number>(5);
const [isDeleteCounting, setIsDeleteCounting] = useState(false);
const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
const [styleToRestore, setStyleToRestore] = useState<EditingStyle | null>(null);
```

**Dropdown Menu Condicional:**
```typescript
{style.isActive ? (
  <DropdownMenuItem
    onClick={() => handleSoftDelete(style)}
    className="text-destructive"
  >
    <Trash2 className="h-4 w-4 mr-2" />
    Arquivar
  </DropdownMenuItem>
) : (
  <>
    <DropdownMenuItem onClick={() => handleRestore(style)}>
      <RotateCcw className="h-4 w-4 mr-2" />
      Reativar
    </DropdownMenuItem>
    <DropdownMenuItem
      onClick={() => handleSoftDelete(style)}
      className="text-destructive"
      disabled={!style.canDeletePermanently}
    >
      <Trash2 className="h-4 w-4 mr-2" />
      {style.canDeletePermanently ? 'Excluir Definitivamente' : 'Não pode excluir'}
    </DropdownMenuItem>
  </>
)}
```

## 🧪 Testes e Validação

### Build de Produção
```bash
npm run build
```
**Resultado:** ✅ Sucesso
- Transform: 3197 modules
- Bundle: 1,174.81 KB (gzip: 336.86 kB)
- Erros: 0
- Warnings: 1 (browserslist desatualizado - não crítico)

### Testes Unitários (Vitest)
```bash
npx vitest run
```
**Resultado:** ✅ 21/21 testes passando
- Test Files: 5 passed (5)
- Tests: 21 passed (21)
- Duration: 7.63s

## 📊 Métricas de Mudança

| Arquivo | Linhas Adicionadas | Linhas Removidas |
|---------|-------------------|------------------|
| `VideoFormatsPage.tsx` | +245 | -45 |
| `EditingStylesPage.tsx` | +228 | -40 |
| `api.ts` | +3 | -1 |
| `services.ts` | +2 | -1 |
| **Total** | **+478** | **-88** |

## 🎨 Padrão de UX Consolidado

### Fluxo de Soft Delete (Arquivamento)
1. Admin clica em "Arquivar" (itens ativos)
2. Diálogo confirma: "Arquivar Formato/Estilo"
3. Botão "Arquivar" executa soft delete imediato
4. Item move para aba "Arquivados"

### Fluxo de Hard Delete (Purga)
1. Admin clica em "Excluir Definitivamente" (itens arquivados)
2. **Cenário A: Pode excluir** (`canDeletePermanently = true`)
   - Diálogo: "Excluir Permanentemente"
   - Botão "Iniciar Exclusão (5s)"
   - Timer regressivo com barra de progresso
   - Cancelamento disponível durante contagem
3. **Cenário B: Não pode excluir** (`canDeletePermanently = false`)
   - Botão desabilitado: "Não pode excluir"
   - Tooltip explica dependências

### Fluxo de Reativação
1. Admin clica em "Reativar" (itens arquivados)
2. Diálogo confirma reativação
3. Update `isActive = true`
4. Item retorna para aba "Ativos"

## 🔐 Segurança e Integridade

### Backend (Já Implementado)
- `VideoFormatsController.cs`: Verifica `Offers` e `ServiceBalanceLots`
- `EditingStylesController.cs`: Verifica `Offers`
- Resposta `DeleteResponse` com flag `CanDeletePermanently`

### Frontend (Esta Implementação)
- Validação visual da flag `canDeletePermanently`
- Timer de 5s para ações destrutivas
- Barra de progresso regressiva
- Cancelamento a qualquer momento

## 📚 Lições Aprendidas

### 1. Reutilização de Padrões
A replicação do padrão de `OffersPage` para `VideoFormatsPage` e `EditingStylesPage` demonstrou a importância de estabelecer padrões de UI consistentes desde o início.

### 2. TypeScript como Guarda-Costas
A tipagem forte preveniu erros durante a refatoração, especialmente com as novas propriedades `isActive` e `canDeletePermanently`.

### 3. useMemo para Performance
O uso de `useMemo` para filtragem de formatos e estilos evita re-renders desnecessários e melhora a responsividade da UI.

### 4. Diálogos Modulares
Separar os diálogos de reativação e exclusão em componentes distintos melhora a clareza do código e facilita manutenção.

## 🚀 Próximos Passos

1. **Replicar para Usuários:** Adaptar padrão para `UsersPage` (apenas soft delete)
2. **Replicar para Clientes:** Implementar abas e reativação em `ClientsPage`
3. **Documentar UX Guidelines:** Criar guia de padrões de deleção para futuras implementações
4. **Testes E2E:** Criar testes Cypress/Playwright para fluxos de deleção

## 🔗 Referências

- **Issue Original:** #048 - Abas de Arquivamento e Deleção Condicional
- **Backend:** `Media8.Api/Controllers/VideoFormatsController.cs:217-224`
- **Frontend:** `media8-web/src/pages/admin/VideoFormatsPage.tsx`
- **DTOs:** `Media8.Application/DTOs/Services/VideoFormatDtos.cs`

---

**Status:** ✅ Implementação concluída e validada  
**Próxima Etapa:** Expansão para outras entidades do catálogo
