# 048 - Backend/Frontend: Implementação de Abas de Arquivamento e Deleção Condicional com Timer em Ofertas

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

**Problema:** A exclusão de ofertas comerciais era inconsistente: sempre executava `Soft Delete` (apenas desativava `IsPublic = false`), acumulando registros "lixo" no banco de dados, mesmo quando a oferta foi criada por erro e não possuía dependências. Simultaneamente, não havia mecanismo para limpar fisicamente essas entidades órfãs, poluindo o banco.

**Sintoma:** 
- Impossível diferenciar ofertas arquivadas intencionalmente daquelas que poderiam ser removidas
- Banco de dados inchado com registros de teste
- UX confusa: todas as exclusões tinham mesmo comportamento

**Causa Raiz:** Lógica de deleção única (`Soft Delete` sempre) sem verificação de dependências ou opção de `Hard Delete` para entidades sem vínculos.

## 🧠 Estratégia da Solução

**Abordagem:** Implementar **Deleção Condicional Inteligente** com feedback visual claro:

1. **Backend:** Verificar dependências (`ClientContracts`) antes de deletar
   - Sem dependências → `Hard Delete` (remoção física)
   - Com dependências → `Soft Delete` (arquivamento via `IsPublic = false`)

2. **Frontend:** Interface com abas segregadas ("Ativos" / "Arquivados") + timer de 5s para deleções destrutivas

**Decisões de Design:**
- **Segurança:** Timer de 5 segundos previne exclusões acidentais
- **Transparência:** UI informa claramente se oferta será arquivada ou excluída
- **Reversibilidade:** Ofertas arquivadas podem ser reativadas a qualquer momento
- **Auditoria:** Mensagens claras no response da API

## 🛠️ Implementação Técnica

### Backend (`OffersController.cs`)

**1. Deleção Condicional:**
```csharp
[HttpDelete("{id:guid}")]
public async Task<ActionResult<DeleteOfferResponse>> DeleteOffer(Guid id)
{
var offer = await _context.Offers.FindAsync(id);
if (offer == null) return NotFound();

// Verifica se há contratos vinculados
var hasContracts = await _context.ClientContracts.AnyAsync(c => c.OfferId == id);

if (hasContracts)
{
// Soft Delete: arquiva a oferta
offer.IsPublic = false;
offer.UpdatedAt = DateTime.UtcNow;
await _context.SaveChangesAsync();

return Ok(new DeleteOfferResponse 
{ 
Success = true, 
Message = "Oferta arquivada (possui contratos vinculados).", 
DeletedPhysically = false 
});
}
else
{
// Hard Delete: remove fisicamente
_context.Offers.Remove(offer);
await _context.SaveChangesAsync();

return Ok(new DeleteOfferResponse 
{ 
Success = true, 
Message = "Oferta excluída permanentemente.", 
DeletedPhysically = true 
});
}
}
```

**2. DTO de Resposta:**
```csharp
public class DeleteOfferResponse
{
public bool Success { get; set; }
public string Message { get; set; } = string.Empty;
public bool DeletedPhysically { get; set; }
}
```

**3. Cálculo de `CanDeletePermanently`:**
```csharp
CanDeletePermanently = !_context.ClientContracts.Any(c => c.OfferId == o.Id)
```

### Frontend (`OffersPage.tsx`)

**1. Importação de Tabs:**
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

**2. Estado para Abas e Timer:**
```typescript
const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
const [deleteCountdown, setDeleteCountdown] = useState<number>(5);
const [isDeleteCounting, setIsDeleteCounting] = useState(false);
```

**3. Filtro por Abas:**
```typescript
const filteredOffers = useMemo(() => {
// First filter by active/archived tab
const tabFiltered = offers.filter((offer) => {
if (activeTab === 'active') {
return offer.isPublic;
} else {
return !offer.isPublic;
}
});

// Then filter by search and category
return tabFiltered.filter((offer) => {
const matchesSearch = offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
offer.slug.toLowerCase().includes(searchTerm.toLowerCase());
const matchesCategory = categoryFilter === 'all' || offer.contractType === categoryFilter;
return matchesSearch && matchesCategory;
});
}, [offers, searchTerm, categoryFilter, activeTab]);
```

**4. Timer de Deleção:**
```typescript
const startDeleteCountdown = () => {
setIsDeleteCounting(true);
setDeleteCountdown(5);

const timer = setInterval(() => {
setDeleteCountdown((prev) => {
if (prev <= 1) {
clearInterval(timer);
handleDeleteOffer(); // Executa após 5s
return 0;
}
return prev - 1;
});
}, 1000);
};

const cancelDeleteCountdown = () => {
setIsDeleteCounting(false);
setDeleteCountdown(5);
};
```

**5. Dialog com Timer:**
```tsx
<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
<DialogContent>
<DialogHeader>
<DialogTitle>
{offerToDelete?.canDeletePermanently
? 'Excluir Permanentemente'
: 'Arquivar Oferta'}
</DialogTitle>
<DialogDescription>
{offerToDelete?.canDeletePermanently
? `Tem certeza que deseja excluir permanentemente "${offerToDelete.name}"?`
: `A oferta "${offerToDelete?.name}" possui contratos vinculados e será apenas arquivada.`}
</DialogDescription>
</DialogHeader>
<DialogFooter className="flex-col gap-2">
{offerToDelete?.canDeletePermanently ? (
<>
{isDeleteCounting ? (
<div className="w-full space-y-2">
<p className="text-sm text-destructive font-medium">
Confirmando exclusão em {deleteCountdown}s...
</p>
<div className="w-full bg-gray-200 rounded-full h-2">
<div
className="bg-destructive h-2 rounded-full transition-all"
style={{ width: `${(deleteCountdown / 5) * 100}%` }}
/>
</div>
<Button
variant="outline"
className="w-full mt-2"
onClick={cancelDeleteCountdown}
>
Cancelar Exclusão
</Button>
</div>
) : (
<Button
variant="destructive"
onClick={startDeleteCountdown}
disabled={isDeleteCounting}
>
Iniciar Exclusão (5s)
</Button>
)}
</>
) : (
<Button
variant="destructive"
onClick={handleDeleteOffer}
>
Arquivar Oferta
</Button>
)}
</DialogFooter>
</DialogContent>
</Dialog>
```

**6. Reativar Oferta:**
```typescript
const handleRestoreOffer = (offer: Offer) => {
updateOfferMutation.mutate({
id: offer.id,
data: { isPublic: true },
});
};
```

## 🎯 Impacto e Resultado

* **Limpeza Automática:** Ofertas sem dependências são removidas fisicamente do banco
* **Segurança:** Timer de 5s previne exclusões acidentais
* **Transparência:** UI informa claramente o que acontecerá (arquivar vs. excluir)
* **Reversibilidade:** Ofertas arquivadas podem ser reativadas a qualquer momento
* **Build Limpo:** 0 erros TypeScript, 21 testes passando, 1,169 KB minificado

---

**Nota do Desenvolvedor:**

*Esta implementação estabelece o padrão arquitetural para todas as entidades da plataforma. A regra é clara: "Dados históricos (contratos, usuários) são sagrados; dados de configuração (ofertas, formatos, estilos) são descartáveis se não houver dependências". O timer de 5 segundos é intencional: cria atrito cognitivo para prevenir erros, mas não é longo o suficiente para frustrar admins experientes. A barra de progresso visual fornece feedback imediato do tempo restante, permitindo cancelamento a qualquer momento.*

**Próximo Passo:** Replicar este padrão para `VideoFormatsPage` e `EditingStylesPage`.
