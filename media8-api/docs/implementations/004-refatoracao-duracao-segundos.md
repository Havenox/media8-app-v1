# Refatoração: Duração de Vídeos em Segundos

**Data:** 13/12/2025
**Responsável:** Havenox
**Status:** Implementado

## Contexto
Anteriormente, a duração máxima dos vídeos nos pacotes era armazenada em **Minutos** (`int`). Isso impedia a criação precisa de pacotes para formatos curtos como Reels/TikToks (ex: 90 segundos / 1 min 30 seg), obrigando o arredondamento.

## Mudanças Realizadas

### 1. Banco de Dados e Backend
*   **Entidade `Package`**: Renomeada propriedade `MaxDurationMinutes` para `MaxDurationSeconds`.
*   **Migração**:
    *   Coluna renomeada na tabela `Packages`.
    *   Dados existentes convertidos: `Seconds = Minutes * 60`.
*   **DTOs**: Atualizados `CreatePackageRequest`, `UpdatePackageRequest` e `PackageDto` para transportar `MaxDurationSeconds`.

### 2. Frontend (UX/UI)
*   **Input Composto**:
    *   Adicionado seletor de unidade (**Minutos** ou **Segundos**) ao criar/editar pacotes.
    *   Permite entrada intuitiva (ex: "90 Segundos" ou "1.5 Minutos" -> Salva 90s).
*   **Exibição Formatada**:
    *   Lista de pacotes agora exibe a duração de forma inteligente:
        *   `< 60s`: Ex: "45 seg"
        *   `Múltiplo de 60s`: Ex: "2 min"
        *   `Fracionado`: Ex: "1 min 30 seg"

## Impacto
*   **Precisão**: Permite definir preços e regras para vídeos curtos com exatidão.
*   **Flexibilidade**: Suporta futuros formatos de vídeo de qualquer duração.
