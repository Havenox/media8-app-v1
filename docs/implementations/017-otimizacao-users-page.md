# 017 - Performance Tuning: Diagnóstico e Correção de Overfetching

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 16/12/2025

---

## 🚀 Desafio de Engenharia
A página principal de usuários (`/users`) apresentava degradação de TTI (Time to Interactive). A análise via *Network Waterfall* revelou uma requisição pesada (`GET /packages`) sendo disparada no carregamento inicial.
O paradoxo: Essa lista de pacotes não era visível na tela inicial. Ela era requerida apenas por um componente secundário (Modal de Detalhes) que estava oculto.

## 🧠 Estratégia da Solução
**Análise de Fluxo de Renderização**.
Identifiquei que o hook de dados estava posicionado no topo da árvore do componente de Detalhes, que por sua vez era renderizado "escondido" (CSS `display: none` ou lógica similar) em vez de ser condicionalmente montado.
A estratégia foi aplicar **Renderização Condicional Estrita** (`{isOpen && <Component />}`) e remover dependências desnecessárias.

## 🛠️ Implementação Técnica

### 1. Limpeza de Dependências
Remoção de Hooks não utilizados (`Dead Code Elimination`). O componente `UserDetailsSheet` buscava listas que ele nem sequer renderizava.

### 2. Lazy Mounting
Alteração da lógica na Page Pai:

```tsx
// Antes (Renderizava oculto, disparando hooks)
<UserDetailsSheet open={isOpen} ... />

// Depois (Só monta/dispara hooks se necessário)
{selectedUser && (
  <UserDetailsSheet user={selectedUser} ... />
)}
```

## 🎯 Impacto e Resultado
*   **Eficiência**: Eliminação de 1 request HTTP pesado (300ms de latência economizados) no load inicial.
*   **Boas Práticas**: Reforço do padrão de que componentes "pesados" devem gerenciar seu próprio data-fetching apenas quando ativos.

---
**Nota do Desenvolvedor:** *Hooks do React rodam mesmo se o componente retornar `null` ou estiver invisível CSS. Controlar a montagem é vital para performance.*
