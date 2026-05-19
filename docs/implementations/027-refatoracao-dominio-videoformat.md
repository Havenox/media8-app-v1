# 027 - Arquitetura de Domínio: Refatoração Data-Driven com Entidade VideoFormat

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 19/05/2026

---

## 🚀 Desafio de Engenharia

O sistema Media 8 operava com um **enum estático `ServiceType`** para definir os formatos de vídeo suportados (ex: `ReelsStandard`, `ReelsPremium`, `YoutubeCurto`, `YoutubeLongo`, `PacoteReels`, `Avulso`). Esta abordagem gerava três problemas arquiteturais críticos:

1. **Violação do Princípio Aberto/Fechado (OCP):** Sempre que a equipe de marketing precisava lançar um novo formato de vídeo (ex: "TikTok Trend 2026"), era necessário alterar o código-fonte, recompilar toda a solution e realizar deploy. O sistema não era aberto para extensão.

2. **Gargalo Operacional:** O time de produto dependia de intervenção técnica para qualquer alteração no catálogo. Uma simples mudança de nome ou adição de formato exigia ciclo completo de CI/CD, aumentando o risco e o tempo de entrega.

3. **Impossibilidade de Gestão Dinâmica:** Admins não podiam ativar/desativar formatos, ajustar durações máximas ou criar promoções sazonais sem envolvimento de desenvolvimento.

**A Dor Real:** O negócio estava travado. Lançar um novo formato de vídeo levava dias (desenvolvimento → teste → deploy), quando deveria levar minutos (cadastro via painel administrativo).

## 🧠 Estratégia da Solução

A solução seguiu o padrão **Data-Driven Domain**, transformando dados engessados em entidade gerenciável:

1. **Criação da Entidade `VideoFormat`:** Substituição do enum por uma classe de domínio com propriedades dinâmicas:
   - `Name` (ex: "Reels Premium")
   - `Slug` (ex: "reels-premium")
   - `MaxDurationSeconds` (ex: 90s)
   - `Tier` (Complexidade: Standard, Premium, GodMode)
   - `IsActive` (Controle de disponibilidade imediata)

2. **Relacionamento via Foreign Keys:** As entidades que dependiam do enum (`ServiceBalanceLot`, `Order`, `Package`) migraram para usar `VideoFormatId` (Guid) + propriedade de navegação, estabelecendo um modelo relacional puro.

3. **Quebra Controlada de Contrato:** Ao remover o enum do núcleo do domínio, forçamos uma "quebra em cascata" intencional nas camadas superiores (Application, Infrastructure). Esta falha de compilação é um **feature** — ela mapeia cirurgicamente todos os pontos que precisam de refatoração.

4. **Preservação de Outros Enums:** Enums como `OrderStatus`, `PackageCategory`, `LotSource` foram mantidos, pois representam estados fechados do sistema, não catálogos expansíveis.

## 🛠️ Implementação Técnica

### Camada de Domínio (`Media8.Domain`)

**Arquivo Criado:**
- `Entities/VideoFormat.cs`: Nova entidade raiz com 51 linhas, incluindo:
  - Propriedades de auditoria (`CreatedAt`, `UpdatedAt`)
  - Navegação para `ICollection<Package>`
  - Enum interno `ComplexityLevel` (Standard, Premium, GodMode)

**Arquivo Modificado:**
- `Enums/SharedEnums.cs`: Remoção completa do enum `ServiceType` (11 linhas removidas)

**Entidades Refatoradas:**
- `ServiceBalanceLot.cs`: 
  - Antes: `public ServiceType ServiceType { get; set; }`
  - Depois: `public Guid VideoFormatId { get; set; }` + `public VideoFormat? VideoFormat { get; set; }`
  
- `OrderAggregate.cs`:
  - Antes: `public ServiceType ServiceType { get; set; }`
  - Depois: `public Guid VideoFormatId { get; set; }` + navegação

- `PackageAggregate.cs`:
  - Antes: `public List<ServiceType> ServiceTypes { get; set; }`
  - Depois: `public ICollection<VideoFormat> SupportedFormats { get; set; }`

### Commits Atômicos Realizados
1. `feat(domain): adiciona entidade VideoFormat para suportar catalogo dinamico`
2. `refactor(domain): remove enum estatico ServiceType do nucleo do sistema`
3. `refactor(domain): atualiza agregados de ordens, pacotes e saldos para usar VideoFormatId`

### Validação
- ✅ Build do projeto `Media8.Domain`: **Sucesso** (0 erros)
- ⚠️ Build da solution completa: **7 erros esperados** em `Media8.Application` (DTOs e Interfaces usando `ServiceType`)

## 🎯 Impacto e Resultado

* **Fim da Dependência de Deploy:** Novos formatos de vídeo podem ser criados via SQL ou futura UI administrativa sem alterar código. Tempo de lançamento: de dias para minutos.

* **Motor FIFO Flexível:** A lógica de consumo de saldo (`ServiceBalanceLot`) agora é orientada a dados, permitindo que um admin crie um formato "YouTube Shorts Vertical" e o motor FIFO o consuma corretamente sem alteração de código.

* **Catálogo Vivo:** A `VideoFormat` permite `IsActive = false`, possibilitando desativar formatos legados sem quebrar histórico de pedidos — algo impossível com enum.

* **Quebra como Ferramenta:** Os 7 erros de compilação nas camadas superiores servem como um "mapa de refactor" — sabemos exatamente onde tocar na próxima fase (Application → Infrastructure → API).

* **Princípio Aberto/Fechado Respeitado:** O domínio está aberto para extensão (novos formatos) e fechado para modificação (não mexe no código existente).

---

**Nota do Desenvolvedor:**
*A migração de enum para entidade é um marco arquitetural. Enums são ótimos para estados fechados (ex: `OrderStatus`), mas catastróficos para catálogos de negócio. A quebra de compilação em cascata (Domain → Application → Infrastructure) não é um bug — é um feature de design. Ela força o desenvolvedor a enfrentar cada ponto de acoplamento. Ignorar esses erros e "gambiar" com casts ou strings mágicas seria violar o princípio da menor surpresa. O caminho correto é o que estamos fazendo: deixar o domínio ditar o contrato e deixar as camadas externas falharem alto até serem consertadas. Esta é a diferença entre um sistema que "roda" e um sistema que é **correto por construção**.*
