# Análise Técnica: Recuperação de Colapso PascalCase no Media8

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 25/05/2026  
**Status:** Concluído

---

## 1. Sumário Executivo

Entre 24 e 25 de maio de 2026, o Media8 passou por uma **operação de recuperação técnica** para restaurar funcionalidades críticas quebradas durante uma migração incompleta para o padrão **PascalCase**.

**Resultado:** 25 commits atômicos, 0 erros de compilação, CRUDs restaurados, dados renderizando corretamente.

---

## 2. Cronologia dos Eventos

### 2.1. Ponto de Ruptura (20/05/2026)

A migração começou com o commit `89aac48` ("adequa JSON para PascalCase") e gerou uma cascata de **20+ commits de "fix"** consecutivos, onde cada tentativa de correção criava novas inconsistências:

```
Commit 1: Backend retorna PascalCase
Commit 2: Frontend lê camelCase → undefined
Commit 3: "Correção" inverte para PascalCase
Commit 4: Quebra em outro lugar
...
Commit 20: Estado de meia-migração
```

### 2.2. Intervenção Externa (24/05/2026)

Um agente externo (**antigravity+claudeopus**) foi acionado e produziu um diagnóstico completo:

**6 Erros Bloqueadores Identificados:**
1. Importações quebradas em `services/index.ts`
2. Tipo fantasma `ServiceType` referenciado mas não definido
3. Rota inexistente `/ServiceBalances/{userId}`
4. Case mismatch em `/Orders/AvailableBalances`
5. `PATCH` em Orders sem endpoint correspondente
6. `[JsonPropertyName("role")]` sobrevivente no `AdminUserDto`

**6 Falhas de Segurança Críticas:**
1. Credenciais e JWT_SECRET commitados em `.env`
2. GET /Orders vaza dados de todos os clientes (IDOR)
3. CORS aberto para qualquer origem
4. Sem Refresh Token implementado
5. Exceptions engolidas sem logging
6. JWT em LocalStorage (XSS)

### 2.3. Recuperação Cirúrgica (24-25/05/2026)

O agente executou **18 commits atômicos** que:
- Estabilizaram o contrato backend
- Migraram hooks e páginas para PascalCase
- Corrigiram imports e tipos quebrados
- Restauraram a funcionalidade dos CRUDs

### 2.4. Consolidação (25/05/2026)

Sessão subsequente corrigiu:
- Corrupção de variáveis locais (`newoffer` → `newOffer`)
- Separação de convenções (API DTO = PascalCase, estado local = camelCase)
- Lambdas com variáveis de 1 caractere (`o.status` → `o.Status`)
- Componentes compartilhados (`UserDetailsSheet`, `ContractAssignDialog`)

---

## 3. Padrão de Implementação

### 3.1. Estratégia de Commits Atômicos

Cada commit seguiu o protocolo:
```
1. Identificar escopo único (ex: "useOffers.ts")
2. Ler arquivo antes de editar
3. Aplicar correção mínima necessária
4. Validar compilação (dotnet build / tsc --noEmit)
5. Commitar com mensagem descritiva
6. NÃO agrupar múltiplas correções
```

**Exemplo:**
```bash
# Commit 8: useOffers.ts
git add media8-web/src/hooks/useOffers.ts
git commit -m "fix(web): corrige acesso PascalCase em useOffers (.name -> .Name, .id -> .Id)"

# Commit 9: useVideoFormats.ts
git add media8-web/src/hooks/useVideoFormats.ts
git commit -m "fix(web): corrige acesso PascalCase em useVideoFormats (.name -> .Name, .id -> .Id)"
```

### 3.2. Convenção de Nomenclatura

**Regra Estabelecida:**
- **DTOs da API (backend) = PascalCase:** `Id`, `Name`, `Status`, `VideoQuantity`
- **Estado Local (React) = camelCase:** `id`, `name`, `status`, `videoQuantity`
- **Payloads de Request = PascalCase:** `{ Name: "...", Email: "..." }`
- **Keys de Formulário = camelCase:** `name: "...", email: "..."`

**Exemplo Prático:**
```typescript
// ✅ Correto: Estado local (camelCase)
const [newOffer, setNewOffer] = useState({
  name: "",      // camelCase
  price: 0,      // camelCase
  isPublic: true // camelCase
});

// ✅ Correto: DTO da API (PascalCase)
const offer = await offerService.getById(id);
console.log(offer.Id);        // PascalCase
console.log(offer.Name);      // PascalCase
console.log(offer.IsPublic);  // PascalCase

// ✅ Correto: Payload para API (PascalCase)
await offerService.create({
  Name: newOffer.name,      // Key PascalCase, value de estado local
  Price: newOffer.price,
  IsPublic: newOffer.isPublic
});
```

### 3.3. Anti-Padrões Evitados

❌ **NÃO FAZER:**
```typescript
// Regex bulk que corrompe variáveis
code.replace(/offer\.Name/g, 'offer.Name') // Pega newOffer.Name e vira newoffer.Name

// Assumir estado sem verificar
// "Deve ser camelCase porque era antes"

// Adivinhar case sem inspecionar resposta da API
// "Vou tentar com 'active', senão 'Active', senão 'Status'"
```

✅ **FAZER:**
```typescript
// Inspecionar tipo TypeScript primeiro
type Offer = { Id: number; Name: string; Status: string };

// Usar o tipo para guiar acesso
const offer: Offer = await api.get('/offers/1');
console.log(offer.Id); // ✅ Compilador valida

// Validar no React Query DevTools
// console.log(queryClient.getQueryData(['offers']));
```

---

## 4. Ferramentas e Técnicas Utilizadas

### 4.1. PowerShell para Bulk Fixes

```powershell
# Corrigir variáveis corrompidas
$p = Resolve-Path "media8-web/src/pages/admin/OffersPage.tsx"
$c = [System.IO.File]::ReadAllText($p)
$c = $c -replace 'newoffer\.', 'newOffer.'
$c = $c -replace 'selectedoffer\.', 'selectedOffer.'
[System.IO.File]::WriteAllText($p, $c)

# Corrigir lambdas de 1 caractere
$c = $c -replace 'o\.status\b', 'o.Status'
$c = $c -replace 'o\.title\b', 'o.Title'
```

### 4.2. Validação de Compilação

```bash
# Backend
cd media8-api && dotnet build --no-restore

# Frontend
cd media8-web && npx tsc --noEmit
```

### 4.3. Git para Rastreabilidade

```bash
# Verificar status
git status --short

# Ver histórico
git log --oneline -25

# Desfazer mudanças locais
git checkout -- <arquivo>
```

---

## 5. Lições Aprendidas

### 5.1. Para Migrações de Contrato Futuras

1. **Nunca migrar parcialmente:** Mudar serialização JSON afeta TODO o ecossistema. Ou migra tudo de uma vez, ou não migra.

2. **Inspecionar ProblemDetails do .NET:** Erros de validação do backend contêm o contrato exato. Não adivinhar.

3. **Gerar tipos TypeScript automaticamente:** Usar ferramentas como `openapi-typescript` para gerar tipos a partir do Swagger.

4. **Testar em staging antes de commitar:** Validar endpoints manualmente com Postman/Insomnia.

5. **Commits atômicos:** Facilita rollback e identificação de regressões.

### 5.2. Para LLMs e Agentes de IA

1. **LLMs tratam erros de serialização como estéticos:** Focam em "case" em vez de contrato estrutural.

2. **Tendência a "chutar" case:** Alternam entre `active`/`Active` sem inspecionar resposta real.

3. **Regex bulk são perigosos:** `offer.Name` dentro de `newOffer.Name` quebra semântica.

4. **Validação humana é crítica:** Desenvolvedor deve revisar cada commit antes de prosseguir.

---

## 6. Estado Atual da Aplicação

### 6.1. Funcional (✅)

- [x] Listagem de dados em todas as páginas
- [x] Criação de Offers, VideoFormats, EditingStyles, Users
- [x] Edição de entidades
- [x] Exclusão (com validação de dependências)
- [x] RBAC (menus aparecem corretamente)
- [x] Invalidação de cache do React Query
- [x] Filtros de status funcionam
- [x] Build production gera sem erros

### 6.2. Pendente (⚠️)

- [ ] Rotação de secrets (`JWT_SECRET`, `DB_PASSWORD`)
- [ ] Remover `.env` do repositório
- [ ] Restringir CORS para domínios específicos
- [ ] Implementar Refresh Token
- [ ] Logging estruturado no exception handler
- [ ] Testes automatizados de contrato

---

## 7. Métricas de Código

| Metrica | Valor |
|---------|-------|
| Commits atômicos | 25 |
| Arquivos backend modificados | 11 |
| Arquivos frontend modificados | 40+ |
| Linhas de código morto removidas | ~200 |
| Erros bloqueadores corrigidos | 6 |
| Falhas de segurança mitigadas | 1 (IDOR) |
| Tempo estimado de recuperação | 8 horas |

---

## 8. Conclusão

A recuperação do colapso PascalCase foi bem-sucedida, mas expôs vulnerabilidades críticas em migrações de contrato:

1. **LLMs precisam de supervisão humana** para validar contratos reais
2. **Commits atômicos facilitam diagnóstico** e rollback
3. **Documentação viva** (tipos TypeScript gerados do Swagger) previne "chutes"
4. **Testes de contrato automatizados** deveriam bloquear regressões

O Media8 agora opera com contrato consistente entre frontend e backend, mas requer **rotação imediata de secrets** e **implementação de Refresh Token** para produção.

---

## 9. Referências

- **Case Study #065:** [Correção de Colapso PascalCase](implementations/065-correcao-colapso-migracao-pascalcase.md)
- **Case Study #064:** [API PascalCase Snapshot](implementations/064-api-pascal-case-snapshot-saldo.md)
- **Roadmap #066:** [Roadmap de Consolidação](implementations/066-roadmap-consolidacao-pascalcase.md)
- **Architecture:** [01-arquitetura-e-padroes.md](../01-arquitetura-e-padroes.md)
