# Media 8 API

Este é o backend da plataforma **Media 8**, construído com **.NET 10** e **ASP.NET Core Web API**.
Responsável por toda a lógica de negócios, autênticação, gestão de pacotes e processamento de pedidos.

## 🛠️ Tecnologias

- **Framework**: .NET 10 (ASP.NET Core)
- **Banco de Dados**: PostgreSQL (via Entity Framework Core)
- **Autenticação**: JWT Bearer (Token-based)
- **Documentação**: Swagger / OpenAPI

## 🚀 Como Executar

### Pré-requisitos
- .NET SDK 10.0+ (para desenvolvimento local sem Docker)
- Docker & Docker Compose (Recomendado)
- PostgreSQL

### Configuração

1.  **Clone o repositório** e acesse a pasta da API:
    ```sh
    cd media8-api
    ```

2.  **Configure as Variáveis de Ambiente**:
    Copie o arquivo de exemplo:
    ```sh
    cp .env.example .env
    ```
    
    Edite o `.env` com suas credenciais:
    ```env
    # Conexão com o Banco de Dados
    DB_CONNECTION_STRING='Host=localhost;Port=5432;Database=media8;Username=postgres;Password=postgres'
    
    # Chave Secreta para assinatura de Tokens JWT (min 32 chars)
    JWT_SECRET='SUA_CHAVE_SUPER_SECRETA_E_SEGURA_AQUI'
    ```

### Executando com Docker (Recomendado)

A maneira mais fácil de rodar a API junto com o Banco de Dados é utilizando o Docker Compose na pasta de infraestrutura.

```sh
cd ../media8-infra
docker-compose up -d
```

A API estará disponível em: [http://localhost:5261](http://localhost:5261)
Swagger UI: [http://localhost:5261/swagger](http://localhost:5261/swagger)

### Executando Manualmente (.NET CLI)

1.  **Restaure os pacotes**:
    ```sh
    dotnet restore
    ```

2.  **Aplique as Migrations (Criação do Banco)**:
    ```sh
    dotnet ef database update --project Media8.Infrastructure --startup-project Media8.Api
    ```
    *(Necessário ter a ferramenta dotnet-ef instalada)*

3.  **Inicie a API**:
    ```sh
    dotnet run --project Media8.Api
    ```

## 📚 Documentação Técnica

Detalhes de implementações específicas podem ser encontrados na pasta `docs/implementations`.

- [Correção de Ciclo de Atribuição (DTOs)](./docs/implementations/002-fix-referencia-circular-atribuicao.md)
- [Lógica de Consumo de Saldo](./docs/implementations/001-consumo-saldo-servicos.md)
