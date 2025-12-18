# Media 8 Web (React)

Interface do usuário da plataforma Media 8, focada em **UX Fluida** e **Performance Mobile-First**.

> **Documentação de Design**: Veja [UI_GUIDELINES](../docs/Responsividade.md) e [BRANDING](../docs/Briefing%20da%20Marca%20-%20Diretrizes%20da%20Identidade%20Visual.md) na raiz.

---

## Destaques Técnicos

*   **Virtualização**: Listas infinitas com `react-window` e `useVirtualizer` para performance.
*   **Server State**: Uso agressivo de **TanStack Query** para cache e sincronização e otimistic updates.
*   **Forms**: **React Hook Form** + **Zod** para validação robusta.
*   **Componentes**: Baseados em **Indi UI / shadcn/ui** (Headless + Tailwind).

---

## Developer Guide

### Setup

1.  **Instalar Dependências**
    ```bash
    npm install
    # ou
    yarn
    ```

2.  **Variáveis de Ambiente**
    Copie `.env.example` para `.env`:
    ```bash
    VITE_API_URL="http://localhost:5261/api/v1"
    ```

3.  **Rodar Servidor Dev**
    ```bash
    npm run dev
    ```
    Acesse: `http://localhost:5173`

### Estrutura de Pastas

*   `src/components/ui`: Componentes base reutilizáveis (Botões, Inputs).
*   `src/layouts`: Estruturas de página (Root, Auth, Dashboard).
*   `src/pages`: Telas da aplicação (Roteamento).
*   `src/services`: Camada de comunicação HTTP (Axios).
*   `src/hooks`: Lógica de negócio encapsulada (Custom Hooks).

### Linting & Formatting

O projeto usa ESLint e Prettier.
```bash
npm run lint
```
