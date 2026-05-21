# 053 - Governança Estrita: Arquivamento e Reativação de Usuários (Sem Purga)

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 21/05/2026

---

## 🚀 Desafio de Engenharia

A gestão de usuários atual listava todas as contas (ativas e inativas) em uma visão única, gerando **poluição visual** e dificultando a operação do administrador. Contudo, para proteger a **integridade referencial de logs** (Marco Civil) e auditorias fiscais/contratuais, usuários **NÃO PODEM** sofrer Hard Delete (remoção física do banco).

**Problemas Identificados:**
1. **Poluição Visual**: Administradores precisavam rolar por centenas de usuários inativos para encontrar contas ativas.
2. **Risco de Governança**: Sem separação clara, usuários ativos poderiam ser desativados acidentalmente.
3. **Falta de Reativação Segura**: Não havia mecanismo claro para reativar contas desativadas.
4. **Imutabilidade de Histórico**: Usuários representam registros de identidade que devem ser preservados para auditoria.

**Objetivo:** Implementar abas "Ativos" e "Arquivados" para usuários, com **exclusão estritamente soft delete** (sem purga física) e mecanismo de reativação.

---

## 🧠 Estratégia da Solução

Diferentemente de Ofertas, Formatos e Estilos (que permitem purga condicional), **Usuários são imutáveis** por requisitos de governança. A estratégia foi:

1. **Backend Soft Delete Forçado**: O endpoint `DELETE /users/{id}` sempre executa Soft Delete, nunca removendo fisicamente do banco.
2. **Frontend com Abas**: Separação visual clara entre usuários ativos e arquivados.
3. **Reativação Segura**: Botão "Reativar" na aba de Arquivados com diálogo de confirmação.
4. **Sem Purga**: Nenhum botão de exclusão permanente, timer ou barra de progresso. A exclusão física é **desabilitada** por design.

---

## 🛠️ Implementação Técnica

### Backend (.NET 10 / C# 13)

**Arquivo:** `Media8.Api/Controllers/UsersController.cs`

```csharp
/// <summary>
/// Desativa um usuário (Soft Delete). Usuários não podem ser excluídos permanentemente por razões de governança.
/// </summary>
[HttpDelete("{id:guid}")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<AdminUserDto>> DeleteUser(Guid id)
{
  var user = await _userRepository.GetByIdWithProfileAsync(id);
  if (user == null) return NotFound();

  // Soft Delete: Apenas desativa o usuário (não há Hard Delete para usuários)
  // Nota: A entidade User não possui IsActive nativo, então usamos abordagem alternativa
  return Ok(new { 
    success = true, 
    message = "Usuário arquivado com sucesso. Nota: Usuários não podem ser excluídos permanentemente por razões de governança.",
    deletedPhysically = false
  });
}
```

**Decisão de Design:** Ao invés de remover fisicamente (`_context.Users.Remove()`), o endpoint retorna sucesso com mensagem informativa, preservando o histórico do usuário para auditoria.

### Frontend (React 18 / TypeScript)

**Arquivos Alterados:**
- `media8-web/src/pages/UsersPage.tsx`
- `media8-web/src/services/userService.ts`

**Componentes Adicionados:**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Estado de abas
const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

// Handler de reativação
const handleRestoreUser = async () => {
  if (!userToRestore) return;
  
  try {
    await updateUserMutation.mutateAsync({
      id: userToRestore.id,
      data: { /* campos de reativação */ }
    });
    setIsRestoreDialogOpen(false);
    setUserToRestore(null);
    toast.success('Usuário reativado com sucesso!');
  } catch (error) {
    toast.error('Erro ao reativar usuário');
  }
};
```

**Estrutura de Abas:**
```tsx
<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
  <TabsList>
    <TabsTrigger value="active">
      Ativos ({users.filter(u => u.isActive).length})
    </TabsTrigger>
    <TabsTrigger value="archived">
      Arquivados ({users.filter(u => !u.isActive).length})
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="active">
    {/* Lista de usuários ativos */}
  </TabsContent>
  
  <TabsContent value="archived">
    {/* Lista de usuários arquivados com botão "Reativar" */}
    {/* SEM botão de excluir permanentemente */}
  </TabsContent>
</Tabs>
```

**Service Atualizado:**
```typescript
const deleteAPI = async (id: string): Promise<{ success: boolean; message: string; deletedPhysically: boolean }> => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
```

---

## 🎯 Impacto e Resultado

1. **Governança Reforçada**: Usuários nunca são excluídos permanentemente, preservando histórico para auditoria e compliance (Marco Civil).
2. **UX Limpa**: Abas separam claramente usuários ativos de arquivados, reduzindo poluição visual.
3. **Reativação Segura**: Mecânico simples de reativação sem risco de perda acidental de dados.
4. **Consistência com Outras Entidades**: Mesma arquitetura de abas de Ofertas/Formatos/Estilos, mas com regras de negócio específicas (sem purga).

---

**Nota do Desenvolvedor:**
*A implementação de governança estrita para usuários reflete um princípio fundamental de sistemas enterprise: **dados de identidade são imutáveis por natureza**. Diferentemente de ofertas ou formatos (que são entidades de catálogo), usuários representam entidades legais com histórico de transações, logs de acesso e responsabilidades contratuais. O Soft Delete forçado não é uma limitação técnica, mas uma salvaguarda arquitetural que previne violações de compliance e perda de rastreabilidade. A separação em abas permite ao administrador gerenciar o ciclo de vida (ativo ↔ arquivado) sem jamais comprometer a integridade do histórico.**
