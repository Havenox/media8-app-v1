# 021 - Engenharia de Software: Resiliência a Ambientes Hostis (CORS & Headers)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 17/12/2025

---

## 🚀 Desafio de Engenharia
A funcionalidade de Infinite Scroll parou de funcionar em ambiente de produção (Staging), apesar de funcionar localmente.
A investigação revelou que a lógica de paginação dependia do header HTTP `x-total-count`. Em produção, proxies reversos e configurações de segurança de CORS (Cross-Origin Resource Sharing) frequentemente removem headers não-padrão ("Safe-list headers"), fazendo a aplicação frontend "pensar" que não havia mais dados para carregar (Total = 0).

## 🧠 Estratégia da Solução
**Princípio da Robustez**.
Em vez de lutar contra a infraestrutura (tentar configurar Expose-Headers em todos os proxies da cadeia), alteramos a lógica do frontend para ser autossuficiente.
Adotamos uma estratégia baseada em inferência de dados (Array Length) que funciona independente de metadados de transporte.

## 🛠️ Implementação Técnica
Alteração do algoritmo de `getNextPageParam` no React Query.

*   **Lógica Frágil (Antes)**: "Se a página atual < Total do Header, peça mais."
*   **Lógica Robusta (Depois)**: "Se a página atual retornou `pageSize` itens (ex: 20), provavelmente tem mais. Se retornou menos (ex: 19), acabou."

## 🎯 Impacto e Resultado
*   **Confiabilidade**: O código funciona em qualquer ambiente (Local, Docker, Cloud, Proxy Corporativo) sem configuração extra.
*   **Desacoplamento**: O Frontend reduziu sua dependência de detalhes de implementação do protocolo HTTP do Backend.

---
**Nota do Desenvolvedor:** *Não assuma que o header que você vê no Localhost chegará ao cliente na China. Codifique defensivamente.*
