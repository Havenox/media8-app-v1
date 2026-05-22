# 062 - Perfis de Identidade Visual: Alinhamento Estrito ao Design System Institucional

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 22/05/2026

---

## 🚀 Desafio de Engenharia

Após a implementação da camada de dados e hooks de query para os perfis de briefing (estudos #060 e #061), foi necessário criar a interface visual de gerenciamento. O desafio surgiu quando a primeira versão da UI introduziu gradientes genéricos (roxo/rosa) que violavam gravemente as diretrizes de identidade visual do Media8.

**Problemas Identificados:**
1. **Violação de Brand Guidelines**: Uso de `from-purple-600 to-pink-600` em títulos e botões, cores não existentes na paleta institucional.
2. **Inconsistência Visual**: A página de perfis parecia pertencer a outro produto, quebrando a unidade estética do sistema.
3. **Falta de Padronização**: Enquanto outras páginas usavam variáveis semânticas (`text-primary`, `variant="default"`), a nova tela usava valores fixos hardcoded.
4. **Risco de Degradação**: Sem correção imediata, futuras implementações poderiam replicar o erro, poluindo o design system com "poluição visual".

A identidade do Media8 é baseada em **Vinho Profundo (#400404)** e **Creme Suave (#FFFBED)**, transmitindo autoridade, intensidade e sofisticação. Qualquer desvio compromete a percepção profissional do produto.

## 🧠 Estratégia da Solução

A solução adotada foi uma **auditoria e correção imediata** baseada em três princípios:

1. **Zero Tolerance para Cores Fixas**: Nenhum elemento pode usar valores hexadecimais ou nomes de cores diretos (ex: `purple-600`). Tudo deve passar pelas variáveis do Tailwind.
2. **Variáveis Semânticas como Única Fonte da Verdade**: Títulos usam `text-foreground`, botões usam `variant="default"`, ícones usam `text-primary`.
3. **Design System como Contrato**: O arquivo `tailwind.config.ts` e `index.css` definem o contrato visual. Componentes são apenas consumidores, não criadores de estilo.

**Decisão Arquitetural:**
Em vez de criar regras complexas de linting para CSS, optou-se pela **disciplina de code review** e **documentação explícita** (este estudo de caso) para educar desenvolvedores sobre a importância do alinhamento à marca.

## 🛠️ Implementação Técnica

### Frontend (media8-web/src/pages/ProfilesPage.tsx)

**Remoção de Gradientes Genéricos:**
```diff
- <h1 className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
+ <h1 className="text-3xl font-bold tracking-tight text-foreground">
```

**Botão Primário Padronizado:**
```diff
- <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
+ <Button variant="default">
```

**Ícones com Cores do Tema:**
```diff
- <Palette className="text-purple-600" />
+ <Palette className="text-primary" />

- <Film className="text-pink-600" />
+ <Film className="text-primary" />
```

### Design System (media8-web/src/index.css)

**Variáveis Utilizadas (HSL):**
```css
--wine: 0 94% 14%;        /* Vinho Profundo #400404 */
--cream: 48 100% 96%;     /* Creme Suave #FFFBED */
--primary: var(--wine);
--foreground: var(--wine);
```

**Mapeamento Tailwind:**
```typescript
colors: {
  primary: "hsl(var(--primary))",  // Vinho
  foreground: "hsl(var(--foreground))",  // Vinho
  wine: {
    DEFAULT: "hsl(var(--wine))",
    light: "hsl(var(--wine-light))",
    warm: "hsl(var(--wine-warm))",
    vibrant: "hsl(var(--wine-vibrant))",
  }
}
```

## 🎯 Impacto e Resultado

* **Consistência de Marca Restaurada**: A página de perfis agora reflete a mesma identidade visual das demais telas (ServicesPage, OrdersPage), usando exclusivamente a paleta Vinho/Creme.
* **Prevenção de Degradação**: Este estudo de caso serve como referência para futuras implementações, estabelecendo precedente de que **nenhuma cor fixa é aceitável**.
* **Manutenção Simplificada**: Alterações futuras na paleta (ex: ajuste de tom de vinho) propagam automaticamente para todos os componentes via variáveis CSS.
* **Educação de Equipe**: O documento explicita o "porquê" da restrição, transformando uma regra estética em princípio arquitetural.
* **Build Validado**: ✅ Sucesso sem erros, com redução de 0.86 kB no CSS (remoção de gradientes desnecessários).

---

**Nota do Desenvolvedor:**

*A identidade visual de um produto enterprise não é "enfeite" - é contrato semântico com o usuário. Quando um sistema usa gradientes genéricos de uma biblioteca de UI (como roxo/rosa do Tailwind default), ele sinaliza desleixo e falta de personalidade. No Media8, cada pixel deve comunicar **autoriadade** (vinho), **sofisticação** (creme) e **intensidade** (contraste). A correção não foi sobre "estética", foi sobre **integridade da marca**. Desenvolvedores devem tratar variáveis de tema como imutáveis por contrato, nunca como sugestões. A próxima iteração natural será criar componentes de branding reutilizáveis (`<BrandTitle>`, `<BrandButton>`) que encapsulem essas regras em nível de componente, não de página.*
