# 076 - Frontend: Correções Críticas na Página de Novo Pedido (/orders/new)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 28/05/2026

---

## 🚀 Desafio de Engenharia

A página `/orders/new` (Novo Pedido) apresentava **3 problemas críticos** que impediam completamente a criação de novos pedidos na plataforma Media 8:

1. **Seleção Múltipla Fantasma**: Todos os dropdowns (Lotes de Saldo, Branding Profiles, Editing Profiles) apareciam com **TODOS os itens marcados como selecionados (✓)** ao carregar a página, mesmo sem nenhuma seleção do usuário.

2. **Concatenação de Placeholder**: O texto do placeholder aparecia concatenado com os nomes de todos os itens do dropdown, exibindo algo como "Selecione um perfil de brandingTESTE2teste12".

3. **Fluxo em Cascata Bloqueado**: O avanço automático dos passos (step 1 → 2 → 3 → 4) não funcionava corretamente porque a seleção dos dropdowns estava quebrada.

**Impacto no Negócio**: Funcionalidade core do produto completamente bloqueada. Clientes impossibilitados de criar novos pedidos.

### **Tentativas Fracassadas (4 Iterações)**

Antes da solução definitiva, foram tentadas 4 abordagens que **NÃO resolveram** o problema:

| Tentativa | Abordagem | Resultado |
|-----------|-----------|-----------|
| #1 | `useState(undefined)` | ❌ Select perdeu controle, comportamento imprevisível |
| #2 | `useState('')` + `value={id \|\| undefined}` | ❌ Operador `||` não converte `""` para `undefined` |
| #3 | `useState('')` + `value={id ? id : undefined}` | ❌ Problema persistiu - todos itens selecionados |
| #4 | Remover `value` controlado (Abordagem C) | ❌ Problema persistiu - conflito de estado continuou |

**Diagnóstico Raiz**: O componente `Select` do Radix UI (usado pelo shadcn/ui) estava recebendo valores de **DUAS fontes simultâneas**:
- Estado local (`selectedLotId`, `selectedBrandingId`, `selectedEditingId`)
- `setValue()` do react-hook-form (`serviceBalanceLotId`, `brandingProfileId`, `editingProfileId`)

Este conflito causava comportamento indefinido onde o Select alternav entre estados controlado e não-controlado, resultando em todos os itens aparecendo como selecionados.

---

## 🧠 Estratégia da Solução

A solução definitiva exigiu **isolar completamente o estado dos Selects** do react-hook-form, mantendo apenas:
1. **Estado local** para gerenciar seleção e avanço de passos (step)
2. **Validação manual** no onSubmit para campos obrigatórios
3. **Integração mínima** com react-hook-form (apenas para campos de texto do Passo 4)

**Decisão Arquitetural**: Aceitar a perda da validação automática do Zod nos Selects em troca de:
- ✅ Comportamento previsível e funcional
- ✅ Fluxo em cascata funcionando
- ✅ UX correta (1 item selecionado por vez)
- ✅ Validação manual ainda possível via toast.error()

**Por Que Esta Abordagem Funciona**:
- Remove conflito de estado (estado local vs form state)
- Select opera como componente não-controlado
- `onValueChange` gerencia apenas estado local e avanço de step
- Validação manual no onSubmit garante integridade dos dados

---

## 🛠️ Implementação Técnica

### **Frontend (`media8-web/src/pages/NewOrderPage.tsx`)**

#### **1. Remoção de `setValue()` dos Handlers**

**Antes (Conflito de Estado):**
```typescript
const handleLotSelect = (lotId: string) => {
  setSelectedLotId(lotId);
  setValue('serviceBalanceLotId', lotId); // ❌ Conflito!
  setStep(2);
};
```

**Depois (Estado Isolado):**
```typescript
const handleLotSelect = (lotId: string) => {
  setSelectedLotId(lotId);
  setStep(2); // ✅ Apenas estado local
};
```

**Mudanças Aplicadas:**
- `handleLotSelect`: Removido `setValue('serviceBalanceLotId', lotId)`
- `handleBrandingSelect`: Removido `setValue('brandingProfileId', value)`
- `handleEditingSelect`: Removido `setValue('editingProfileId', value)`

#### **2. Remoção de `value` Controlado dos Selects**

**Antes (Controlado, Conflituoso):**
```typescript
<Select
  value={selectedLotId ? selectedLotId : undefined}
  onValueChange={handleLotSelect}
  disabled={step !== 1}
>
```

**Depois (Não-Controlado, Isolado):**
```typescript
<Select
  onValueChange={handleLotSelect}
  disabled={step !== 1}
>
```

**Mudanças Aplicadas:**
- Select de Lotes de Saldo (Passo 1): Removido `value={...}`
- Select de Branding Profiles (Passo 2): Removido `value={...}`
- Select de Editing Profiles (Passo 3): Removido `value={...}`

#### **3. Validação Manual no `onSubmit`**

**Antes (Validação Automática via Zod):**
```typescript
const onSubmit = async (data: OrderFormData) => {
  createOrderMutation.mutate({
    ...data,
    ServiceBalanceLotId: data.serviceBalanceLotId, // ❌ Vem do form (pode ser vazio)
    BrandingProfileId: data.brandingProfileId,
    EditingProfileId: data.editingProfileId,
  });
};
```

**Depois (Validação Manual + Estados Locais):**
```typescript
const onSubmit = async (data: OrderFormData) => {
  // ✅ Validação manual dos Selects (não estão mais no react-hook-form)
  if (!selectedLotId) {
    toast.error('Selecione um lote de saldo');
    return;
  }
  if (!selectedBrandingId) {
    toast.error('Selecione um perfil de branding');
    return;
  }
  if (!selectedEditingId) {
    toast.error('Selecione um perfil de edição');
    return;
  }

  createOrderMutation.mutate({
    ...data,
    ServiceBalanceLotId: selectedLotId, // ✅ Usa estado local (garantido preenchido)
    BrandingProfileId: selectedBrandingId,
    EditingProfileId: selectedEditingId,
  });
};
```

**Mudanças Aplicadas:**
- Adicionadas 3 validações manuais com `toast.error()`
- Substituição de `data.*Id` por `selected*Id` nos parâmetros do mutate
- Validação de campos obrigatórios mantida (via if manual)

#### **4. Correção de Acesso ao `SnapshotOfferName` (Problema #1)**

**Antes (Acesso Incorreto):**
```typescript
{lot.contract?.snapshotOfferName || 'Contrato'} - {lot.remainingQuantity} vídeos
```

**Depois (Acesso Direto ao DTO):**
```typescript
{lot.SnapshotOfferName || 'Contrato'} - {lot.RemainingQuantity} vídeos
```

**Mudanças Aplicadas:**
- Linha 235: `lot.contract?.snapshotOfferName` → `lot.SnapshotOfferName`
- Linha 235: `lot.remainingQuantity` → `lot.RemainingQuantity` (PascalCase)

**Contexto**: O endpoint `/ServiceBalances/MyBalances` retorna `UnifiedServiceBalanceDto`, que tem `SnapshotOfferName` como propriedade plana (não dentro de objeto `Contract`).

---

## 🎯 Impacto e Resultado

### **Problemas Resolvidos:**

* **✅ Seleção Múltipla Fantasma**: Dropdowns agora exibem apenas 1 item selecionado por vez (ou nenhum, quando vazio)
* **✅ Concatenação de Placeholder**: Placeholder aparece isolado quando nenhum item está selecionado
* **✅ Fluxo em Cascata Funcional**: `step` avança corretamente (1 → 2 → 3 → 4) após seleção válida
* **✅ Nomes dos Lotes Exibidos Corretamente**: "Pacote Premium - 24 vídeos" ao invés de "Contrato - 24 vídeos"
* **✅ Validação Mantida**: Campos obrigatórios ainda são validados (via if manual no onSubmit)

### **Benefícios Técnicos:**

* **Separação de Responsabilidades**: Estado local gerencia UI (seleção + step), react-hook-form gerencia apenas campos de texto
* **Código Mais Previsível**: Sem conflito entre fontes de estado
* **UX Melhorada**: Comportamento esperado pelo usuário (1 seleção por dropdown)
* **Manutenibilidade**: Validação manual é explícita e fácil de debugar

### **Trade-offs Aceitos:**

* **Perda de Validação Automática do Zod**: Campos dos Selects não são mais validados automaticamente pelo schema Zod (necessita validação manual)
* **Código Verbose no onSubmit**: 3 ifs manuais ao invés de validação declarativa no schema
* **Estados Duplicados**: `selectedLotId` (local) e `serviceBalanceLotId` (form) coexistem (mas não conflitam mais)

---

## 📚 Lições Aprendidas

### **1. Conflito de Estado é Silencioso e Destrutivo**

Quando um componente recebe valores de **duas fontes diferentes** (estado local + react-hook-form), o comportamento torna-se **indefinido** e **impossível de debugar** apenas com logs. O React alterna entre controlled/uncontrolled sem warnings claros.

**Lição**: **NUNCA** misture `useState` + `setValue` para o mesmo dado em componentes controlados.

### **2. `value={id || undefined}` Não Funciona Como Esperado**

O operador `||` em JavaScript **NÃO** converte `""` para `undefined`:
```javascript
"" || undefined  // Resultado: "" (string vazia, não undefined!)
```

Para conversão explícita, usar ternário:
```javascript
id ? id : undefined  // ✅ Funciona corretamente
```

**Lição**: Operadores lógicos têm comportamento específico com valores falsy. Testar sempre.

### **3. Radix Select é Sensível a `value=undefined`**

O componente `Select` do Radix UI trata `value={undefined}` de forma diferente do esperado. Em alguns casos, isso causa **seleção múltipla fantasma** (todos os itens aparecem selecionados).

**Lição**: Quando usar Radix Select com react-hook-form, preferir `useController` ou isolar completamente o estado.

### **4. Validação Manual é Melhor Que Validação Quebrada**

Mesmo perdendo a validação automática do Zod, a validação manual com `toast.error()` é **preferível** porque:
- ✅ Funciona
- ✅ É explícita
- ✅ É fácil de debugar
- ✅ Mensagens de erro são customizáveis

**Lição**: Pragmatismo > Perfeccionismo. Validação que funciona > Validação "correta" que não funciona.

---

## 🔗 Referências

- **Radix Select Docs**: https://www.radix-ui.com/primitives/docs/components/select
- **React Hook Form + Radix Integration**: https://react-hook-form.com/get-started#IntegratingwithExternalLibraries
- **Controlled vs Uncontrolled Components**: https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components

---

**Nota do Desenvolvedor:** *Esta foi uma das implementações mais frustrantes da carreira. O problema parecia simples (apenas "consertar um dropdown"), mas exigiu 4 iterações falhas antes de entender a raiz: conflito de estado entre useState e setValue. A lição mais valiosa foi: quando um componente controlado se comporta de forma imprevisível, a primeira hipótese deve ser "estado duplicado/conflituoso", não "bug na biblioteca". Radix UI e shadcn/ui são bibliotecas maduras e bem testadas. Se há comportamento estranho, 99% das vezes é conflito no código da aplicação, não bug na biblioteca.*