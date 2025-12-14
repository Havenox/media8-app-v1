# Implementação: JSON User Seeder (Bulk Insert)

Esta documentação detalha a implementação do mecanismo de inserção em massa de usuários (Seeder) a partir de um arquivo JSON, focado em performance e segurança para ambientes de teste e desenvolvimento.

## 1. Visão Geral

O recurso permite popular o banco de dados com milhares de usuários de teste de forma rápida e controlada, utilizando um arquivo `users_seed.json` localizado na raiz da API. A execução é controlada por variável de ambiente para evitar execuções acidentais em produção.

## 2. Detalhes da Implementação

### Arquitetura
A lógica foi centralizada na classe `DbSeeder` (`Media8.Infrastructure.Data`), que é invocada durante o startup da aplicação (`Program.cs`) dentro de um escopo de serviço.

### Fluxo de Execução
1.  **Verificação de Configuração**: O Seeder verifica a variável de ambiente `SEED_USERS_FROM_JSON` (definida no `.env` e carregada via `docker-compose.yml`). Se `false` ou inexistente, o processo é abortado imediatamente.
2.  **Leitura do Arquivo**: O sistema procura por `users_seed.json` no diretório base da aplicação (`AppContext.BaseDirectory`).
3.  **Deserialização**: Utiliza `System.Text.Json` configurado com `JsonStringEnumConverter` para permitir o uso de strings para Enums (ex: "Client", "Admin") em vez de inteiros, facilitando a legibilidade do JSON.
4.  **Processamento e Inserção**: Itera sobre os usuários e insere no banco, criando as entidades relacionadas (`User`, `Profile`, `UserRole`).

### Otimização de Performance (Critical Path)
Inicialmente, o sistema verificava a existência de cada email no banco individualmente (`await _context.Users.AnyAsync(...)`). Para 1100 usuários, isso gerava 1100 queries SELECT, resultando em lentidão extrema (minutos).

**A solução otimizada:**
-   **Pré-carregamento (Memory Cache)**: Antes do loop, todos os emails existentes são carregados em um `HashSet<string>` em memória com uma única query (O(1) round-trip).
-   **Verificação em O(1)**: A verificação de existência passa a ser uma operação de hash em memória, instantânea.
-   **Batch Saving**: O Entity Framework salva as alterações em lotes (batch) a cada 1000 registros, reduzindo o overhead de transações de banco de dados.

**Resultado:** O tempo de inserção para ~1100 usuários caiu de vários minutos para menos de 2 segundos.

## 3. Medidas de Segurança

A segurança foi um pilar central desta implementação. Abaixo detalhamos as medidas adotadas:

### A. Controle por Variável de Ambiente (Circuit Breaker)
**Medida:** A flag `SEED_USERS_FROM_JSON=true` é **obrigatória**.
**Por que é seguro:** Em um ambiente de produção real, essa variável deve ser removida ou definida como `false`. Isso impede que, mesmo que o arquivo JSON exista no servidor, ele seja processado, prevenindo a injeção de usuários de teste em uma base produtiva.

### B. Isolamento de Arquivo (Server-Side Only)
**Medida:** O arquivo `users_seed.json` reside no sistema de arquivos do servidor (container Docker) e **não é exposto** via endpoint HTTP.
**Por que é seguro:** Não há upload público. Um atacante precisaria de acesso físico ao servidor ou controle do processo de deploy (CI/CD) para injetar um arquivo malicioso.

### C. Hashing de Senha Robusto
**Medida:** As senhas plain-text do JSON (ex: "123456") **jamais** são salvas diretamente. Elas passam pelo `IPasswordHasher` da aplicação antes da persistência.
**Por que é seguro:** Garante que, mesmo que o banco de dados seja comprometido, as credenciais dos usuários (mesmo sendo de teste) mantenham a integridade criptográfica padrão do sistema.

### D. Imutabilidade em Runtime
**Medida:** O arquivo é "chumbado" na imagem ou volume durante o build/deploy.
**Por que é seguro:** Alterações no JSON exigem um novo deploy ou reinício do container (`docker-compose up -d --build`). Isso cria uma barreira natural contra modificações dinâmicas maliciosas.

## 4. Recomendações Futuras

Para aumentar ainda mais a segurança em ambientes críticos:
-   **Validadores Estritos:** Implementar Regex para garantir que apenas emails com domínios controlados (ex: `@meudominio.teste`) sejam aceitos pelo Seeder.
-   **Log de Auditoria:** Registrar no log do sistema (CloudWatch, Datadog, etc.) sempre que o Seeder for ativado, alertando administradores.
-   **Permissões de Arquivo:** Em produção Linux, garantir que o usuário do processo .NET tenha permissão apenas de leitura (`read-only`) no arquivo JSON.
