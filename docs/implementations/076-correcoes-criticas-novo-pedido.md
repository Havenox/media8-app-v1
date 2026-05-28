# 076 - Frontend: Resolução Definitiva dos Dropdowns e Validação no Novo Pedido (/orders/new)

**Autor:** Antigravity (AI Agent)
**Data:** 28/05/2026
**Status:** ✅ RESOLVIDO

---

## 🚀 Desafio de Engenharia

A página `/orders/new` (Novo Pedido) apresentava **3 problemas críticos** que inviabilizavam o fluxo central de contratação da plataforma Media 8:

1. **Seleção Múltipla Fantasma (Problema #2)**: Ao carregar a página, todos os 3 dropdowns (Passos 1, 2 e 3) apareciam com **todos os itens marcados com "✓"** como se estivessem todos selecionados.
2. **Placeholder Concatenado (Problema #2)**: O texto do placeholder nos triggers dos Selects aparecia concatenado com as strings de todas as opções de uma só vez (ex: "Selecione um lote de saldoPacote Premium - 24 vídeosPacote Básico - 10 vídeos...").
3. **Botão "Criar Pedido" Inativo (Problema #3)**: Ao preencher todos os dados, clicar no botão "Criar Pedido" não realizava nenhuma ação, não emitia requisições HTTP e não mostrava erros no console.

---

## 🔍 Diagnóstico e Análise da Causa Raiz

### 1. O Bug do Case (`.id` vs `.Id`) e Seleção Fantasma
O backend .NET da plataforma Media 8 envia os dados serializados em PascalCase (conforme alinhamento do DTO do contrato de saldo e perfis). 
No código do `NewOrderPage.tsx`, os mapeamentos e iterações de opções estavam acessando as propriedades usando caixa baixa:
* `lot.id` em vez de `lot.Id`
* `profile.id` em vez de `profile.Id`

#### **Efeito Colateral no Radix UI (shadcn/ui):**
1. Como `.id` era inexistente nas propriedades reais, todos os `SelectItem` recebiam `value={undefined}`.
2. Quando a página inicializa, o estado local do Select (`selectedLotId`, `selectedBrandingId`, `selectedEditingId`) é uma string vazia `""` ou `undefined`.
3. O componente `SelectPrimitive.Root` do Radix UI gerencia o estado e compara o valor interno selecionado (`undefined`) com o valor de cada item da lista.
4. Como **todos** os `SelectItem` possuíam `value={undefined}`, a comparação resultou em match positivo para **todas** as opções!
5. Consequentemente:
   * O Radix UI renderizou o indicador de item selecionado (`<Check />`) em todos os elementos.
   * O componente de exibição do valor (`<SelectValue />`) tentou renderizar as strings de todos os itens "selecionados" juntos, resultando no texto de placeholder bizarramente concatenado.

### 2. O Silêncio da Validação do React Hook Form (Botão Inativo)
Em tentativas de debug anteriores, a integração dos Selects com o `react-hook-form` via `setValue(...)` havia sido removida para tentar contornar a seleção fantasma.
* O `zodResolver` continuou ativado com o schema `orderSchema` exigindo que `serviceBalanceLotId`, `brandingProfileId`, e `editingProfileId` fossem strings preenchidas (`.min(1)`).
* Como o formulário não recebia atualizações desses campos (pois o `setValue` foi removido), a validação falhava silenciosamente ao interceptar o `handleSubmit`.
* Isso impedia o acionamento do callback `onSubmit`, dando a falsa impressão de que o `onClick` do botão não estava conectado.

---

## 🛠️ A Solução Definitiva

A implementação corrigiu os dois problemas de maneira elegante e nativa, reestabelecendo o fluxo correto e integrado:

### 1. Ajuste de Capitalização das Propriedades (PascalCase)
Substituímos todos os acessos `.id` por `.Id` nos mapeamentos dos dropdowns de Lotes de Saldo, Branding Profiles e Editing Profiles.

```typescript
// Passo 1 - Lotes de Saldo
availableBalances.map((lot) => (
  <SelectItem key={lot.Id} value={lot.Id}>
    {lot.SnapshotOfferName || 'Contrato'} - {lot.RemainingQuantity} vídeos
  </SelectItem>
))

// Passo 2 - Branding Profiles
brandingProfiles.map((profile) => (
  <SelectItem key={profile.Id} value={profile.Id}>
    {profile.Name}
  </SelectItem>
))
```

### 2. Definição Controlada com Reintegração ao Form State
Reintroduzimos o estado controlado utilizando a propriedade `value` em cada componente `<Select>` e adicionamos a atualização do estado do formulário (`setValue`) em cada gatilho de seleção e retorno de sucesso de modais:

```typescript
const handleLotSelect = (lotId: string) => {
  setSelectedLotId(lotId);
  setValue('serviceBalanceLotId', lotId); // Reintegrado com react-hook-form!
  setStep(2);
};

// ...

<Select
  value={selectedLotId}
  onValueChange={handleLotSelect}
  disabled={step !== 1}
>
```

---

## 🎯 Resultados Obtidos

* **✅ Resolução da Seleção Múltipla**: Cada dropdown passou a operar estritamente de forma individual. Apenas o item efetivamente selecionado recebe a marcação "✓".
* **✅ Placeholder Correto**: O trigger exibe apenas o texto de placeholder ou o nome do item selecionado. Sem concatenações anômalas.
* **✅ Avanço em Cascata**: Os passos avançam fluentemente conforme a seleção é efetuada (Passo 1 → Passo 2 → Passo 3 → Passo 4).
* **✅ Validação e Submissão**: O `react-hook-form` recebe os valores, valida com sucesso usando o resolver Zod e executa a criação do pedido perfeitamente através da API.

---

## 📚 Lições Práticas

1. **Case-Sensitivity nos Contratos da API:** Em projetos integrados com backends fortemente tipados (como C# .NET), discrepâncias sutis como `.id` vs `.Id` no TypeScript causam falhas graves em tempo de execução sem necessariamente quebrar a compilação.
2. **Comportamento do Radix com `undefined`:** O Radix UI Select é extremamente sensível a valores de opção `undefined`. Valores nulos ou duplicados nas opções levam a bugs visuais complexos como marcações múltiplas fantasmas.
3. **Mantenha Validações Visíveis:** Sempre que possível, inclua tratamento visual para erros de formulário, impedindo que validações falhem de forma silenciosa para o usuário final.