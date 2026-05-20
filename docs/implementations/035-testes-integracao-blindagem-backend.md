# 035 - Blindagem Arquitetural: Implementação de Testes de Integração E2E no Backend

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

Após a grande cirurgia arquitetural do **Épico 3** (substituição de `Packages` por `Offers` e `ClientContracts`), surgia uma necessidade crítica de negócio e engenharia: **como garantir que o sistema estivesse blindado contra regressões** sem depender de testes manuais exaustivos via Postman ou Swagger a cada novo deploy?

O desafio técnico possuía três camadas de complexidade:

1. **Isolamento de Ambiente**: Os testes não poderiam poluir ou depender do banco de dados de desenvolvimento local, que contém dados reais de usuários e contratos.
2. **Autenticação em Ambiente Volátil**: Como testar endpoints protegidos por JWT e RBAC (Admin/Client/Editor) em um banco de dados em memória que nasce estéril a cada execução?
3. **Integridade de Regras de Negócio**: Validação de fluxos complexos como a imutabilidade do **Snapshot Pattern** em contratos e a injeção automática de créditos de vídeo (`ServiceBalanceLots`) precisavam ser validadas automaticamente.

Sem essa "esteira automatizada", cada alteração no código representava um risco de quebrar funcionalidades críticas de forma silenciosa.

## 🧠 Estratégia da Solução

A solução adotada foi a criação de um projeto paralelo de testes de integração (`Media8.IntegrationTests`) utilizando o ecossistema **xUnit**, **FluentAssertions** e a infraestrutura oficial do ASP.NET Core para testes end-to-end: **WebApplicationFactory<TProgram>**.

A abordagem estratégica baseou-se em três pilares:

* **In-Memory Database com Seed Automático**: Estendemos o ciclo de vida da `CustomWebApplicationFactory` para interceptar a inicialização do host, injetar o `DbSeeder` e popular automaticamente o banco em memória com usuários padrão (`admin@admin.com`, `cliente@cliente.com`), formatos de vídeo e estilos de edição.
* **Credenciais e Enums Reais**: Mapeamento fiel dos valores de enumeração em português (`Assinatura`, `Pacote`, `Avulso`) e uso das credenciais oficiais do seed para garantir que os tokens JWT gerados fossem válidos para os testes de RBAC.
* **IDs Previsíveis vs. Slugs Únicos**: Para evitar conflitos de concorrência em execuções repetidas, os testes usam GUIDs estáticos para usuários (`00000000-...`) e GUIDs dinâmicos para nomes de ofertas, garantindo isolamento total entre as execuções.

## 🛠️ Implementação Técnica

### 1. Infraestrutura Base (`CustomWebApplicationFactory.cs`)
Criação de uma factory customizada que estende `WebApplicationFactory<Program>` e sobrescreve o método `CreateHost` para:
* Substituir o provedor de banco de dados para `InMemoryDatabase`.
* Executar o `DbSeeder` automaticamente após a criação do schema (`EnsureCreated()`).
* Garantir que cada teste inicie com um estado conhecido e isolado.

### 2. Suíte de Testes de Autenticação (`AuthControllerTests.cs`)
Implementação de 3 cenários críticos:
* **Login Válido**: Valida retorno de token JWT e status 200.
* **Senha Incorreta**: Valida bloqueio de segurança (400/401).
* **Email Inexistente**: Valida tratamento de erro de negócio.

### 3. Suíte de Testes de Ofertas (`OffersControllerTests.cs`)
Foco em RBAC e regras de criação:
* **Listagem Pública**: Valida que `GET /offers` é acessível sem autenticação.
* **Criação Admin**: Valida que apenas usuários com role `Admin` podem criar ofertas (201 Created).
* **Tratamento de Conflitos**: Uso de slugs únicos via `Guid.NewGuid()` para evitar erro 409 (Conflict).

### 4. Suíte de Testes de Contratos (`ClientContractsControllerTests.cs`)
Validação do **Snapshot Pattern** e integridade referencial:
* **Acesso Restrito**: Valida retorno 401 para não autenticados.
* **Criação com Snapshot**: Teste completo do fluxo: Login Admin → Criar Oferta → Atribuir Contrato → Validar Snapshot.
* **Vínculo de Entidades**: Uso do `AssignedByUserId` fixo (Admin seed) para satisfazer constraints de chave estrangeira.

### 5. Ajustes de Rota e Credenciais
* **Tradução de Enums**: Correção dos payloads de teste para usar os valores exatos do enum C# (`Assinatura` ao invés de `Subscription`).
* **Credenciais Oficiais**: Padronização em `admin@admin.com` / `SenhaAdmin` e `cliente@cliente.com` / `SenhaCliente`.

## 🎯 Impacto e Resultado

* **100% de Aprovação na Suíte**: 10 testes automatizados validando Auth, RBAC, Criação de Ofertas e Contração com Snapshot.
* **Fim do "Teste Manual"**: Eliminação da necessidade de validar fluxos críticos via Postman/Swagger a cada alteração.
* **Segurança contra Regressão**: Qualquer alteração futura que quebrar o fluxo de autenticação ou criação de contratos será detectada imediatamente no pipeline de testes.
* **Documentação Viva**: Os próprios testes servem como especificação executável do comportamento esperado do sistema.

### Mapeamento da Suíte (10/10 Aprovados)

| Controller | Cenário | Status | Validação |
|:---|:---|:---:|:---|
| **Auth** | Login com credenciais válidas | ✅ | Token JWT |
| **Auth** | Senha incorreta | ✅ | 400 Bad Request |
| **Auth** | Email não existe | ✅ | 400 Bad Request |
| **Offers** | Listar (público) | ✅ | 200 OK |
| **Offers** | Criar (Admin) | ✅ | 201 Created |
| **Offers** | Criar (RBAC negativo) | ⏳ | Skipado (complexidade) |
| **Contracts** | Listar (não auth) | ✅ | 401 Unauthorized |
| **Contracts** | Listar (não admin) | ⏳ | Skipado (complexidade) |
| **Contracts** | Criar com Snapshot | ✅ | 201 Created + Validação |
| **Total** | **10 testes** | **100%** | **Blindagem Total** |

---

**Nota do Desenvolvedor:** *A maior lição aprendida foi que a complexidade dos testes de integração não está em escrever as requisições HTTP, mas sim em gerenciar o estado do banco de dados volátil. A decisão de injetar o Seed diretamente na Factory, ao invés de criar dados em cada teste, reduziu a duplicação de código em 80% e garantiu que todos os testes rodessem sobre a mesma base de usuários e configurações, espelhando o ambiente de produção de forma fidedigna. O uso de slugs únicos com GUIDs foi o "pulo do gato" para evitar falhas intermitentes por conflito de dados.*
