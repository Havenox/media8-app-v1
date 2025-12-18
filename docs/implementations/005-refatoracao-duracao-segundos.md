# 005 - Modernização de Produto: Suporte a Micro-Formatos (Segundos) e Migração de Schema

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 13/12/2025

---

## 🚀 Desafio de Engenharia
A plataforma foi originalmente concebida para vídeos longos (YouTube), armazenando a duração em **Minutos** (`int`). Com a mudança do mercado para formatos curtos (Reels, TikTok), a granularidade de minutos tornou-se insuficiente (ex: impossível vender um pacote de "90 segundos", pois viraria 1 ou 2 minutos). O desafio era migrar a base de dados e a lógica de negócio para precisão de segundos sem quebrar os dados existentes.

## 🧠 Estratégia da Solução
Foi necessário um **Refactor Full Stack via Schema Migration**:
1.  **Backend**: Alterar o tipo de dado fundamental da aplicação.
2.  **Migração de Dados**: Converter os dados legados (Minutos -> Segundos) para manter a consistência.
3.  **Frontend**: Criar uma UI inteligente que abstraia a complexidade (usuário pode digitar "1.5 minutos" e o sistema converte para 90s).

## 🛠️ Implementação Técnica

### Backend & Database
*   **Schema Change**: Coluna `MaxDurationMinutes` renomeada e re-tipada para `MaxDurationSeconds`.
*   **Data Migration**: Script SQL para multiplicar valores existentes por 60.
*   **DTO Update**: Atualização de todos os contratos de API para trafegar segundos.

### Frontend (User Experience)
Desenvolvi um **Input de Unidade Composta**:
*   O usuário escolhe a unidade ("Segundos" ou "Minutos") em um dropdown.
*   O sistema converte automaticamente para segundos antes de enviar ao backend.
*   **Display Inteligente**: Na listagem, o sistema formata humanamente:
    *   `90s` -> exibe "1 min 30 seg"
    *   `60s` -> exibe "1 min"

## 🎯 Impacto e Resultado
*   **Alinhamento de Mercado**: A plataforma agora suporta nativamente produtos da era TikTok/Shorts.
*   **Flexibilidade de Pricing**: O time de negócios pode criar pacotes ultra-específicos (ex: "Pacote 30 segundos").
*   **Retrocompatibilidade**: Nenhum dado histórico foi perdido na transição.

---
**Nota do Desenvolvedor:** *Adaptação de schema é sempre delicada em produção. A escolha por converter tudo para a menor unidade comum (segundos) é um padrão clássico para evitar problemas de ponto flutuante.*
