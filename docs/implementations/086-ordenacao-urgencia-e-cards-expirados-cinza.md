# 086 - [Dashboard/Serviços]: Ordenação por Urgência de Expirados e Cards Acinzentados

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 29/05/2026

---

## 🚀 Desafio de Engenharia

Durante a auditoria visual do dashboard e da tela `/services`, foram identificadas duas melhorias de usabilidade críticas:

1. **Ordenação Incorreta de Expirados**: Na ordenação padrão por "Mais Urgente" (que elenca primeiro os ativos com menor prazo, depois os ativos sem validade, e por fim os expirados), os lotes expirados estavam sendo ordenados do mais antigo para o mais recente. Como consequência, na listagem de serviços, o `Mês 1/6` (expirado em abril) aparecia incorretamente antes do `Mês 2/6` (expirado em maio, ou seja, mais recente).
2. **Poluição Visual por Cards Inativos**: Os cartões de lotes expirados (inativos para consumo) mantinham a mesma paleta de cores creme e vinho/amber dos cartões ativos, atraindo a mesma atenção visual e poluindo o painel de serviços contratados do cliente.

## 🧠 Estratégia da Solução

1. **Correção do Algoritmo de Ordenação**:
   * Ajustamos o comparator no frontend (`ServiceBalanceList.tsx` e `ServicesPage.tsx`) e a lógica do repositório no backend (`ServiceBalanceRepository.cs`) para que, quando dois contratos estiverem expirados (diferença de dias negativa), a ordenação retorne `daysB - daysA` (descendente) no frontend e `-ExpiresAt.Value.Ticks` no backend. Isso garante que o lote expirado mais recentemente (mais próximo de 0 dias) seja posicionado antes dos lotes mais antigos.
   * Unificamos a ordenação por urgência no backend como a ordenação padrão (`else` block) para que a paginação server-side retorne os lotes ordenados corretamente desde o primeiro carregamento na tela de serviços.

2. **Estilização de Inativos (Grey-out)**:
   * Aplicamos uma roupagem acinzentada a cartões e itens de lista expirados.
   * Reduzimos a opacidade do card para `opacity-75` e mudamos o fundo para cinza suave neutro (`bg-[#F3F4F6]/70`), as bordas para cinza suave (`border-[#E5E7EB]`), a borda esquerda para cinza médio (`border-l-[#9CA3AF]`), a cor de fundo dos ícones para cinza (`bg-[#9CA3AF]`), e as cores do título da oferta e dos contadores de créditos para cinza neutro (`text-neutral-500`).
   * Desativamos as bordas de destaque e anéis de foco coloridos no hover para cards inativos.

## 🛠️ Implementação Técnica

### Frontend (React / TypeScript)
* **`ServiceCard.tsx`**:
  - Atualizada a assinatura do badge de tipo de contrato `renderContractTypeBadge` para receber o parâmetro opcional `isExpired`. Se true, renderiza um badge cinza neutro (`bg-neutral-200 text-neutral-500 border-neutral-300`).
  - Adaptados os containers e elementos do grid (`ServiceCard`) e da listagem (`ServiceListItem`) para aplicar a folha de estilos cinza quando `expInfo.isExpired` for verdadeiro.
  - O visual acinzentado estende-se ao badge de fidelidade do mês correspondente, ao ícone indicador, ao título da oferta, aos créditos consumidos/restantes e à barra de progresso.
* **`ServiceBalanceList.tsx` e `ServicesPage.tsx`**:
  - Ajustado o comparator de `urgency`:
    ```typescript
    if (isExpiredA && isExpiredB) {
      return daysB - daysA; // Expirados mais recentemente primeiro
    }
    ```
  - Tratados devidamente os casos em que os lotes ativos possuem `Infinity` (sem validade) para evitar resultados `NaN` na ordenação.

### Backend (C# / Entity Framework)
* **`ServiceBalanceRepository.cs`**:
  - Substituída a ordenação do bloco `else` no método `GetPagedByUserIdAsync` para seguir exatamente a lógica de priorização de urgência e expiração descendente usada no dashboard.

## 🎯 Impacto e Resultado

* **UX Limpa e Focada**: A tela de serviços e o dashboard agora separam claramente o que está ativo e pronto para uso (cores vibrantes e chamativas) do que está inativo/vencido (tons neutros acinzentados com opacidade reduzida).
* **Consistência Temporal**: Lotes de fidelidade expirados mais recentemente ficam no topo da lista de inativos, mantendo o histórico temporal em perfeita ordem cronológica reversa.
