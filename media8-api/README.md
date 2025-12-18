# Media 8 API (.NET 10)

Esta pasta contém o backend da aplicação, construído seguindo os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**.

> **Documentação Completa**: Veja [docs/](../docs) na raiz do monorepo para Arquitetura, Schema e Segurança.

---

## Estrutura da Solução

*   **`Media8.Api`**: Camada de Apresentação (Controllers). Depende de Application e Infra.
*   **`Media8.Application`**: Casos de Uso, DTOs e Interfaces de Serviço. (Core Logic).
*   **`Media8.Domain`**: Entidades Puras, Value Objects e Interfaces de Repositório. (Zero dependências).
*   **`Media8.Infrastructure`**: Implementação de Repositórios (EF Core), Serviços Externos e Persistência.

---

## Developer Guide

### Executando Localmente

Recomendamos usar o **Docker Compose** da raiz (`media8-infra`) para orquestrar API e Banco de Dados.

Se precisar rodar *apenas* a API isoladamente (para debugging):

1.  **Startup do Banco (Docker)**
    ```bash
    cd ../media8-infra
    docker-compose up -d postgres
    ```

2.  **Configuração**
    Copie `.env.example` para `.env` e ajuste a Connection String.

3.  **Execução (.NET CLI)**
    ```bash
    dotnet restore
    dotnet run --project Media8.Api
    ```

### Migrations

Para criar ou aplicar migrations, execute na raiz desta pasta (`media8-api`):

```bash
# Criar Migration
dotnet ef migrations add NomeDaMudanca --project Media8.Infrastructure --startup-project Media8.Api

# Aplicar ao Banco
dotnet ef database update --project Media8.Infrastructure --startup-project Media8.Api
```

---

## Testando (Swagger)

A API expõe documentação OpenAPI em ambiente de desenvolvimento.
Acesse: `http://localhost:5261/swagger`
