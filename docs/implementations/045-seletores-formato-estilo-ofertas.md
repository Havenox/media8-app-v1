# 045 - Frontend: Integração de Seletores de Formato e Estilo em Ofertas Comerciais

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

**Problema:** O formulário de criação de ofertas (`OffersPage.tsx`) estava incompleto, sem campos para selecionar `VideoFormatId` e `EditingStyleId`. Isso resultava em ofertas sendo criadas com chaves estrangeiras nulas, fazendo a backend `ServiceBalanceService.ProvisionContractBalanceAsync` falhar silenciosamente e gerando contratos de clientes sem saldos provisionados.

**Sintoma:** Admin conseguia criar ofertas, atribuir a clientes, mas o cliente final não recebia créditos de edição porque o sistema não sabia qual formato de vídeo provisionar.

**Causa Raiz:** Formulário de ofertas sem seletores para:
- Formato de Vídeo (obrigatório)
- Estilo de Edição (opcional)

## 🧠 Estratégia da Solução

**Abordagem:** Expandir o formulário de ofertas existente para incluir dois componentes `<Select>` do shadcn/ui que listam dinamicamente formatos e estilos do banco de dados.

**Decisões de Design:**
- **Obrigatório vs Opcional:** `videoFormatId` é obrigatório (sem formato = sem saldo), `editingStyleId` é opcional
- **Loading States:** Exibir spinner enquanto carrega dados dos hooks
- **Empty States:** Placeholders claros quando nenhum item disponível
- **Pré-carregamento:** Ao editar oferta, carregar valores atuais dos IDs
- **Validação:** TypeScript type-safety com `NewOfferState` expandido

## 🛠️ Implementação Técnica

### 1. Importação de Hooks (`OffersPage.tsx`)

Adicionado import do hook de estilos de edição:
```typescript
import { useEditingStyles } from '@/hooks/useEditingStyles';
```

### 2. Expansão do Estado (`NewOfferState`)

Adicionado campos ao estado da oferta:
```typescript
interface NewOfferState {
  // ... campos existentes
  videoFormatId?: string;
  editingStyleId?: string;
}
```

### 3. Hooks no Componente

Carregamento de dados dinâmicos:
```typescript
const { data: videoFormats = [], isLoading: isLoadingFormats } = useVideoFormats();
const { data: editingStyles = [], isLoading: isLoadingStyles } = useEditingStyles();
```

### 4. Componentes `<Select>` no Formulário

Adicionado dois seletores após "Quantidade de Vídeos":

**Formato de Vídeo (obrigatório):**
```tsx
<Select
  value={newOffer.videoFormatId || ''}
  onValueChange={(value) =>
    setNewOffer({ ...newOffer, videoFormatId: value || undefined })
  }
>
  <SelectTrigger>
    <SelectValue placeholder="Selecione um formato" />
  </SelectTrigger>
  <SelectContent>
    {isLoadingFormats ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      videoFormats.map((format) => (
        <SelectItem key={format.id} value={format.id}>
          {format.name}
        </SelectItem>
      ))
    )}
  </SelectContent>
</Select>
```

**Estilo de Edição (opcional):**
```tsx
<Select
  value={newOffer.editingStyleId || ''}
  onValueChange={(value) =>
    setNewOffer({ ...newOffer, editingStyleId: value || undefined })
  }
>
  <SelectTrigger>
    <SelectValue placeholder="Selecione um estilo" />
  </SelectTrigger>
  <SelectContent>
    {isLoadingStyles ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      editingStyles.map((style) => (
        <SelectItem key={style.id} value={style.id}>
          {style.name}
        </SelectItem>
      ))
    )}
  </SelectContent>
</Select>
```

### 5. Atualização do Payload (`handleCreateOffer`)

Mapeamento dos novos campos:
```typescript
const offerData: CreateOfferRequest = {
  // ... campos existentes
  videoFormatId: newOffer.videoFormatId || undefined,
  editingStyleId: newOffer.editingStyleId || undefined,
};
```

### 6. Pré-carregamento na Edição (`handleEditOffer`)

Carregar valores ao editar:
```typescript
const handleEditOffer = (offer: Offer) => {
  setNewOffer({
    // ... outros campos
    videoFormatId: offer.videoFormatId,
    editingStyleId: offer.editingStyleId || undefined,
  });
  // ...
};
```

## 🎯 Impacto e Resultado

* **Ofertas Completas:** Admin seleciona formato e estilo antes de criar oferta
* **Saldos Provisionados:** Backend recebe `videoFormatId` e cria `ServiceBalanceLot` corretamente
* **Cliente Satisfeito:** Créditos aparecem no dashboard do cliente
* **UX Consistente:** Mesmos padrões shadcn/ui, loading states, placeholders

---

**Nota do Desenvolvedor:**

*Esta implementação fecha o ciclo iniciado no estudo de caso #043 (Roadmap). Com os seletores integrados, o fluxo completo agora é: Admin cria Estilos → Admin cria Ofertas (com formato e estilo) → Admin atribui Oferta ao Cliente → Backend provisiona Saldos → Cliente visualiza e consome créditos. A validação de `videoFormatId` como obrigatório é crítica: sem ela, o backend aborta o provisionamento. Manter `editingStyleId` como opcional reflete a realidade de negócio: estilos são metadata adicional, não requisito para provisionamento.*

**Próximo Passo Sugerido:** Validação em backend para rejeitar ofertas sem `videoFormatId` (400 Bad Request) ao invés de aceitar e falhar silenciosamente.
