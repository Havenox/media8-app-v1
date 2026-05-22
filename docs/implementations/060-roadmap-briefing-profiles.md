# 060 - Briefing Dinâmico: Roadmap de VisualIdentityProfiles e EditingProfiles

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 22/05/2026

---

## 🚀 Desafio de Engenharia

O Media8 operava com um modelo de formulário de briefing estático e descentralizado, onde todas as perguntas eram despejadas diretamente na criação do pedido. Isso gerava três problemas críticos:

1. **Retrabalho do Cliente**: Elementos estáticos da marca (cores, fontes, logotipos) precisavam ser reinformados a cada novo pedido, mesmo que o cliente já tivesse um perfil de marca cadastrado.
2. **Poluição de Dados**: A tabela de `Orders` acumulava dados repetitivos e imutáveis, misturando o transitório (pedido específico) com o perene (identidade da marca).
3. **Falta de Governança**: Não havia distinção entre o que é **Identidade Visual** (a marca do cliente) e o que é **Perfil de Edição** (o estilo cinematográfico do vídeo), dificultando a reutilização de preferências artísticas.

O objetivo era evoluir para um modelo de **Briefings Dinâmicos**, onde o sistema sugere automaticamente as configurações salvas no `VisualIdentityProfile` e `EditingProfile` do cliente, reduzindo o atrito na criação de pedidos e garantindo dados limpos e estruturados para os editores.

## 🧠 Estratégia da Solução

A estratégia adotada foi a **separação de responsabilidades por domínio**, criando duas novas entidades principais que atuam como "templates" ou "perfis" reutilizáveis:

1. **VisualIdentityProfiles (Identidade Visual)**:
   - Foco: Elementos estáticos e imutáveis da marca do cliente.
   - Escopo: Cores, fontes, redes sociais, público-alvo e assets (logos, CTAs).
   - Relação: Um cliente pode ter múltiplas marcas (ex: "Marca Pessoal", "Empresa X", "Projeto Y").

2. **EditingProfiles (Perfil de Edição)**:
   - Foco: Dinâmica artística e técnica da edição de vídeo.
   - Escopo: Estilo de corte, trilha sonora, preferências de thumbnail, hooks de vídeo e notas gerais.
   - Relação: Um cliente pode ter múltiplos estilos (ex: "Vlogs Dinâmicos", "Vídeos de Autoridade", "Cortes para Reels").

A decisão arquitetural foi manter as perguntas **transacionais e mutáveis** (como "Identificação do Pedido" e "Frase de Impacto Específica") diretamente na tabela de `Orders`, garantindo que cada pedido possa ter suas particularidades mesmo ao usar um perfil salvo.

## 🛠️ Implementação Técnica

A implementação foi documentada através de um mapeamento literal das perguntas do formulário atual para suas respectivas tabelas e colunas no banco de dados.

### A. Tabela/Módulo: VisualIdentityProfiles
*Guarda os elementos estáticos da marca ou empresa do cliente.*

| Coluna no Banco | Texto Literal da Pergunta (Front-end) | Tipo de Dado |
|-----------------|---------------------------------------|--------------|
| `Name` | "Nome do Perfil" (Ex: "Marca 1: Salão de Beleira") | `string` |
| `SocialHandles` | "Seu nome e as suas redes sociais ou da sua empresa: (Adicione seu nome mais o @ delas)" | `string` (JSON ou Texto) |
| `BrandColors` | "Qual a cor ou cores da sua marca? (Adicione o código exato da cor. Exemplo: #000000)" | `string` (JSON Array) |
| `BrandFonts` | "Qual a fonte ou fontes da sua marca? (Adicione o nome da fonte ou envie o arquivo no Drive)" | `string` |
| `TargetAudience` | "Para qual público-alvo este vídeo será direcionado?" (Enums: Mulheres \| Homens \| Jovens empreendedores \| Público corporativo \| Outro) | `string` (Enum) |
| `BrandAssetsUrl` | "Há imagens, vídeos, logos, CTAs ou arquivos específicos que devo utilizar? (Envie os arquivos no Drive)" | `string` (URL) |

### B. Tabela/Módulo: EditingProfiles
*Guarda a dinâmica artística, cortes, legenda e áudio do vídeo.*

| Coluna no Banco | Texto Literal da Pergunta (Front-end) | Tipo de Dado |
|-----------------|---------------------------------------|--------------|
| `Name` | "Nome do Perfil" (Ex: "Perfil 1: Vlogs") | `string` |
| `ReferenceUrl` | "Tem alguma referência de edição que você gostaria que eu seguisse? (Adicione o link)" | `string` (URL) |
| `CutGuidelines` | "Há partes do vídeo original que precisam ser mantidas ou removidas obrigatoriamente?" | `string` (Texto) |
| `ThumbnailPreference` | "Deseja que eu crie a thumbnail (capa) do vídeo?" (Enums: Sim \| Não \| Já tenho a capa pronta) | `string` (Enum) |
| `MusicStyle` | "Qual a trilha sonora ou estilo musical que você prefere?" | `string` |
| `UseVideoHook` | "Deseja destacar algum momento do vídeo como "clipe principal" para usar nos primeiros segundos?" (Boolean: Sim \| Não) | `boolean` |
| `TextHighlightStyle` | "Alguma palavra, expressão ou tema central que você quer que apareça com destaque visual?" | `string` |
| `GeneralNotes` | Junção de: "Informações extras importantes..." e "Algo mais que você queira incluir na edição?" | `string` (Texto Longo) |

### C. Observações Arquiteturais de Negócio

Foi definido estritamente que as seguintes perguntas **NÃO** migram para os perfis, permanecendo na tabela `Orders`:

1. **"Qual a identificação do vídeo? (Ex: Reels #00 Mês#0)"**: É um dado transitório, específico daquele pedido.
2. **"Tem alguma frase de impacto, chamada ou headline que não pode faltar?"**: Embora possa ser repetitivo, é uma instrução de negócio para *aquele* vídeo específico, não uma regra geral de edição.

### D. Roadmap de Entrega Técnica

A implementação seguirá um plano em 3 etapas atômicas:

1. **DB Migrations & Entities**:
   - Criação das tabelas `VisualIdentityProfiles` e `EditingProfiles`.
   - Definição das chaves estrangeiras para `Users` (Client).
   - Geração das entidades de domínio no projeto `Media8.Domain`.

2. **Application DTOs & API Controllers**:
   - Criação de DTOs para `CreateVisualIdentityProfile`, `UpdateEditingProfile`, etc.
   - Implementação de `VisualIdentityProfilesController` e `EditingProfilesController`.
   - Endpoints: `GET /api/v1/profiles/visual`, `POST /api/v1/profiles/editing`, etc.

3. **UI Selectors**:
   - Criação de componentes `VisualProfileSelector` e `EditingProfileSelector`.
   - Integração na `OrderForm` para auto-preenchimento (auto-fill) mediante seleção do perfil.
   - Capacidade de "Salvar como Perfil" após preenchimento manual.

## 🎯 Impacto e Resultado

* **Redução de Atrito**: Clientes reutilizam perfis salvos, eliminando a necessidade de redigitar informações imutáveis.
* **Dados Estruturados**: Separação clara entre o que é "Marca" (VisualIdentity) e o que é "Estilo" (EditingProfile).
* **Escalabilidade**: Novos perfis podem ser criados sem alterar a estrutura de `Orders`.
* **Governança de Briefing**: Perguntas certas no lugar certo, evitando poluição de dados e facilitando a automação futura (ex: IA que lê o perfil e sugere edições).

---

**Nota do Desenvolvedor:**
*A criação deste documento de "Especificação Literal" é crucial para evitar ambiguidades durante a implementação do código. Ao mapear exatamente qual pergunta vai para qual coluna, garantimos que a migração de dados e a criação das novas telas de UI sigam um contrato claro. A decisão de manter dados transacionais em `Orders` preserva a flexibilidade do sistema, permitindo que um mesmo perfil de edição seja usado em pedidos com contextos totalmente diferentes.**
