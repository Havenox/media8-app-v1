# 016 - Arquitetura de Domínio: Contratos Imutáveis (Snapshot Pattern)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 16/12/2025

---

## 🚀 Desafio de Engenharia
Em sistemas de e-commerce e serviços recorrentes, existe um dilema clássico: **O que acontece com os pedidos antigos quando o preço do produto muda?**
A arquitetura original do sistema sofria de **Mutabilidade Insegura**. Ao alterar o nome ou a quantidade de vídeos de um "Pacote" no catálogo, essa mudança se propagava retroativamente para clientes que já haviam comprado o pacote meses atrás. Isso gerava inconsistência histórica e potencial risco jurídico (alterar o contrato após a venda).

## 🧠 Estratégia da Solução
Adoção do padrão arquitetural **Snapshot** (conforme descrito por Martin Fowler).
Separamos o conceito de "Produto de Catálogo" (mutável) do conceito de "Contrato Assinado" (imutável).

## 🛠️ Implementação Técnica

### Modelagem de Dados
A entidade `PackageAssignment` (o contrato) foi enriquecida para armazenar uma *cópia* dos termos no momento da transação.

```csharp
public class PackageAssignment
{
    // Link fraco para BI (Saber qual pacote originou a venda)
    public Guid PackageId { get; set; } 

    // Snapshot Imutável (Os termos reais do contrato)
    public string SnapshotPackageName { get; set; }
    public decimal SnapshotPrice { get; set; }
    public int SnapshotVideoQuantity { get; set; }
}
```

### Unificação de API
Criamos o endpoint `/my-balances` que serve como "Single Source of Truth" para o cliente, lendo apenas os dados do Snapshot e os Lotes de Saldo (`ServiceBalanceLot`), ignorando completamente o estado atual do Catálogo de Pacotes.

## 🎯 Impacto e Resultado
*   **Integridade Jurídica**: O sistema garante que "o que foi comprado é o que foi entregue", independente de mudanças futuras de preço ou marketing.
*   **Segurança**: O administrador pode reformular totalmente o catálogo de vendas sem medo de quebrar a visualização dos clientes antigos.

---
**Nota do Desenvolvedor:** *Referenciar IDs é bom para normalização, mas ruim para histórico. Em transações financeiras/contratuais, a desnormalização controlada (Snapshot) é a escolha correta.*
