# 071 - SettingsService: Inicialização de Cache e Eliminação de Fallback

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 26/05/2026

---

## 🚀 Desafio de Engenharia

O sistema de configurações dinâmicas (`SystemSettings`) estava com comportamento inconsistente: o cache do `SettingsService` não era carregado durante a inicialização da aplicação, fazendo com que o endpoint `/api/v1/admin/settings` retornasse um dicionão vazio `{"Settings":{}}`, mesmo o banco de dados PostgreSQL contendo o valor correto (ex: `CancellationWindowHours = "2"`).

Além disso, o método `GetSettingAsync` utilizava um **fallback** embutido (ex: `defaultValue = 24`), mascarando o problema e impedindo que o sistema "quebrasse" de forma visível, mas entregando valores desatualizados em relação ao banco de dados.

**Sintoma:**
- Frontend exibia "24h" (fallback) ao invés de "1h" ou "2h" (valor real no banco).
- A API respondia `200 OK` com payload vazio, falhando silenciosamente.

## 🧠 Estratégia da Solução

A solução focou em garantir a **integridade do dado na fonte**, eliminando a possibilidade de valores padrão (fallbacks) e forçando a inicialização síncrona do cache antes da aplicação aceitar requisições.

1.  **Inicialização Explícita:** O ciclo de vida da aplicação (`Program.cs`) foi alterado para chamar explicitamente `RefreshCacheAsync()` logo após o *seed* inicial, garantindo que o cache em memória seja populado com os dados do banco antes de qualquer requisição HTTP.
2.  **Falha Rápida (Fail-Fast):** Removido qualquer valor padrão (fallback). Se o cache não estiver carregado, o sistema deve lançar uma exceção clara, em vez de retornar um valor "chute".
3.  **Transparência:** Adicionados logs de inicialização para auditoria imediata do estado do cache.

## 🛠️ Implementação Técnica

### Backend (`media8-api`)

#### 1. Inicialização no Startup (`Program.cs`)
Inserida a chamada de inicialização do cache dentro do bloco de escopo de inicialização.

```csharp
// Program.cs
using (var scope = app.Services.CreateScope())
{
  var seeder = scope.ServiceProvider.GetRequiredService<Media8.Infrastructure.Data.DbSeeder>();
  await seeder.SeedAsync();
  
  // CRÍTICO: Carrega configurações do banco para a memória antes da API iniciar
  var settingsService = scope.ServiceProvider.GetRequiredService<Media8.Application.Interfaces.ISettingsService>();
  await settingsService.RefreshCacheAsync();
}
```

#### 2. Eliminação de Fallback (`SettingsService.cs`)
O método `GetSettingAsync` foi reescrito para lançar exceção se a chave não existir no cache, garantindo que nenhum valor padrão seja retornado silenciosamente.

```csharp
// Media8.Application/Services/SettingsService.cs
public async Task<T> GetSettingAsync<T>(string key, T defaultValue)
{
  // Falha rápida se o cache não foi inicializado
  if (!_cache.TryGetValue(key, out var value))
  {
    throw new InvalidOperationException(
      $"Setting '{key}' not found in cache. Cache was not properly initialized at startup."
    );
  }

  try
  {
    var converted = (T)Convert.ChangeType(value, typeof(T));
    return converted;
  }
  catch (Exception ex)
  {
    throw new InvalidOperationException(
      $"Failed to convert setting '{key}' value '{value}' to type {typeof(T).Name}", ex
    );
  }
}
```

#### 3. Log de Auditoria
Adicionado log explícito no `RefreshCacheAsync` para confirmar o carregamento.

```csharp
_logger.LogInformation(
  "✓ Settings cache loaded with {Count} settings: {Keys}", 
  newCache.Count, 
  string.Join(", ", newCache.Keys)
);
```

### Frontend (`media8-web`)
*Sem alterações nesta etapa específica de backend.* O frontend apenas se beneficia da correção, passando a receber o valor correto (`"2"` ou `"1"`) ao invés de `{}`.

## 🎯 Impacto e Resultado

* **Consistência de Dados:** O frontend agora reflete estritamente o valor armazenado no banco de dados (`SystemSettings`), eliminando discrepâncias entre o que está salvo e o que é exibido.
* **Fim do Silêncio:** O sistema não "engana" mais o usuário com valores padrão. Se o cache falhar, uma exceção clara é lançada, facilitando o diagnóstico.
* **Segurança de Estado:** Garante que a aplicação só fique disponível após carregar suas configurações críticas de negócio.

---

**Nota do Desenvolvedor:**
*A lição central aqui é que *Single Source of Truth* (Banco de Dados) só funciona se o estado da aplicação for explicitamente sincronizado na inicialização. Confiar em "valores padrão" no código é uma armadilha que gera dívida técnica invisível. Melhor quebrar na inicialização do que operar com dados errados.*
