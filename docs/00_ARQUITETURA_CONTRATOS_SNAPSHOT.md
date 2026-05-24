# Arquitetura de Ofertas, Contratos e Governança de Saldo (Snapshot Pattern)

Este documento especifica a modelagem arquitetural e as regras de integridade referencial para o ecossistema de aquisição de pacotes e consumo de créditos da plataforma Media8.

## 1. Princípio da Imutabilidade Contratual
Configurações de entrega técnica (estilos de edição, formatos de vídeo, durações) mudam conforme as necessidades do mercado. No entanto, contratos comerciais assinados por clientes são historicamente imutáveis. 
Para garantir auditoria total, segurança jurídica e evitar quebras por cascata no banco de dados, o sistema adota o **Snapshot Pattern**: tabelas transacionais e contratuais armazenam cópias textuais e numéricas (valores primitivos) em vez de manter chaves estrangeiras vivas para entidades de configuração mutáveis.

---

## 2. Entidades do Ecossistema

### A. Oferta (`Offer`)
É o catálogo comercial público ou customizado do sistema. É a única entidade que se relaciona dinamicamente com as tabelas de configuração do sistema.
* **Chaves Estrangeiras Vivas (FKs):**
  * `VideoFormatId` (Aponta para as definições de proporção e duração máxima em segundos).
  * `EditingStyleId` (Aponta para a régua de complexidade da edição).
* **Dados Primitivos Fixos:** Nome da oferta, preço, quantidade total de vídeos inclusos, validade em dias, o prazo de entrega, o tempo de fidelidade, a descrição e as características comerciais.

### B. Contrato do Cliente (`ClientContract`)
Representa a ativação de uma oferta para um usuário específico. Funciona como um cofre lacrado (Snapshot).
* **Chaves Estrangeiras Permitidas (FKs):**
  * `OfferId` (Apenas para fins de rastreabilidade da oferta de origem).
  * `ClientId` (User dono do contrato).
  * `AssignedById` (Administrador que realizou a atribuição).
* **Campos de Snapshot Obliterativos (Sem FK):**
  * Toda e qualquer informação da oferta e suas configurações vinculadas devem ser convertidas em texto/número primitivo no momento da assinatura.
  * *Exemplos:* `SnapshotOfferName` (string), `SnapshotPrice` (decimal), `SnapshotVideoQuantity` (int), `SnapshotEditingStyleName` (string), `SnapshotVideoFormatName` (string), `SnapshotMaxDurationSeconds` (int).
  *Se o formato de vídeo original for alterado ou excluído do sistema amanhã, o contrato do cliente permanece intacto e auditável.*

### C. Lote de Saldo de Serviço (`ServiceBalanceLot`)
Entidade estritamente numérica responsável pela contabilidade de créditos utilizáveis pelo cliente.
* **Chaves Estrangeiras Permitidas (FKs):**
  * `ContractId` (Vinculo com o contrato imutável que gerou o saldo).
  * `ClientId` (User detentor do saldo).
* **Campos de Estado:**
  * `Quantity` (Quantidade total original herdada do contrato).
  * `RemainingQuantity` (Quantidade de créditos remanescentes para consumo).
* **Regra de Ouro:** **Zero FKs para tabelas de configuração.** O lote não conhece formatos, durações ou estilos de edição por chaves diretas. Toda inteligência de validação técnica do pedido é extraída do snapshot contido no contrato pai associado a este lote.

---

## 3. Fluxo de Consumo e Validação

[Offer] --- (FK) ---> [VideoFormat / EditingStyle]
│
(Gera Atribuição)
▼
[ClientContract] ─── (Copia Dados como Texto/Valor Puro)
│
(Inicializa)
▼
[ServiceBalanceLot] ─── (Apenas ID do Contrato e Contagem de Créditos)
│
(Debita 1 Crédito)
▼
[Order]


1. O cliente escolhe o lote de saldo (`ServiceBalanceLot`) no formulário de pedidos.
2. O sistema carrega o `ClientContract` associado àquele lote.
3. As especificações técnicas do vídeo (ex: formato, resolução, estilo de edição) são validadas contra as strings estáticas do `SnapshotVideoFormatName` e `SnapshotEditingStyleName` gravadas no contrato.
4. O crédito é decrementado do `RemainingQuantity` do lote de saldo.