# 015 - [DEPRECATED] Estudo de Caso: Evolução Arquitetural e Mudança de Paradigma

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 16/12/2025

---

> **Nota Histórica:** *Esta documentação foi mantida propositalmente para demonstrar o processo de decisão e evolução da arquitetura. A implementação descrita aqui foi substituída pela arquitetura de Snapshots descrita no documento 016.*

## 🚀 Desafio de Engenharia
Inicialmente, tentamos otimizar a exibição de pacotes carregando-os de forma agregada. O problema é que o modelo de domínio "Pacote" não era suficiente para representar o **estado atual** do contrato do cliente (ex: "Quantos vídeos restam?"). Estávamos tentando forçar o conceito de "Catálogo" para resolver um problema de "Inventário".

## 🧠 Pivô Estratégico
Durante o planejamento técnico desta feature, identificamos que continuar insistindo na entidade `Package` traria complexidade acidental excessiva (cálculos de saldo em tempo real no frontend, fragilidade a mudanças de preço, etc).

**Decisão de Engenharia:** Abortar a implementação baseada em `Package` e migrar para um modelo de `ServiceBalanceLot` (Lotes de Saldo) com Snapshot de contrato.

## 🎯 Lição Aprendida
Às vezes, a melhor linha de código é a que **não** foi escrita. Reconhecer que o modelo de domínio atual não atende aos novos requisitos antes de escrever a implementação final economizou semanas de refatoração futura.

---
**Ver Próximo Passo:** *Implementação 016 - Arquitetura de Contratos Imutáveis.*
