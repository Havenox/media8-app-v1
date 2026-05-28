# 079 - [Frontend/UX]: Ordenação por Prazo de Vencimento, Badges de Contrato e Redimensionamento Premium dos ServiceCards

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 28/05/2026

---

## 🚀 Desafio de Engenharia
Com os cartões de serviço (`ServiceCard`) renderizando o tipo de contrato histórico imutável na tela de saldo, identificamos três oportunidades críticas de evolução na UX e UI do dashboard do cliente:
1. **Falta de Senso de Urgência (Ordenação):** Os cartões eram exibidos em ordem de criação ou sem critério dinâmico. O cliente necessitava ver primeiro os serviços com menor prazo restante para utilização (mais próximos do vencimento/renovação), permitindo priorizar o gasto dos saldos para evitar perdas (recurso não-acumulativo).
2. **Identificação Incompleta (Badges):** Apenas os cartões do tipo `Assinatura` exibiam um badge identificando sua categoria. Cartões dos tipos `Pacote` e `Avulso` ficavam órfãos dessa categorização na interface.
3. **Dimensionamento em Telas Largas:** O dimensionamento fixo anterior em `300px` agrupado por flexbox deixava muito espaço vazio no lado direito em viewports largas, enquanto uma expansão infinita (tripa) deformaria a interface. Era necessário um dimensionamento adaptativo fluido que preenchesse a tela elegantemente com limites estritos de segurança no desktop.

## 🧠 Estratégia da Solução
Buscando o padrão ouro em interfaces e seguindo as diretrizes do Media8:
1. **Algoritmo de Ordenação por Vencimento (FIFO e Urgência):** Criamos uma lógica no frontend (`sortedLots`) que calcula o número de dias restantes para expiração/renovação de cada lote. Ordenamos de forma crescente os cartões válidos (ativos com menor prazo primeiro) e jogamos os lotes expirados ou sem data de validade para o final.
2. **Badges Dinâmicos para Todas as Categorias:** Implementamos um helper visual (`renderContractTypeBadge`) com mapeamento de cores sofisticadas baseadas na identidade visual da marca (Vinho Profundo, Vinho Vibrante e Laranja Queimado/Amber) para renderizar a categoria exata de cada contrato de forma legível.
3. **CSS Grid com Auto-Fill Responsivo:** Substituímos o container por `grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] w-full`. Isso força os cards a se esticarem dinamicamente para ocupar as colunas disponíveis, mas definimos uma largura máxima estrita (`max-w-[400px]`) e altura mínima (`min-h-[180px]`) com padding interno de `20px` (`p-5`). Isso confere robustez, espaço respirável para os textos e uma aparência altamente profissional que preenche a tela sem deformar o layout.

## 🛠️ Implementação Técnica

### Frontend
- **[ServiceBalanceList.tsx](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/components/dashboard/ServiceBalanceList.tsx)**:
  - Adicionado o helper `getDaysRemainingForSort` que processa as datas e retorna o prazo em dias reais restantes.
  - Implementada a lógica de classificação `sortedLots` que prioriza saldos não-vencidos mais urgentes de forma ascendente.
  - Reconfigurado o container de carregamento (`Skeleton`) e de exibição final (`containerClasses`) para usar `grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))]` com largura total.
  - Criado o helper visual `renderContractTypeBadge` integrado com estilos tailwind e paleta harmoniosa para `Assinatura`, `Pacote` e `Avulso`.
  - Atualizada a estrutura do `ServiceCard` com novas proporções (`w-full max-w-[400px] min-h-[180px] p-5`) e aumento no espaçamento vertical interno para dar ar respirável às informações.

## 🎯 Impacto e Resultado
* **Gestão de Consumo Eficiente**: O usuário agora vê no topo esquerdo do dashboard exatamente o serviço que expira mais rápido (ex: `Reels Estratégico` com 7 dias restantes), motivando a utilização dos créditos.
* **Consistência Semântica**: Todos os cartões exibem claramente seu regime de contratação (`Assinatura`, `Pacote` ou `Avulso`) em harmonia de cores refinadas.
* **Layout Fluido e Premium**: O preenchimento das colunas é automático e responsivo. Em telas largas, os cards se estendem de forma uniforme até `400px` com um espaçamento interno digno de produtos SaaS premium.

---
**Nota do Desenvolvedor:** *A união de um algoritmo de ordenação focado na ação do usuário (prioridade por urgência de expiração) com o poder do CSS Grid Auto-Fill é a fórmula perfeita para painéis de controle modernos. Isso melhora a conversão de consumo de créditos e cria um fluxo de interface limpo, responsivo e adaptativo.*
