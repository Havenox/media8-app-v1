# 019 - UX/UI System: Componentização Polimórfica (List vs Grid)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 16/12/2025

---

## 🚀 Desafio de Engenharia
O componente de listagem de serviços (`ServiceBalanceList`) foi projetado inicialmente para desktops largos (Grid Layout).
Novos requisitos de design exigiram que esse mesmo componente fosse exibido dentro de uma janela lateral estreita (Sheet), onde o Grid quebrava o layout e dificultava a leitura.
O desafio: Adaptar a visualização sem duplicar a lógica de busca de dados e negócios.

## 🧠 Estratégia da Solução
Implementação do padrão de **Prop Variant** (Polimorfismo Visual).
O componente passa a aceitar uma propriedade `variant="grid" | "list"`. Isso desacopla a lógica de dados da lógica de apresentação.

## 🛠️ Implementação Técnica

### CSS Modular / Tailwind
Uso de classes condicionais para alternar a estrutura do DOM.

```tsx
// Lógica de Apresentação
{variant === 'list' ? (
    // Layout Compacto (Alta densidade de informação vertical)
    <div className="flex flex-col gap-3">...</div>
) : (
    // Layout Espaçoso (Card Grid para Dashboard)
    <div className="grid grid-cols-3 gap-4">...</div>
)}
```

### Design System
Alinhamento visual com a identidade "Premium SaaS" (cores suaves, tipografia hierárquica), melhorando a escaneabilidade dos dados (Validade, Saldo) em espaços reduzidos.

## 🎯 Impacto e Resultado
*   **Reusabilidade**: Um único componente atende duas necessidades de negócio distintas.
*   **Manutenibilidade**: A lógica de cálculo de saldo (Complexa) fica em um único lugar. Se corrigirmos um bug de cálculo, corrigimos em ambas as visualizações.

---
**Nota do Desenvolvedor:** *Componentes burros (Presentational) que são flexíveis permitem pivotar a UI rapidamente sem reescrever o Backend.*
