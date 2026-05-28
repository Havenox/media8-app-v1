# Documentação Técnica: Problemas na Página /orders/new (Novo Pedido)

**Data:** 28/05/2026  
**Status:** ❌ BLOQUEADO - Problemas Críticos Não Resolvidos  
**Prioridade:** 🔴 CRÍTICA  
**Responsável:** A definir (equipe atual não conseguiu resolver)

---

## 📋 **Visão Geral do Problema**

A página `/orders/new` (Novo Pedido) apresenta **3 problemas críticos** que impedem completamente a criação de novos pedidos na plataforma Media 8. Apesar de múltiplas tentativas de correção, os problemas **PERSISTEM** e a funcionalidade está **BLOQUEADA**.

---

## 🎯 **Problemas Reportados**

### **Problema #1: Dropdown de Lotes de Saldo Exibe Nome Genérico**
**Sintoma:**
- Ao invés de mostrar o nome da oferta (ex: "Pacote Premium - 24 vídeos"), o dropdown exibe apenas "Contrato - 24 vídeos"
- O campo `SnapshotOfferName` não está sendo populado corretamente

**Status:** ✅ **RESOLVIDO** (Commit `f4a7b35`)
**Solução Aplicada:** Correção do acesso ao campo `lot.SnapshotOfferName` ao invés de `lot.contract?.snapshotOfferName`

---

### **Problema #2: Seleção Múltipla em Todos os Dropdowns (CRÍTICO)**
**Sintoma:**
- **AO CARREGAR A PÁGINA:** Todos os 3 dropdowns (Passos 1, 2 e 3) aparecem com **TODOS os itens marcados com "✓"** (selecionados)
- **Placeholder + Nomes:** O texto do placeholder aparece concatenado com os nomes de todos os itens
- **IMPOSSÍVEL SELECIONAR:** Ao clicar em um item específico, todos permanecem selecionados
- **FLUXO BLOQUEADO:** O `step` não avança corretamente porque a seleção não funciona

**Tentativas de Correção (FALHARAM):**

| Tentativa | Abordagem | Resultado |
|-----------|-----------|-----------|
| #1 | `useState(undefined)` | ❌ Piorou - Select perdeu controle |
| #2 | `useState('')` + `value={id \|\| undefined}` | ❌ Não funcionou (`"" \|\| undefined = ""`) |
| #3 | `useState('')` + `value={id ? id : undefined}` | ❌ Mesmo problema persistiu |
| #4 | **Remover `value` controlado** | ❌ **FALHOU - PROBLEMA PERSISTE** |

**Última Implementação (Abordagem C - FALHOU):**
```typescript
// Removido value controlado
<Select onValueChange={handleLotSelect}>
  <SelectValue placeholder="Selecione um lote de saldo" />
</Select>

// Removido setValue do react-hook-form
const handleLotSelect = (lotId: string) => {
  setSelectedLotId(lotId);
  setStep(2);
  // ❌ REMOVIDO: setValue('serviceBalanceLotId', lotId);
};
```

**Resultado:** ❌ **PROBLEMA PERSISTE** - Todos os itens continuam selecionados ao carregar

---

### **Problema #3: Botão "Criar Pedido" Não Funciona**
**Sintoma:**
- Botão permanece inativo ou não dispara nenhuma ação
- Nenhum log no console, nenhuma requisição HTTP, nenhum erro
- Comportamento: como se o `onClick` não estivesse conectado

**Status:** ⏳ **NÃO INVESTIGADO** (depende da correção do Problema #2)

---

## 🔍 **Análise Técnica Detalhada**

### **Arquivo Afetado:**
`media8-web/src/pages/NewOrderPage.tsx`

### **Componentes Envolvidos:**
- `Select` (shadcn/ui / Radix UI)
- `react-hook-form` (gerenciamento de formulário)
- `useState` (estado local)
- `useForm` (react-hook-form)

### **Comportamento Esperado:**

```typescript
// 1. Estado Inicial (ao carregar página)
step = 1
selectedLotId = "" (vazio)
selectedBrandingId = "" (vazio)
selectedEditingId = "" (vazio)

// 2. Dropdown de Lotes (Passo 1)
- Placeholder visível: "Selecione um lote de saldo"
- Nenhum item selecionado no dropdown
- Ao abrir dropdown: lista de lotes disponíveis, nenhum com "✓"

// 3. Usuário Seleciona Lote
- onValueChange é chamado com lotId = "abc-123"
- selectedLotId = "abc-123"
- Trigger atualiza: mostra "Pacote Premium - 24 vídeos"
- step = 2 (avança para próximo passo)
- Apenas 1 item no dropdown aparece com "✓"

// 4. Fluxo Continua
- Passo 2 (Branding): mesmo comportamento
- Passo 3 (Edição): mesmo comportamento
- Passo 4 (Dados): formulário habilita
- Botão "Criar Pedido": habilitado e funcional
```

### **Comportamento Atual (BUG):**

```typescript
// 1. Estado Inicial (ao carregar página) - BUG
step = 1
selectedLotId = "" (vazio)
// ❌ TODOS OS DROPDOWNS aparecem com TODOS os itens selecionados
// ❌ Placeholder + nomes de todos os itens aparecem juntos

// 2. Dropdown de Lotes (Passo 1) - BUG
- Placeholder visível: "Selecione um lote de saldo"
- ❌ TODOS os itens aparecem com "✓" (selecionados)
- ❌ Ao abrir dropdown: TODOS os itens estão marcados com "✓"

// 3. Usuário Tenta Selecionar Lote - BUG
- onValueChange é chamado
- selectedLotId é atualizado
- ❌ MAS: placeholder VOLTA a aparecer
- ❌ TODOS os itens permanecem selecionados
- ❌ step NÃO avança (ou avança incorretamente)

// 4. Fluxo BLOQUEADO
- Passo 2 não habilita corretamente
- Passo 3 não habilita corretamente
- Passo 4 não habilita
- Botão "Criar Pedido" permanece disabled ou inativo
```

---

## 🧪 **Tentativas de Debug Realizadas**

### **Teste 1: `useState(undefined)`**
```typescript
const [selectedLotId, setSelectedLotId] = useState(undefined);
```
**Resultado:** ❌ Select perdeu controle, comportamento imprevisível

### **Teste 2: `useState('')` + `value={id || undefined}`**
```typescript
const [selectedLotId, setSelectedLotId] = useState('');
<Select value={selectedLotId || undefined}>
```
**Resultado:** ❌ `"" || undefined` resulta em `""`, não `undefined`

### **Teste 3: `useState('')` + `value={id ? id : undefined}`**
```typescript
const [selectedLotId, setSelectedLotId] = useState('');
<Select value={selectedLotId ? selectedLotId : undefined}>
```
**Resultado:** ❌ Problema persistiu - todos itens selecionados

### **Teste 4: Remover `value` controlado (Abordagem C)**
```typescript
<Select onValueChange={handleLotSelect}>
  // Sem value controlado
```
**Resultado:** ❌ **FALHOU - PROBLEMA PERSISTE**

---

## 🔎 **Hipóteses Não Testadas**

### **Hipótese 1: Bug no Radix Select**
- Componente `Select` do shadcn/ui (Radix) pode ter bug com `SelectValue`
- **Teste Sugerido:** Substituir por `<select>` nativo do HTML temporariamente

### **Hipótese 2: Conflito com Framer Motion**
- Componente `motion.div` pode estar interferindo com renderização
- **Teste Sugerido:** Remover animações temporariamente

### **Hipótese 3: Problema com `pointer-events-none`**
- Cards dos passos 2 e 3 têm `pointer-events-none` quando `step < 2/3`
- **Teste Sugerido:** Remover `pointer-events-none` temporariamente

### **Hipótese 4: Conflito com `disabled` Prop**
- Selects têm `disabled={step !== 1}` ou `disabled={step < 2}`
- **Teste Sugerido:** Remover `disabled` e testar

### **Hipótese 5: Problema com `SelectValue` Placeholder**
- Componente `SelectValue` pode estar com comportamento bugado
- **Teste Sugerido:** Usar `SelectTrigger` sem `SelectValue`, mostrar texto manualmente

---

## 💡 **Soluções Sugeridas para Próximo Desenvolvedor**

### **Solução A: Substituir Select por Componente Nativo**
```typescript
// Substituir Select do shadcn por <select> nativo
<select
  value={selectedLotId}
  onChange={(e) => {
    setSelectedLotId(e.target.value);
    setStep(2);
  }}
  disabled={step !== 1}
>
  <option value="">Selecione um lote de saldo</option>
  {availableBalances.map((lot) => (
    <option key={lot.id} value={lot.id}>
      {lot.SnapshotOfferName || 'Contrato'} - {lot.RemainingQuantity} vídeos
    </option>
  ))}
</select>
```

**Vantagens:**
- ✅ Componente nativo, sem dependências externas
- ✅ Comportamento previsível e bem documentado
- ✅ Sem conflitos de estado controlado/não-controlado

**Desvantagens:**
- ❌ Perde estilização e UX do shadcn/ui
- ❌ Não tem suporte a ícones/customização avançada

---

### **Solução B: Usar `useController` do react-hook-form**
```typescript
// Integrar Select com react-hook-form corretamente
const { field: lotField } = useController({
  name: 'serviceBalanceLotId',
  control,
  rules: { required: 'Selecione um lote de saldo' }
});

<Select
  value={lotField.value}
  onValueChange={lotField.onChange}
>
  <SelectValue placeholder="Selecione um lote de saldo" />
</Select>
```

**Vantagens:**
- ✅ Integração oficial react-hook-form + componentes controlados
- ✅ Validação automática via Zod
- ✅ Sem estado duplicado

**Desvantagens:**
- ❌ Requer refatoração significativa
- ❌ Pode ainda ter conflito com Radix Select

---

### **Solução C: Criar Componente Wrapper Customizado**
```typescript
// Criar wrapper que gerencia estado internamente
const CustomSelect = ({ onChange, placeholder, options }) => {
  const [internalValue, setInternalValue] = useState('');
  
  return (
    <Select
      value={internalValue}
      onValueChange={(value) => {
        setInternalValue(value);
        onChange(value);
      }}
    >
      <SelectValue placeholder={placeholder} />
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

**Vantagens:**
- ✅ Estado isolado, sem conflitos externos
- ✅ Controle total sobre comportamento

**Desvantagens:**
- ❌ Código adicional para manter
- ❌ Pode não resolver bug do Radix

---

### **Solução D: Debug Profundo com React DevTools**
```bash
# Inspecionar estado real do componente
1. Abrir React DevTools no browser
2. Inspecionar componente <Select>
3. Verificar props: value, defaultValue, onValueChange
4. Verificar estado interno do Radix Select
5. Verificar se há múltiplos SelectValue renderizados
```

**Objetivo:** Entender POR QUE todos os itens aparecem selecionados

---

## 📝 **Checklist para Próximo Desenvolvedor**

- [ ] **Ler este documento completamente**
- [ ] **Reproduzir o bug em ambiente local**
- [ ] **Testar Hipóteses Não Testadas (1-5)**
- [ ] **Tentar Solução A (select nativo) como teste de conceito**
- [ ] **Se Solução A funcionar: bug está no Radix Select**
- [ ] **Se Solução A falhar: bug está em outro lugar (estado, form, etc)**
- [ ] **Documentar solução encontrada neste arquivo**
- [ ] **Adicionar testes para prevenir regressão**

---

## 🚨 **Impacto no Negócio**

**Funcionalidade Bloqueada:**
- ❌ Clientes NÃO conseguem criar novos pedidos
- ❌ Fluxo principal da aplicação está quebrado
- ❌ Impacto direto em receita e experiência do usuário

**Urgência:**
- 🔴 **CRÍTICA** - Funcionalidade core do produto
- 🔴 **BLOQUEANTE** - Impossível criar pedidos
- 🔴 **VISÍVEL** - Afeta todos os usuários finais

---

## 📚 **Referências e Links Úteis**

- **Radix Select Docs:** https://www.radix-ui.com/docs/primitives/components/select
- **React Hook Form + Radix:** https://react-hook-form.com/get-started#IntegratingwithExternalLibraries
- **shadcn/ui Select:** https://ui.shadcn.com/docs/components/select
- **Issue Similar (GitHub):** https://github.com/radix-ui/primitives/issues/XXXX (pesquisar)

---

## 📞 **Contato para Dúvidas**

**Desenvolvedor Anterior:** (não conseguiu resolver - favor não perguntar)  
**Tech Lead:** A definir  
**Prazo Estimado de Resolução:** 2-4 horas (desenvolvedor experiente com React)

---

## 📌 **Histórico de Tentativas**

| Data | Desenvolvedor | Abordagem | Resultado |
|------|--------------|-----------|-----------|
| 28/05/2026 | IA Assistant | `useState(undefined)` | ❌ Falhou |
| 28/05/2026 | IA Assistant | `value={id \|\| undefined}` | ❌ Falhou |
| 28/05/2026 | IA Assistant | `value={id ? id : undefined}` | ❌ Falhou |
| 28/05/2026 | IA Assistant | Remover `value` controlado | ❌ Falhou |
| **A definir** | **Próximo Dev** | **A definir** | **⏳ Pendente** |

---

**Boa sorte, próximo desenvolvedor! Você consegue! 🙏**