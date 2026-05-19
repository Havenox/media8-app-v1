# 026 - Infraestrutura: Blindagem de Variáveis de Ambiente e Remoção de Hardcodes

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 19/05/2026

---

## 🚀 Desafio de Engenharia

Durante a fase de preparação para a refatoração do domínio (Fase 0), foi identificada uma vulnerabilidade crítica na infraestrutura do projeto: **segredos e configurações estavam hardcoded** em múltiplos pontos do código-fonte.

**Problemas identificados:**
1. **Vazamento de Credenciais**: Strings de conexão com banco de dados (`Host=192.168.18.110;Password=Guerra2024!`) estavam expostas no `docker-compose.yml` e em scripts.
2. **Chaves JWT Expostas**: Segredos de autenticação (`M8_PRODUCTION_SECRET...`) estavam visíveis no repositório.
3. **Dependência de Ambiente Local**: O frontend e scripts de teste dependiam de `localhost:5261`, quebrando em ambientes Docker ou de produção.
4. **Falta de Portabilidade**: A aplicação não conseguia ser implantada em diferentes ambientes sem edição manual de arquivos.
5. **Risco de Segurança**: Qualquer pessoa com acesso ao repositório tinha acesso às credenciais de produção.

## 🧠 Estratégia da Solução

A solução adotada seguiu o princípio **Twelve-Factor App**, separando estritamente código de configuração:

1. **Externalização Total**: Todas as variáveis sensíveis foram movidas para arquivos `.env` (ignorados pelo Git) e `.env.example` (com dados fictícios).
2. **Interpolação no Docker Compose**: O arquivo `docker-compose.yml` passou a usar a sintaxe `${VARIAVEL}` para injetar variáveis de ambiente em tempo de execução, sem hardcodes.
3. **Hierarquia .NET**: Para o backend, utilizou-se o padrão de duplo sublinhado (`ConnectionStrings__DefaultConnection`) para mapeamento automático do ASP.NET Core.
4. **Prefixo Vite no Frontend**: Variáveis do React foram padronizadas com `VITE_` para exposição segura ao navegador.
5. **Scripts Genéricos**: Scripts de build e teste foram parametrizados para lerem URLs de variáveis de ambiente, não mais fixas em `localhost`.
6. **Fallback Removido**: O cliente API do frontend agora lança erro explícito se a variável não existir, evitando falhas silenciosas.

## 🛠️ Implementação Técnica

### Backend (.NET)
- **appsettings.json**: Limpo de segredos. Configuração migrada para `appsettings.Development.json` (ignorado) e variáveis de ambiente.
- **users_seed.json**: Reduzido de 258 usuários bulk para 3 usuários de exemplo (Admin, Editor, Client), removendo senhas genéricas em massa.
- **Environment Injection**: Configuração passa a aceitar injeção via `DB_CONNECTION_STRING` e `JWT_SECRET` do Docker.

### Frontend (React/Vite)
- **api.ts**: Removido fallback `http://localhost:5261/api/v1`. Agora usa estritamente `import.meta.env.VITE_API_URL` e lança erro se indefinido.
- **.env.example**: Criado template com `VITE_API_URL`, `VITE_ADMIN_USER` e `VITE_ADMIN_PASSWORD` para documentação.

### Infraestrutura (Docker)
- **docker-compose.yml**:
  - Substituído `DB_CONNECTION_STRING=Host=192.168.18.110...` por `${DB_CONNECTION_STRING}`.
  - Substituído `JWT_SECRET=M8_PRODUCTION...` por `${JWT_SECRET}`.
  - Adicionado suporte a variáveis opcionais com default (`${VAR:-padrao}`).
- **Scripts**:
  - `dev-up.bat`: Mantido apenas para exibição informativa de URLs (não afeta código).
  - `test-integration.ps1`: Agora usa `$env:API_URL` configurável, permitindo testes em diferentes ambientes.

### Templates de Ambiente
Criados 3 arquivos `.env.example` padronizados:
1. **media8-infra/.env.example**: Variáveis para Docker Compose (DB, JWT, Ports).
2. **media8-api/.env.example**: Variáveis para o backend .NET.
3. **media8-web/.env.example**: Variáveis para o frontend Vite.

## 🎯 Impacto e Resultado

* **Segurança Eliminada**: Zero segredos no repositório. Credenciais de produção e desenvolvimento agora são gerenciadas externamente.
* **Portabilidade Total**: A aplicação pode ser implantada em qualquer ambiente (Docker, IIS, Linux, Windows) apenas alterando o `.env`.
* **Onboarding Simplificado**: Novos desenvolvedores copiam `.env.example` para `.env` e seguem o desenvolvimento, sem risco de vazar credenciais.
* **Scripts Robustos**: Scripts de integração e build funcionam em qualquer máquina, não apenas na máquina original do desenvolvedor.
* **Conformidade Twelve-Factor**: O projeto agora segue boas práticas modernas de desenvolvimento SaaS.

---

**Nota do Desenvolvedor:**
*A remoção de hardcodes não é apenas uma "boa prática" — é uma necessidade de segurança. Manter senhas e IPs no código é como deixar a chave de casa embaixo do tapete. A parametrização via `.env` e a interpolação do Docker garantem que o mesmo código rode do notebook do estagiário ao servidor de produção, sem alterações no repositório. O custo de 10 minutos para criar os templates economiza horas de debugging de "funciona na minha máquina" e previne vazamentos catastróficos.**
