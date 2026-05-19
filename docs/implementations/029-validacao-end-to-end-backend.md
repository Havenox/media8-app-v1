# 029 - Validação End-to-End: Homologação do Backend Data-Driven em Ambiente Docker

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 19/05/2026

---

## 🚀 Desafio de Engenharia

Após a migração evolutiva do banco de dados (Estudo de Caso #028), o backend Media 8 enfrentava seus últimos desafios para entrar em produção:

1. **Instabilidade no Seed Inicial:** O `DbSeeder` tentava popular tabelas transacionais (`Orders`, `PackageAssignments`) antes de garantir que as tabelas base (`Users`, `VideoFormats`) estivessem consistentes, causando violações de chave estrangeira e loops de restart no container Docker.
2. **Falta de Contrato para o Frontend:** Não havia um endpoint exposto que listasse os formatos de vídeo dinâmicos, impedindo que o React consumisse o catálogo vivo.
3. **Validação de Runtime:** Era necessário provar que a API respondia corretamente com dados `Guid` em vez de enums, garantindo que a refatoração de 29 estudos de caso funcionava em tempo de execução.

**A Dor:** O container `media8-api` entrava em crash loop (`Restarting (139)`), impedindo qualquer teste de integração e bloqueando a homologação da Fase 0.

## 🧠 Estratégia da Solução

A estratégia seguiu o princípio da **estabilização progressiva**:

1. **Simplificação do DbSeeder:** Removido o seed de `Packages` e `Orders` da inicialização automática. O foco passou a ser apenas dados estruturais críticos (`Users` e `VideoFormats`), que são a base para operações manuais ou via API.
2. **Criação do `VideoFormatsController`:** Implementado um controller RESTful dedicado para expor `GET /api/v1/video-formats`, retornando a lista de formatos ativos com `Id`, `Name`, `Slug`, `MaxDurationSeconds` e `Tier`.
3. **Correção de Dependências:** Adicionado `using Media8.Infrastructure.Data;` no controller para resolver a referência ao `ApplicationDbContext`.
4. **Build e Deploy Iterativo:** A cada alteração, um novo build da imagem Docker e reinicialização do container para validar a estabilidade.

## 🛠️ Implementação Técnica

### Backend (.NET 10 / ASP.NET Core)

**Arquivo Criado:** `Media8.Api/Controllers/VideoFormatsController.cs`
```csharp
[ApiController]
[Route("api/v1/video-formats")]
public class VideoFormatsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public VideoFormatsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<VideoFormatResponse>>> GetActiveFormats()
    {
        var formats = await _context.VideoFormats
            .Where(vf => vf.IsActive)
            .Select(vf => new VideoFormatResponse
            {
                Id = vf.Id,
                Name = vf.Name,
                Slug = vf.Slug,
                MaxDurationSeconds = vf.MaxDurationSeconds,
                Tier = vf.Tier.ToString()
            })
            .ToListAsync();

        return Ok(formats);
    }
}
```

**Arquivo Modificado:** `Media8.Infrastructure/Data/DbSeeder.cs`
- **Removido:** Seed de `Packages` (linhas 60-76) e `Orders` (linhas 78-104).
- **Mantido:** Seed de `VideoFormats` (7 formatos) e `Users` (4 usuários base).
- **Justificativa:** Garantir que o seed inicial seja leve e não dependa de relacionamentos complexos que podem falhar em migrations evolutivas.

**Commit Atômico:**
```bash
feat(api): adiciona endpoint publico para listagem do catalogo de formatos de video
fix(dbseeder): remove seed de pacotes e pedidos para evitar FK quebrada no primeiro boot
```

### Infraestrutura (Docker)

**Comandos Executados:**
```bash
docker compose up -d --build media8-api
docker logs media8-api --tail 50
curl http://localhost:5261/api/v1/video-formats
```

## 🎯 Impacto e Resultado

* **Container Estável:** `media8-api` roda em status `Up` sem restarts, com `DbSeeder` concluindo em menos de 2 segundos.
* **Endpoint Operacional:** `GET /api/v1/video-formats` retorna 7 formatos de vídeo (Reels Standard, Reels Premium, YouTube Curto, YouTube Médio, YouTube Longo, Pacote Reels, Avulso) com IDs únicos (Guids).
* **Contrato Validado:** Resposta JSON confirma que a API está usando `Guid VideoFormatId` ao invés de strings ou enums, validando toda a refatoração Data-Driven.
* **Frontend Habilitado:** O React agora tem um endpoint REST para consumir a lista dinâmica de formatos, permitindo a implementação de dropdowns, selects e validações baseadas no catálogo real do banco.

**Exemplo de Resposta da API:**
```json
[
  {
    "id": "17c4bb54-9aff-4df8-bd54-4b9dfd42d307",
    "name": "Reels Premium",
    "slug": "reels-premium",
    "maxDurationSeconds": 90,
    "tier": "Premium"
  },
  {
    "id": "8aca9ea1-73e8-4afa-b6e9-d8490d320d48",
    "name": "Reels Standard",
    "slug": "reels-standard",
    "maxDurationSeconds": 60,
    "tier": "Standard"
  }
]
```

---

**Nota do Desenvolvedor:**
*"Estabilizar um seed de banco de dados é tão crítico quanto escrever a lógica de negócio. Um seed que falha em cascata pode travar todo o pipeline de deploy e impedir testes. A decisão de simplificar o `DbSeeder` para focar em dados estruturais (Users, VideoFormats) e remover dados transacionais (Pedidos, Saldos) foi intencional: dados transacionais devem vir de migrations de dados ou da própria API, não de seeders de desenvolvimento. Isso garante que qualquer desenvolvedor, ao subir o projeto, tenha um ambiente limpo e funcional, pronto para testar as regras de negócio reais. O endpoint de `VideoFormats` é a cereja do bolo: ele valida que todo o esforço de refatoração (29 estudos de caso) resultou em uma API funcional, estável e pronta para o próximo capítulo: a integração com o Frontend."*
