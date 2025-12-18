# 014 - Resiliência de Frontend: Tratamento Defensivo de Dados (Crash Prevention)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 16/12/2025

---

## 🚀 Desafio de Engenharia
Um erro de "Tela Branca" (White Screen of Death) foi reportado na produção. O log de erro apontava `RangeError: Invalid time value`.
O problema era causado por um único registro de usuário com data malformada. Como o React renderiza a árvore de componentes de forma síncrona, uma exceção não tratada na formatação de data quebrava toda a interface para o administrador, tornando o sistema inutilizável devido a um único dado "sujo".

## 🧠 Estratégia da Solução
**Programação Defensiva**.
Implementar uma camada de "Sanitização" na renderização. Nunca confiar que os dados vindos da API (ou de sistemas legados) estarão sempre perfeitos.

## 🛠️ Implementação Técnica
Criação da utility function `safeFormatDate`.

```ts
const safeFormatDate = (dateString: string) => {
    try {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-'; // Detecção de Invalid Date
        return format(date, ...);
    } catch {
        return '-'; // Fallback silencioso
    }
};
```
Esta função atua como um `try-catch` granular. Se a data for inválida, exibimos um *placeholder* amigável ("-") em vez de explodir a aplicação.

## 🎯 Impacto e Resultado
*   **Estabilidade**: A página tornou-se imune a erros de formatação de dados.
*   **Disponibilidade**: Mesmo com dados corrompidos, a funcionalidade de listagem permanece ativa e útil.

---
**Nota do Desenvolvedor:** *Em sistemas distribuídos, o Frontend deve ser resiliente. Um dado ruim não pode derrubar a experiência inteira.*
