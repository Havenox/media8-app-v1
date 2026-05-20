# 📋 Instruções para Aplicação da Migration PascalCase

## Contexto
O banco de dados foi resetado (DROP SCHEMA public CASCADE). Para aplicar a nova estrutura em PascalCase, é necessário reconfigurar o search_path do PostgreSQL.

## Passo 1: Executar Script SQL no Banco

### Opção A: Via psql (Recomendado)
```bash
# Conecte-se ao banco e execute o script:
psql -h localhost -U media8 -d media8 -f fix_search_path.sql

# Ou interativamente:
psql -h localhost -U media8 -d media8
# Cole o conteúdo do arquivo fix_search_path.sql
```

### Opção B: Via pgAdmin ou Azure Data Studio
1. Abra o arquivo `fix_search_path.sql`
2. Execute as instruções SQL no query analyzer
3. Confirme que não há erros

### O que o script faz:
- ✅ Reconfigura o search_path para o usuário `media8`
- ✅ Transfere propriedade do schema public
- ✅ Concede privilégios totais

## Passo 2: Aplicar Migration

Após executar o script SQL:

```bash
cd media8-api/Media8.Infrastructure
dotnet ef database update --startup-project ../Media8.Api
```

### Resultado Esperado:
- ✅ Tabela `__EFMigrationsHistory` criada
- ✅ Tabelas em PascalCase: `Users`, `Offers`, `ClientContracts`, etc.
- ✅ 3 usuários seedados:
  - `admin@admin.com` (Senha: `SenhaAdmin`)
  - `cliente@cliente.com` (Senha: `SenhaCliente`)
  - `editor@editor.com` (Senha: `SenhaEditor`)

## Passo 3: Validação

### Verificar tabelas criadas:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

### Deve retornar:
```
ClientContracts
EditingStyles
Offers
OrderTimelines
Orders
PackageAssignments (legado)
PackageVideoFormats (legado)
Packages (legado)
Profiles
ServiceBalanceLots
UserRoles
Users
VideoFormats
__EFMigrationsHistory
```

### Verificar usuários:
```sql
SELECT email, name FROM public."Users" ORDER BY email;
```

## Solução de Problemas

### Erro: "relation already exists"
Se aparecer este erro, o schema não foi completamente limpo. Execute:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
E execute o script `fix_search_path.sql` novamente.

### Erro: "permission denied"
Certifique-se de estar executando com usuário correto:
```bash
psql -h localhost -U media8 -d media8
```

### Migration falha após script
Verifique se o search_path está configurado:
```sql
SHOW search_path;
-- Deve retornar: public
```

## Commit de Ajustes (se necessário)

Se houver alterações manuais nos arquivos de configuração:

```bash
cd G:\DEV\Media8\media8-app-v1
git add -A
git commit -m "fix(infra): resolve search_path do postgres pós-reset e aplica esquema pascalcase"
```

---

**Nota Importante**: Este processo é necessário apenas uma vez, após o reset completo do schema.
