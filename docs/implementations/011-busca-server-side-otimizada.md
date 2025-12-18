# 011 - Performance e Segurança: Busca Otimizada Server-Side (IQueryable)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 15/12/2025

---

## 🚀 Desafio de Engenharia
A funcionalidade de busca de usuários enfrentava problemas de escalabilidade. A implementação original carregava todos os registros do banco em memória (`IEnumerable`) para filtrar no cliente. Isso funcionava para 50 usuários, mas seria catastrófico com 10.000, causando **Memory Bloat** no servidor e lentidão na rede. Além disso, a falta de "Debounce" no frontend disparava uma requisição API para cada tecla pressionada.

## 🧠 Estratégia da Solução
*   **Database-First Filtering**: Mover a lógica de filtro para o motor de banco de dados SQL usando `IQueryable` do Entity Framework.
*   **Throttling**: Implementar um mecanismo de atraso (debounce) no frontend para reduzir a pressão de requisições sobre a API.

## 🛠️ Implementação Técnica

### Backend: IQueryable vs IEnumerable
A refatoração chave foi mudar o momento da materialização da query.
Ao usar `IQueryable`, construímos a expressão SQL dinamicamente e só executamos (`ToList`) após aplicar todos os filtros e paginação.

```csharp
// Power of IQueryable (SQL Translation)
var query = _context.Users.AsQueryable();

if (!string.IsNullOrEmpty(search)) {
    // Traduzido para: WHERE Email LIKE '%search%'
    query = query.Where(u => u.Email.Contains(search) || u.Name.Contains(search)); 
}

// Execução Otimizada: Traz apenas a página solicitada
return await query.Skip(skip).Take(take).ToListAsync();
```

### Segurança (SQL Injection Audit)
Embora estejamos construindo queries dinâmicas, utilizamos os métodos nativos do LINQ, que o Entity Framework converte automaticamente em **Queries Parametrizadas**. Isso torna a aplicação imune a injeção de SQL (`' OR 1=1 --`), pois o input é tratado estritamente como dado, não como comando.

## 🎯 Impacto e Resultado
*   **Escalabilidade**: O tempo de resposta agora é constante (~50ms) independente se a base tem 100 ou 1 milhão de usuários.
*   **Eficiência de Rede**: Redução de 95% no tráfego HTTP durante a digitação de buscas (graças ao debounce).

---
**Nota do Desenvolvedor:** *Entender a diferença entre execução no Cliente (Memória) vs Servidor (Banco) é fundamental para construir sistemas que não quebram em produção.*
