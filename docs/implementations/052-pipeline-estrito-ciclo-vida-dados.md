# 052 - Pipeline Estrito: Ciclo de Vida de Dados (Ativo → Arquivado → Purga)

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 21/05/2026

---

## 🚀 Desafio de Engenharia

O fluxo anterior de exclusão permitia que itens recém-criados ou sem vínculos comerciais fossem **excluídos permanentemente** diretamente da aba de **Ativos**, causando inconsistência grave de UX e risco de perda acidental de dados.

**Problemas Identificados:**
1. **Quebra de Consistência Visual**: O administrador via um diálogo destrutivo com timer e barra de progresso ao tentar arquivar um item na aba de Ativos, o que causava estranheza e ansiedade desnecessária.
2. **Risco de Purga Prematura**: Itens criados por engano poderiam ser apagados permanentemente sem passar pelo estágio de revisão dos Arquivados.
3. **Falta de Clareza Semântica**: A ação "Arquivar" e "Excluir Permanentemente" estavam misturadas no mesmo fluxo, confundindo o usuário sobre o ciclo de vida real dos dados.

**Objetivo:** Estabelecer um pipeline linear e obrigatório: **Ativo → Arquivado → Purga**, onde nenhuma etapa pode ser pulada.

---

## 🧠 Estratégia da Solução

Implementou-se um controle via **Query String** (`?permanent=true`) no backend para diferenciar a intenção da requisição de deleção:

1. **Na aba de Ativos (Ação "Arquivar")**:
   - O frontend dispara `DELETE /entity/{id}` (sem parâmetros ou `permanent=false`).
   - O backend intercepta e executa **estritamente Soft Delete** (`IsActive/IsPublic = false`).
   - O item é movido para a aba de Arquivados de forma amigável e segura.
   - **Diálogo de UI:** Simples, sem timer, sem barra de progresso.

2. **Na aba de Arquivados (Ação "Excluir Definitivamente")**:
   - O frontend dispara `DELETE /entity/{id}?permanent=true` apenas após o timer de 5 segundos.
   - O backend valida se o item é órfão (sem dependências).
   - Se houver dependências: retorna `400 Bad Request`.
   - Se for órfão: executa **Hard Delete** (`_context.Remove()`).
   - **Diálogo de UI:** Timer de 5s com barra de progresso, exclusivo para purga.

**Por que este caminho?** A separação via query string permitiu manter o mesmo endpoint REST, mas com comportamentos distintos baseados no contexto de uso, evitando a criação de endpoints redundantes e mantendo a semântica de "deleção" unificada.

---

## 🛠️ Implementação Técnica

### Backend (.NET 10 / C# 13)

**Arquivos Alterados:**
- `Media8.Api/Controllers/OffersController.cs`
- `Media8.Api/Controllers/VideoFormatsController.cs`
- `Media8.Api/Controllers/EditingStylesController.cs`

**Mudança Chave:**
```csharp
[HttpDelete("{id:guid}")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<DeleteResponse>> DeleteEntity(Guid id, [FromQuery] bool permanent = false)
{
    var entity = await _context.Entities.FindAsync(id);
    if (entity == null) return NotFound();

    // Se permanent=false (padrão), apenas arquiva
    if (!permanent)
    {
        entity.IsPublic = false; // ou IsActive
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new DeleteResponse { Success = true, DeletedPhysically = false });
    }

    // Se permanent=true, verifica dependências
    var hasDependencies = await CheckDependencies(id);
    if (hasDependencies)
    {
        return BadRequest(new DeleteResponse 
        { 
            Success = false, 
            Message = "Não é possível excluir: possui dependências." 
        });
    }

    // Hard Delete: remove fisicamente
    _context.Entities.Remove(entity);
    await _context.SaveChangesAsync();
    return Ok(new DeleteResponse { Success = true, DeletedPhysically = true });
}
```

### Frontend (React 18 / TypeScript)

**Serviços Atualizados:**
- `media8-web/src/services/offerService.ts`
- `media8-web/src/services/videoFormatService.ts`
- `media8-web/src/services/editingStyleService.ts`

**Assinatura Atualizada:**
```typescript
const deleteAPI = async (id: string, permanent = false): Promise<void> => {
  const params = new URLSearchParams({ permanent: permanent.toString() });
  await api.delete(`/entity/${id}?${params.toString()}`);
};
```

**Hooks Atualizados:**
- `media8-web/src/hooks/useOffers.ts`
- `media8-web/src/hooks/useVideoFormats.ts`
- `media8-web/src/hooks/useEditingStyles.ts`

```typescript
export const useDeleteEntity = () => {
  return useMutation({
    mutationFn: ({ id, permanent = false }: { id: string; permanent?: boolean }) =>
      entityService.delete(id, permanent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
      toast.success('Entidade removida com sucesso!');
    },
  });
};
```

**Páginas Refatoradas:**
- `media8-web/src/pages/admin/OffersPage.tsx`
- `media8-web/src/pages/admin/VideoFormatsPage.tsx`
- `media8-web/src/pages/admin/EditingStylesPage.tsx`

**Separação de Diálogos:**
```tsx
{/* Aba Ativos: Diálogo Simples */}
<Dialog open={isDeleteDialogOpen && activeTab === 'active'}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Arquivar Item</DialogTitle>
      <DialogDescription>
        Mover para arquivados? O item não será visível no catálogo ativo.
      </DialogDescription>
    </DialogHeader>
    <Button onClick={() => handleDelete(false)}>Arquivar</Button>
  </DialogContent>
</Dialog>

{/* Aba Arquivados: Diálogo com Timer */}
<Dialog open={isDeleteDialogOpen && activeTab === 'archived'}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Excluir Permanentemente</DialogTitle>
      <DialogDescription>
        {item.canDeletePermanently 
          ? "Ação irreversível. Confirme em 5s..." 
          : "Item possui dependências e não pode ser excluído."}
      </DialogDescription>
    </DialogHeader>
    {item.canDeletePermanently && <CountdownTimer onComplete={() => handleDelete(true)} />}
  </DialogContent>
</Dialog>
```

---

## 🎯 Impacto e Resultado

1. **Consistência de UX Restaurada**: Administradores não veem mais diálogos destrutivos ao arquivar itens ativos. O fluxo é intuitivo e alinhado com o modelo mental de "mover para lixeira".
2. **Segurança de Dados Reforçada**: A purga de dados agora requer uma ação explícita na aba de Arquivados, com timer de 5 segundos e validação de dependências no backend.
3. **Código Mais Limpo**: A separação de diálogos por aba (`activeTab === 'active'` vs `activeTab === 'archived'`) eliminou condicionais complexas dentro dos modais.
4. **Prevenção de Erros**: A validação no backend (`permanent=true` com dependências retorna 400) impede que scripts ou requisições diretas contornem a UI e excluam dados críticos.

---

**Nota do Desenvolvedor:**
*A implementação do pipeline estrito de ciclo de vida (Ativo → Arquivado → Purga) reflete um princípio de design conservador: dados devem ser preservados por padrão e a destruição deve ser um ato consciente e validado. A query string `?permanent=true` atua como um "modificador de intenção", permitindo que o mesmo endpoint REST comporte-se de forma distinta baseado no contexto de uso, sem violar a semântica HTTP. Esta abordagem evita a proliferação de endpoints como `/archive/{id}` e `/delete/{id}`, mantendo a API limpa e focada em recursos.*
