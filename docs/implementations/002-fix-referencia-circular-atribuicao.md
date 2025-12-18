# 002 - Desempenho e Estabilidade: Resolução de Referência Circular via DTO Pattern

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 13/12/2025

---

## 🚀 Desafio de Engenharia
Durante a operação de atribuição de pacotes, a aplicação enfrentou um erro crítico de **Stack Overflow** (HTTP 500). O Entity Framework, ao carregar as relações de navegação (`Assignment -> Package -> Assignments -> ...`), criava um grafo de objetos infinito. O serializador JSON padrão tentava percorrer esse grafo recursivamente, derrubando a thread de resposta e causando timeout/crash no servidor.

## 🧠 Estratégia da Solução
A solução adotada foi a implementação rigorosa do **Padrão DTO (Data Transfer Object)**.
Em vez de tentar configurar o serializador para "ignorar ciclos" (o que é apenas um band-aid e pode ocultar dados necessários), optei por projetar objetos de resposta específicos para a API. Isso desacopla o Modelo de Domínio (Entidades do Banco) do Contrato de API.

## 🛠️ Implementação Técnica

### Backend (.NET API)
*   **Criação de DTOs**: Definição da classe `PackageAssignmentDto`, contendo apenas tipos primitivos e estruturas planas necessárias para o Frontend.
*   **Mapeamento Explícito**: Substituição do retorno direto do EF Core por uma projeção `.Select(x => new DTO { ... })`. Isso otimiza a query SQL, trazendo do banco apenas as colunas necessárias, reduzindo o I/O de rede e memória.

```csharp
// Antes (Problemático)
return await _context.Assignments.Include(a => a.Package).ToListAsync();

// Depois (Otimizado)
return await _context.Assignments
    .Select(a => new PackageAssignmentDto { 
        Id = a.Id, 
        PackageName = a.Package.Name 
    })
    .ToListAsync();
```

## 🎯 Impacto e Resultado
*   **Performance**: Redução drástica no tamanho do Payload JSON (de ~50kb com redundâncias para ~2kb).
*   **Estabilidade**: Eliminação completa dos erros 500 no módulo de atribuições.
*   **Segurança**: Prevenção de vazamento acidental de dados internos da entidade que não deveriam ser expostos via API.

---
**Nota do Desenvolvedor:** *Este incidente reforçou a política de "No Entities in API Layer" no projeto, tornando-se uma diretriz arquitetural para os próximos módulos.*
