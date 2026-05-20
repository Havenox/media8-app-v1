-- =============================================
-- Media 8 - Reset e Configuração do Schema Public
-- =============================================
-- Este script reconfigura o search_path e permissões do usuário media8
-- Após o reset do schema public, o PostgreSQL pode perder as configurações padrão.
-- 
-- USO: Execute este script com um usuário superusuário (postgres)
-- =============================================

-- 1. Garantir que o schema public exista
CREATE SCHEMA IF NOT EXISTS public;

-- 2. Transferir propriedade do schema public para o usuário media8
ALTER SCHEMA public OWNER TO media8;

-- 3. Configurar o search_path padrão para o usuário media8
-- Isso garante que o EF Core encontre o schema public automaticamente
ALTER ROLE media8 SET search_path TO public;

-- 4. Conceder todos os privilégios no schema public
GRANT ALL ON SCHEMA public TO media8;

-- 5. Garantir privilégios em futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO media8;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO media8;

-- =============================================
-- Validação
-- =============================================
-- Execute estas consultas para validar:

-- Verificar search_path do usuário
-- SHOW search_path;

-- Verificar tabelas criadas (após migration):
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- =============================================
-- PRÓXIMO PASSO:
-- Após executar este script, rode:
-- dotnet ef database update --startup-project ../Media8.Api
-- =============================================
