# 033 - Roadmap: Refatoração de Domínio para Alinhamento de Nomenclatura e Oferta

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

O sistema Media 8 atingiu um marco de maturidade com a implementação do catálogo dinâmico de `VideoFormat` e `EditingStyle`. No entanto, à medida que a lógica de negócios evoluiu, surgiram ambiguidades na modelagem de domínio que impedem a implementação correta de regras de expiração, renovação e contratação de serviços.

Atualmente, a entidade `Package` (Pacote) carrega múltiplas responsabilidades conflituosas: ora representa o **produto à venda** (catálogo), ora representa o **direito adquirido** (contrato do cliente). Essa duplicidade gera confusão semântica e técnica, especialmente ao lidar com:
- Diferenciação entre "Pacote de 10 vídeos" (produto) vs "Contrato de 10 vídeos" (direito do cliente).
- Regras de expiração distintas para "Avulso", "Pacote" e "Assinatura".
- Necessidade de vincular `VideoFormat` e `EditingStyle` diretamente à oferta comercial.

O desafio é realizar uma refatoração profunda de domínio (Domain Refactoring) para alinhar o código com o modelo de negócios real, garantindo clareza conceitual e flexibilidade para futuras regras de contratação.

## 🧠 Estratégia da Solução

A estratégia adota o padrão **Contract-Based Architecture**, separando claramente:
1. **Offer (Oferta):** O produto comercializável no catálogo (ex: "Plano Mensal", "Pacote 10 Edições").
2. **ClientContract (Contrato do Cliente):** O direito adquirido pelo cliente, com regras de validade e renovação.
3. **ContractType (Tipo de Contrato):** Enum consolidado que governa expiração e renovação (Avulso, Pacote, Assinatura).

A decisão de renomear `Package` para `Offer` e `PackageAssignment` para `ClientContract` não é cosmética: reflete a distinção fundamental entre **o que se vende** e **o que se possui**.

Além disso, a entidade `Offer` incorporará explicitamente `VideoFormatId` e `EditingStyleId`, tornando-se o agregador final da oferta comercial completa, enquanto `Order` consumirá direitos do `ClientContract` sem possuir lógica de estilo.

## 🛠️ Implementação Técnica

### Fase 1: Renomeação de Domínio (Backlog Imediato)
- **`Package` → `Offer`**:
  - Renomear entidade, tabelas e chaves no banco de dados.
  - Atualizar navigation properties: `Offer.VideoFormatId`, `Offer.EditingStyleId`.
- **`PackageAssignment` → `ClientContract`**:
  - Renomear entidade para refletir o vínculo contratual.
  - Consolidar campos de snapshot (`SnapshotPackageName`, `SnapshotPrice`) em `ClientContract`.
- **`ContractType` (Enum)**:
  - Substituir múltiplos flags por enum único: `Avulso`, `Pacote`, `Assinatura`.
  - Governar regras de expiração e renovação via `ContractType`.

### Fase 2: Integração de Estilo na Oferta
- **`Offer` como Agregador**:
  - Incorporar `VideoFormatId` e `EditingStyleId` como propriedades obrigatórias.
  - Remover lógica de estilo de `Order` e `ServiceBalanceLot`.
- **`Order` como Consumidor**:
  - `Order` referenciará `ClientContractId` em vez de escolher estilo.
  - Order foca em produção (briefing, prazo, entrega), não em regras comerciais.

### Fase 3: Migração de Dados
- **Script de Migração**:
  - Converter `Package` existentes para `Offer`.
  - Popular `ClientContract` a partir de `PackageAssignment` históricos.
  - Preservar integridade referencial com `Order` e `ServiceBalanceLot`.

### Marco Atual (Conquistas Recentes)
- ✅ **Entidade `EditingStyle`**: Criada para substituir enum `ComplexityLevel`.
- ✅ **CRUD de EditingStyles**: Controller backend implementado e compilado.
- ✅ **Migração Gerada**: `AddEditingStyleAndRemoveTier` pronta para aplicação.
- ✅ **Documentação**: Estudos de caso #030, #031, #032 registrando evolução.

## 🎯 Impacto e Resultado

* **Clareza Semântica**: Desenvolvedores e stakeholders usarão termos alinhados ao negócio ("Oferta", "Contrato"), reduzindo ambiguidades em discussões técnicas.

* **Flexibilidade Comercial**: Separação entre `Offer` e `ClientContract` permitirá implementar promoções, upgrades e downgrades de plano sem reengenharia de código.

* **Regras de Negócio Centralizadas**: `ContractType` governará expiração e renovação em um único local, facilitando testes e manutenção.

* **Base para Evolução**: Modelo preparado para recursos avançados como "Upgrade de Plano", "Conversão de Avulso para Assinatura" e "Histórico de Contratos".

---

**Nota do Desenvolvedor:** *Esta refatoração é um exemplo clássico de "Domain-Driven Design" em ação: o código reflete a linguagem do negócio (Ubiquitous Language). A dor inicial de renomear entidades e migrar dados é compensada pela clareza futura. O maior aprendizado é que a modelagem de domínio não é um evento, mas um processo contínuo de descoberta e ajuste. A próxima fase (renomeação em massa) exigirá cuidado extremo com migrations e rollback planejado.*
