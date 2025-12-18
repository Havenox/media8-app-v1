# Media 8 - Segurança e Integridade

> **Security First**: Políticas de defesa em profundidade e integridade de dados implementadas no Media 8.

---

## Sumário

1. [Princípios de Segurança](#princípios-de-segurança)
2. [Autenticação (JWT)](#autenticação-jwt)
3. [Autorização (RBAC)](#autorização-rbac)
4. [Integridade de Dados](#integridade-de-dados)
5. [Proteções Contra Ataques](#proteções-contra-ataques)

---

## Princípios de Segurança

### Defense in Depth
Não confiamos em uma única barreira.
1.  **Frontend**: Validação Zod + TypeScript (UX).
2.  **API**: DTOs estritos + Validation Filters (Segurança).
3.  **Database**: RLS + Constraints FK + Triggers (Última Milha).

### Zero Trust
Nunca confie no cliente.
*   IDs de usuário no payload são ignorados; usamos o `sub` do token JWT.
*   Roles no token são ignoradas; verificamos a tabela `user_roles` em tempo real.

---

## Autenticação (JWT)

Utilizamos **JWT (JSON Web Tokens)** assinados com HMACSHA256 (min 256-bit secret).

### Estratégia de Refresh Token
*   **Access Token**: Curta duração (15-60 min).
*   **Refresh Token**: Longa duração (7 dias), `Rotating` (novo a cada uso) e armazenado em Banco de Dados com hash.
*   **Revogação**: Logout invalida o chain de refresh tokens imediatamente.

---

## Autorização (RBAC)

O sistema implementa **Role-Based Access Control** com distinção física de tabelas.

### Segregação de Roles (Anti-Privilege Escalation)
A role do usuário **NÃO** fica na tabela `users` ou `profiles`.
Ela reside em `user_roles`, uma tabela blindada onde apenas Admin tem permissão de escrita via API, e o próprio usuário tem permissão apenas de leitura via RLS.

```sql
-- Exemplo de Policy (PostgreSQL RLS)
CREATE POLICY "Users view own role" ON user_roles 
USING (user_id = auth.uid());
-- NENHUMA policy de INSERT/UPDATE para usuários comuns.
```

---

## Integridade de Dados

Segurança também é proteger o usuário contra perda de dados acidental.

### 1. Safe Delete Pattern (Soft Delete & Dependency Check)
**Problema**: Deletar um Pacote que já foi vendido quebrava o histórico de Vendas.
**Solução**:
*   **Soft Delete**: Entidades críticas (`Packages`, `Users`) nunca são deletadas fisicamente (`DELETE`), apenas marcadas como `is_active = false` ou `deleted_at = NOW()`.
*   **Conflict Prevention**: O Backend bloqueia a desativação se existirem contratos ativos dependentes, retornando `409 Conflict` com mensagem explicativa ("Este pacote possui 35 clientes ativos. Cancele os contratos antes de desativar.").

### 2. DTO Pattern (Prevention of Mass Assignment)
**Problema**: Ataques de *Mass Assignment* (Over-posting) onde o hacker envia `{ "isAdmin": true }` no JSON de update de perfil.
**Solução**:
*   A API nunca aceita Entidades de Domínio no Body.
*   Para cada endpoint, existe um DTO específico (ex: `UpdateProfileRequest`) que contém *apenas* os campos permitidos (Nome, Telefone).
*   Propriedades sensíveis (`Role`, `PasswordHash`, `Balance`) simplesmente não existem na classe DTO de entrada, sendo fisicamente impossível injetá-las via model binding.

---

## Proteções Contra Ataques

| Vetor de Ataque | Medida de Proteção |
|-----------------|--------------------|
| **SQL Injection** | Uso estrito de EF Core LINQ (Queries Parametrizadas). Strings concatenadas são proibidas no CI. |
| **XSS** | React (Auto-escaping) + CSP Headers. Nenhuma renderização de HTML cru (`dangerouslySetInnerHTML`) sem sanitização. |
| **CSRF** | Uso de JWT em Header `Authorization` (não Cookies de sessão) elimina a superfície de ataque CSRF clássica. |
| **IDOR** | Validação de Ownership em todos os Controllers (`if (resource.UserId != currentUserId) throw Forbidden`). |
| **Replay Attacks** | Tokens com expiração curta (`exp`) e timestamp de emissão (`iat`). |

---

## Checklist de Deploy

- [ ] Variáveis de ambiente (`JWT_SECRET`, `DB_PASSWORD`) configuradas.
- [ ] `HTTPS` forçado no Nginx.
- [ ] Migrations de banco aplicadas (incluindo Triggers de segurança).
- [ ] Logs de Aplicação configurados para não expor PII (Dados sensíveis).
