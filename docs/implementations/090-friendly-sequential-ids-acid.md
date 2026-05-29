# 090 - Identificadores Sequenciais Amigáveis por Cliente (ACID & Idempotente)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 29/05/2026

---

## 🚀 Desafio de Engenharia
No painel do cliente do ecossistema **Media8**, os contratos, pedidos, faturas, perfis de branding e de edição eram identificados exclusivamente por chaves GUID/UUID (ex: `e3d7a8d5-10f5-4e28-9772-78ba3396b160`). 
Embora ideal para integridade do banco de dados e prevenção a IDOR (Insecure Direct Object Reference), a identificação por GUID trazia graves problemas:
1. **Péssima Usabilidade:** Clientes e agentes de suporte não podiam conversar sobre "o pedido e3d7a8d5...".
2. **Falta de Contexto Comercial:** Clientes não tinham senso de progressão (ex: saber qual é o primeiro ou o quinto contrato).
3. **Complexidade de Concorrência (ACID):** A geração de números sequenciais simples (1, 2, 3...) escopados por cliente pode sofrer severos problemas de colisão em transações simultâneas sem o devido bloqueio e garantia ACID.
4. **Backfill Histórico:** A adição de colunas inteiras `NOT NULL` com índices compostos de unicidade estrita a tabelas com dados pré-existentes gera violação de chave imediata (todos os registros recebendo `0`), exigindo uma estratégia inteligente de migração e sementes SQL.

## 🧠 Estratégia da Solução
Implementamos o padrão-ouro do mercado para identificadores amigáveis:
1. **Persistência de Dados Inteiros:** As entidades de domínio (`ClientContract`, `Order`, `Invoice`, `BrandingProfile`, `EditingProfile`) ganharam a propriedade inteira `SequentialId`.
2. **Tabela de Contadores (`ClientSequences`):** Centralizamos o controle de sequências por cliente e entidade, prevenindo concorrência e colisões por meio de transações isoladas e bloqueios ACID no PostgreSQL.
3. **Backfill Inteligente com CTE SQL:** Escrevemos scripts de migração com funções analíticas `row_number() OVER (PARTITION BY ...)` para sequenciar retroativamente todo o histórico existente por cliente e preencher os contadores antes da aplicação dos índices físicos de unicidade.
4. **Formatação DRY no Frontend:** Preservamos a flexibilidade da string de exibição mantendo o tipo `int` no backend e delegando a renderização visual (`Contrato #0001`, `Pedido #0012`) ao React através do helper `formatSequentialId` em `src/lib/formatters.ts`.

## 🛠️ Implementação Técnica

### Backend (Garantia ACID & Mapeamento)
* **Entidade de Geração:** Criada a entidade `ClientSequence` com índice composto único em `(ClientId, EntityType)`.
* **Servidor de Transação:** Implementado `SequenceGeneratorService` encapsulando incremento atômico dentro de transações de banco de dados, retornando o próximo inteiro disponível.
* **Mapeamento de Restrições:** Configurados índices de unicidade compostos para garantir integridade física no Postgres:
  * `ClientContract` e `Order` indexados por `(ClientId, SequentialId)`.
  * `BrandingProfile` e `EditingProfile` indexados por `(UserId, SequentialId)`.
* **Exposição de DTOs:** Atualizados os DTOs `ClientContractResponse`, `OrderResponse`, `BrandingProfileResponse`, `EditingProfileResponse` e `InvoiceResponse` para trafegar a propriedade `SequentialId`.
* **Mapeadores em Controladores:** Sincronizadas as instâncias de response nos controladores `ClientContractsController.cs`, `BrandingProfilesController.cs`, `EditingProfilesController.cs`, `BillingController.cs` e no serviço `OrderService.cs` para transferir os sequenciais.

### Frontend (DRY e Exibição Premium)
* **Tipagem TypeScript:** Estendidos os contratos de tipo de dados `ClientContract`, `Order`, `BrandingProfile`, `EditingProfile` e `Invoice` para opcionalmente carregar a propriedade `SequentialId?: number`.
* **Helper de Formatação:** Criado `src/lib/formatters.ts` que centraliza zeros à esquerda e prefixo da marca:
  ```typescript
  export const formatSequentialId = (id?: number | null, prefix: string = '', digits: number = 4) => ...
  ```
* **Card de Saldos (`ServiceCard`):** Exibe a identificação `Contrato #XXXX` em formato mono-espaçado premium na frente do nome de cada plano ativo e nos itens em lista.
* **Seletor de Criação (`NewOrderPage`):** Exibe o código do contrato no dropdown para clareza estrita.
* **Listagem e Detalhes de Pedidos (`OrdersPage`/`OrderDetailPage`):** Mostra o código `Pedido #XXXX` no cabeçalho e nos cartões de status.
* **Configurações e Perfis (`BrandingProfilesPage`/`EditingProfilesPage`):** Exibe badges `Marca #XXXX` e `Perfil #XXXX` nas tabelas administrativas.
* **Gestão Financeira (`PaymentsPage`):** Identifica faturas pelo código `Fatura #XXXX`.

## 🎯 Impacto e Resultado
* **Usabilidade Excepcional:** Conversas comerciais simplificadas baseadas em códigos curtos e compreensíveis (ex: Pedido #0004).
* **Segurança e Isolamento Rígido:** Sem vazamento de dados ou vulnerabilidades IDOR. Os GUIDs continuam governando os dados sob o capô, e os sequenciais respeitam estritamente a barreira do tenant.
* **Robustez Extrema:** Concorrência controlada e colisão fisicamente impossível no banco de dados.
* **Código Altamente Flexível:** Layout e casing visual do frontend desacoplados do backend.
