# 004 - Usabilidade e Qualidade: Normalização de Filtros Case-Insensitive

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 13/12/2025

---

## 🚀 Desafio de Engenharia
Relatos de usuários indicavam que o filtro de categorias na gestão de pacotes "não funcionava". Uma análise técnica revelou que o problema não era lógico, mas de dados: uma divergência sutil de *casing* (Maiúsculas vs Minúsculas) entre os dados vindos de sistemas legados/backend (`Assinatura`) e os valores esperados pelos componentes de UI (`assinatura`). Isso gerava falsos-negativos na filtragem, frustrando o usuário.

## 🧠 Estratégia da Solução
A solução correta em engenharia de software para comparações textuais de input de usuário é sempre a **Normalização**. Assumir que o dado sempre virá "limpo" é uma falha de design. Decidi implementar a normalização no *Client-Side* para garantir que a UI seja resiliente a inconsistências menores do backend.

## 🛠️ Implementação Técnica

### Correção no Frontend
Alteração na lógica de filtragem dentro do `useMemo` do React. Aplicou-se `.toLowerCase()` em ambos os lados da comparação. Isso torna a busca robusta ("Assinatura", "assinatura", "ASSINATURA" são tratados como iguais).

```typescript
// Lógica Resiliente
const matchesCategory = 
  filter === 'all' || 
  package.category.toLowerCase() === filter.toLowerCase();
```

## 🎯 Impacto e Resultado
*   **Correção Definitiva**: O filtro passou a funcionar independente da formatação dos dados no banco.
*   **Resiliência**: O sistema tornou-se imune a erros de digitação de casing em futuros cadastros de categorias.
*   **UX**: Restauração imediata da confiança do usuário na ferramenta de busca do sistema.

---
**Nota do Desenvolvedor:** *Pequenos detalhes de normalização de dados frequentemente separam uma interface "quebrada" de uma "profissional". Atenção aos detalhes é fundamental.*
