# Diretrizes de Responsividade e UX Mobile

> **Objetivo**: Garantir uma experiência "Native App-like" em dispositivos móveis, sem sacrificar a produtividade no Desktop.

---

## Estratégia de Layout Híbrido

O Frontend (`media8-web`) implementa um padrão de layout adaptativo:

### 1. Navegação (Sidebar vs Drawer)

*   **Desktop (`md` +)**: Sidebar lateral fixa e visível permanentemente. Maximiza o espaço útil para tabelas e dashboards complexos.
*   **Mobile (`< md`)**:
    *   Sidebar fixa oculta (`hidden`).
    *   **TopBar Sticky**: Barra superior fixa (`sticky top-0 z-50`) com cor primária Vinho (#400404).
    *   **Menu Hamburger**: Aciona a sidebar original dentro de um componente `Sheet` (Gaveta) do shadcn/ui.

### 2. Espaçamento (Container Adaptativo)

A fim de evitar o "efeito espremido" em telas pequenas:

*   **Mobile**: Padding reduzido (`p-4` ou `px-4`). Remove margens excessivas para aproveitar 100% da largura horizontal (viewport width).
*   **Desktop**: Padding confortável (`p-8`). Foco na legibilidade e respiro.

---

## Componentes Touch-Friendly

Para garantir acessibilidade e facilidade de uso em telas de toque:

### Inputs e Botões
Todos os elementos interativos (`Button`, `Input`, `Select`) seguem a regra de **48px** de altura mínima em mobile.

```tsx
// Exemplo de classe utilitária (Tailwind)
className="h-12 md:h-10" 
```
Isso garante que dedos (touch targets) consigam interagir sem erros, enquanto no desktop mantém-se a densidade de informação compacta.

---

## Tipografia Escalonável

Uso de `clamp()` ou classes responsivas para títulos:

*   **Mobile**: `text-2xl` (Headers compactos).
*   **Desktop**: `text-3xl` ou `text-4xl` (Visual impactante).

---

## Implementação Técnica

As regras acima são aplicadas no componente raiz de layout (`src/layouts/RootLayout.tsx`) e nos componentes base (`src/components/ui/*`), garantindo consistência automática sem necessidade de ajustes manuais em cada nova página.