# Estudo de Caso #082: Abstração DRY do ServiceCard, Colunas Responsivas, Alertas de Expiração e Fidelidade

**Autor:** Antigravity AI  
**Data:** 29/05/2026  
**Status:** Concluído  

---

## 1. Contexto e Motivação

Durante a reestruturação da listagem de serviços contratuais (`/services`), reutilizamos os novos cartões interativos do dashboard (`ServiceCard`). No entanto, para atentar estritamente aos princípios de **Don't Repeat Yourself (DRY)** e evitar redundâncias futuras, necessitávamos extrair esse component de `ServiceBalanceList.tsx` para um arquivo próprio e compartilhado.

Além disso, dois refinamentos visuais e de UX importantes foram propostos:
1. **Espremimento em Dispositivos Estreitos:** Em resoluções menores ou com a barra lateral de navegação aberta (como demonstrado no *print1*), as colunas rígidas faziam os cartões se espremerem abaixo do aceitável, cortando textos e dados.
2. **Alertas de Expiração e Perda de Créditos:** Resgatar os alertas informando o cliente sobre o vencimento iminente ou expiração definitiva do contrato, de forma muito clara e explícita para evitar o uso inadequado de saldos inválidos.
3. **Indicador de Fidelidade para Assinaturas:** Exibir de forma intuitiva a fidelidade das assinaturas no formato `"Mês x/y"` (ex: `Mês 2/6`).

---

## 2. Implementação e Solução Arquitetural

### 2.1. Abstração e Reuso DRY
Criamos o arquivo compartilhado `media8-web/src/components/dashboard/ServiceCard.tsx`. Ele centraliza a declaração e o design de:
- `ServiceCard`: O cartão interativo em grid com menu de contexto dropdown.
- `ServiceListItem`: O item de saldo em linha para listagens minimalistas.
- Funções utilitárias associadas (`getIcon`, `getExpirationInfo`, `getFidelityInfo`).

Tanto a listagem do dashboard (`ServiceBalanceList.tsx`) quanto a página completa de serviços (`ServicesPage.tsx`) agora importam as dependências unicamente a partir deste component DRY compartilhado.

### 2.2. Grid Responsivo com auto-fill e minmax
No component `ServicesPage.tsx`, substituímos as colunas baseadas em breakpoints rígidos (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) por colunas inteligentes e flexíveis:
```typescript
className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 items-stretch w-full"
```
Com o uso de `minmax(320px, 1fr)`, o navegador calcula automaticamente o número de colunas que cabem na tela, garantindo que nenhum cartão fique menor que `320px` (*print2*). Se o espaço restante for inferior a `660px`, ele automaticamente reduz para **1 cartão por linha**, impedindo o visual "espremido".

### 2.3. Alertas de Expiração e Perda de Créditos ("Use-or-Lose")
Implementamos banners de alerta estilizados no centro do `ServiceCard` e do `ServiceListItem` que são exibidos de forma inteligente:
- **Assinaturas:** Se o prazo de renovação estiver próximo (<= 5 dias) e houver créditos, exibe um alerta âmbar: `"Saldo não-acumulativo • Use seus créditos!"`.
- **Pacotes / Avulsos:** Se faltar <= 7 dias, exibe o alerta: `"Prazo acabando • Utilize antes que expire!"`. Caso já esteja vencido, destaca-se em banner vermelho de alta atenção: `"Contrato expirado • Saldo inutilizado!"` e desativa o botão de criação de pedidos correspondente.

### 2.4. Badge de Fidelidade Mensal
Para o cálculo e renderização da fidelidade, criamos o helper `getFidelityInfo`. Ele mapeia a diferença em dias de `PurchaseDate` contra a data atual e divide pelo período de meses baseado em `SnapshotWarrantyDays` (proveniente de `offer.LoyaltyMonths * 30` no backend). 

O progresso é renderizado de forma sofisticada através de um badge secundário estruturado ao lado do tipo de contrato:
```typescript
{fidelityInfo && (
  <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 h-4 border-[#7B0A0A]/20 bg-[#7B0A0A]/5 text-[#7B0A0A] font-semibold uppercase tracking-wider rounded-sm">
    Mês {fidelityInfo.currentMonth}/{fidelityInfo.totalMonths}
  </Badge>
)}
```

---

## 3. Conclusão e Resultados

1. **DRY Absoluto:** Todo o código de design e lógica dos cartões foi centralizado, eliminando redundâncias e facilitando manutenções futuras.
2. **Experiência de Tela Fluida:** A listagem de `/services` se ajusta cirurgicamente a qualquer largura de tela, empilhando os cartões de forma elegante sem comprimi-los.
3. **Clareza de Regras de Negócio:** Banners de alerta e badges de fidelidade educam o cliente e garantem transparência total sobre prazos e recorrência de assinaturas.
