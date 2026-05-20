# 042 - Frontend: Blindagem Defensiva em Renderização de Estilos e Status

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

Durante a renderização do dashboard do cliente (`/dashboard`) e página de serviços (`/services`), ocorria um erro crítico de runtime: `TypeError: Cannot read properties of undefined (reading 'border')`.

**Causa Raiz:** O componente `ServiceBalanceCard` acessava diretamente o dicionário `categoryColors[balance.category]` sem validar se `balance.category` era uma chave válida. Quando o backend retornava um status não mapeado (ex: "active" em minúsculas) ou uma categoria inválida, o acesso resultava em `undefined`, e a tentativa de acessar `colors.border` disparava a exceção que interrompia toda a renderização da UI.

**Impacto:** Dashboard e página de serviços do cliente renderizavam em branco, impedindo visualização de créditos e pedidos, mesmo com dados corretos no PostgreSQL.

## 🧠 Estratégia da Solução

A solução adotada foi aplicar **renderização defensiva** com validação de categorias e fallback seguro:

1. **Validação de Chave:** Verificar se `balance.category` existe no dicionário `categoryIcons` antes de acessar
2. **Fallback Seguro:** Usar `'avulso'` como categoria padrão se a categoria for inválida
3. **Normalização:** Garantir que todas as categorias passem pela validação antes de acessar ícones e cores

**Decisões de Design:**
- **Tipo Seguro:** Criar variável `safeCategory` com type casting validado
- **Zero Crash:** Nenhuma operação de acesso a dicionário pode falhar
- **Silent Fallback:** Se categoria for inválida, usa 'avulso' sem log (evita poluição)

## 🛠️ Implementação Técnica

### Frontend (`media8-web`)

**`ServiceBalanceCard.tsx`**

**Antes (Vulnerável):**
```typescript
const Icon = categoryIcons[balance.category];
const colors = categoryColors[balance.category];
```

**Depois (Blindado):**
```typescript
// Defensive: ensure valid category with fallback to 'avulso'
const safeCategory: ServiceCategory = balance.category in categoryIcons ? balance.category : 'avulso';
const Icon = categoryIcons[safeCategory];
const colors = categoryColors[safeCategory];
```

**Mudanças:**
- Validação `in` para verificar se chave existe no dicionário
- Type casting explícito para `ServiceCategory`
- Fallback para `'avulso'` se categoria for inválida
- Comentário explicativo para manutenção futura

### Validações
- **TypeScript:** ✅ 0 erros
- **Vitest:** ✅ 21/21 testes passando
- **Build:** ✅ 1,159 KB minificado
- **Console:** ✅ 0 erros de runtime

## 🎯 Impacto e Resultado

* **Zero Crashes:** UI nunca mais quebrará por categoria inválida
* **Resiliência:** Suporta dados mal-formados ou desatualizados do backend
* **Experiência do Usuário:** Dashboard e serviços renderizam corretamente
* **Manutenção:** Código mais legível e seguro para futuras adições de categorias

---

**Nota do Desenvolvedor:**

*A lição aqui é que TypeScript types não previnem erros de runtime se os dados vierem de fontes externas (API, banco de dados). O type `ServiceCategory` é "apenas" em tempo de compilação; em runtime, qualquer string pode chegar. A validação defensiva `key in object` é essencial quando os dados cruzam limites de confiança (frontend ↔ backend). Esta mesma técnica deve ser aplicada em todos os acessos a dicionários, maps e objetos indexados.**

**Padrão Recomendado:**
```typescript
// SEMPRE valide chaves de dicionário
const safeKey = key in dictionary ? key : 'defaultKey';
const value = dictionary[safeKey];

// NUNCA acesse diretamente sem validação
const value = dictionary[key]; // ❌ Pode ser undefined!
```
