# 058 - Configurações Dinâmicas: Implementação Completa do Sistema

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 22/05/2026

---

## 🚀 Desafio de Engenharia

O sistema de pedidos possuía regras de negócio críticas **hardcoded** no código-fonte, especificamente a **Janela de Cancelamento de Pedidos** (fixada em 24h). Isso gerava os seguintes problemas:

1. **Rigidez Operacional**: Qualquer ajuste na regra de negócio (ex: mudar de 24h para 48h) exigia **deploy de código**, recompilação do backend e downtime da aplicação.
2. **Falta de Transparência**: Admins não tinham visibilidade de qual era o prazo atual sem consultar o código ou documentação técnica.
3. **Impossibilidade de Testes A/B**: Não era possível testar diferentes janelas de cancelamento para diferentes clientes ou períodos.
4. **Conflito de Ciclo de Vida**: A necessidade de cache em memória (Singleton) conflita com repositórios EF Core (Scoped), exigindo solução arquitetural específica.

**Problema Central**: Como permitir que admins gerenciem regras de negócio críticas (como prazo de cancelamento) sem tocar no código, mantendo performance (cache) e segurança (validações), e resolvendo o conflito Singleton vs Scoped?

## 🧠 Estratégia da Solução

A solução adota o **Padrão de Configuração Dinâmica com Injeção de Escopo** através de 4 fases:

1. **Fase 1 - Core**: Entidade `SystemSetting`, Migration, `ISettingsService` com cache `ConcurrentDictionary`
2. **Fase 2 - API**: `AdminSettingsController` com GET/PATCH protegidos por RBAC
3. **Fase 3 - Integração**: `OrderService` consome `SettingsService` para validação dinâmica
4. **Fase 4 - UI**: `AdminSettingsSection` na SettingsPage com feedback visual
5. **Fase 5 - Persistência**: `IServiceScopeFactory` para resolver conflito Singleton/Scoped

**Decisão Arquitetural Crítica**: 
- `SettingsService` é **Singleton** para performance (cache em memória)
- `IRepository<T>` é **Scoped** (vida útil da requisição)
- Solução: Usar `IServiceScopeFactory` para criar escopos temporários dentro do Singleton quando precisar persistir no banco.

## 🛠️ Implementação Técnica

### Fase 1: Backend Core (Domínio e Serviço)

**Entidade `SystemSetting.cs`:**
```csharp
public class SystemSetting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Key { get; set; } = string.Empty; // ex: "CancellationWindowHours"
    public string Value { get; set; } = string.Empty; // ex: "24"
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

**Migration `AddSystemSettings`:**
- Cria tabela `SystemSettings` com colunas `Id`, `Key`, `Value`, `Description`, `CreatedAt`, `UpdatedAt`
- Índice único em `Key` para busca rápida
- Seed inicial: `CancellationWindowHours` = "24"

**SettingsService (Singleton com Cache ConcurrentDictionary):**
```csharp
public class SettingsService : ISettingsService
{
    private readonly ConcurrentDictionary<string, string> _cache = new();
    private readonly IServiceScopeFactory _scopeFactory;
    
    public async Task<T> GetSettingAsync<T>(string key, T defaultValue)
    {
        // Leitura do cache (O(1))
        if (_cache.TryGetValue(key, out var value))
            return (T)Convert.ChangeType(value, typeof(T));
        
        return defaultValue;
    }
    
    public async Task SetSettingAsync(string key, string value)
    {
        // Cria escopo temporário para resolver IRepository (Scoped)
        using var scope = _scopeFactory.CreateScope();
        var repository = scope.ServiceProvider
            .GetRequiredService<IRepository<SystemSetting>>();
        
        // Persiste no banco
        var setting = await repository.FindAsync(s => s.Key == key);
        if (setting != null) { /* Update */ }
        else { /* Insert */ }
        
        // Atualiza cache apenas se DB succeeded
        _cache[key] = value;
    }
}
```

### Fase 2: Backend API (Admin Controller)

**Controller `AdminSettingsController.cs`:**
```csharp
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/admin/settings")]
public class AdminSettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    
    [HttpGet]
    public async Task<ActionResult<SystemSettingsResponse>> GetAllSettings()
    {
        var settings = await _settingsService.GetAllSettingsAsync();
        return Ok(new SystemSettingsResponse { Settings = settings });
    }
    
    [HttpPatch]
    public async Task<ActionResult<UpdateSettingsResponse>> UpdateSetting(UpdateSettingsRequest request)
    {
        await _settingsService.SetSettingAsync(request.Key, request.Value);
        return Ok(new { Key = request.Key, Value = request.Value, Message = "Sucesso" });
    }
}
```

### Fase 3: Integração de Regra (OrderService)

**OrderService.cs - Validação Dinâmica:**
```csharp
public class OrderService : IOrderService
{
    private readonly ISettingsService _settingsService;
    
    public async Task<OrderResponse> CancelOrderAsync(Guid orderId)
    {
        var order = await _orderRepository.GetByIdAsync(orderId);
        
        // Valida janela de tempo dinâmica
        var cancellationWindowHours = await _settingsService
            .GetSettingAsync<int>("CancellationWindowHours", 24);
        var timeSinceCreation = DateTime.UtcNow - order.CreatedAt;
        
        if (timeSinceCreation.TotalHours > cancellationWindowHours)
        {
            throw new InvalidOperationException(
                $"Tempo limite excedido. Pedido criado há {timeSinceCreation.TotalHours:F1}h, " +
                $"limite é {cancellationWindowHours}h.");
        }
        
        // Restante da lógica de cancelamento...
    }
}
```

### Fase 4: Frontend Admin (SettingsPage)

**Componente `AdminSettingsSection.tsx`:**
```typescript
const AdminSettingsSection: React.FC = () => {
  const { user } = useAuth();
  const { data: settingsData } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get('/admin/settings'),
  });
  
  const updateMutation = useMutation({
    mutationFn: (data) => api.patch('/admin/settings', data),
    onSuccess: () => queryClient.invalidateQueries(['admin', 'settings']),
  });
  
  if (user?.role !== 'Admin') return null;
  
  return (
    <Card>
      <Input
        value={settingsData?.settings['CancellationWindowHours'] || '24'}
        onChange={(e) => updateMutation.mutate({
          key: 'CancellationWindowHours',
          value: e.target.value
        })}
      />
      <Button onClick={handleSave}>Salvar Alterações</Button>
    </Card>
  );
};
```

### Fase 5: Persistência com IServiceScopeFactory

**Resolvendo Conflito Singleton/Scoped:**
```csharp
public class SettingsService(
    ILogger<SettingsService> logger,
    IServiceScopeFactory scopeFactory) : ISettingsService
{
    public async Task SetSettingAsync(string key, string value)
    {
        // Cria escopo temporário para resolver repositório
        using var scope = _scopeFactory.CreateScope();
        var repository = scope.ServiceProvider
            .GetRequiredService<IRepository<SystemSetting>>();
        
        // Persiste no banco dentro do escopo
        var setting = await repository.FindAsync(s => s.Key == key);
        if (setting != null)
        {
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
            await repository.UpdateAsync(setting);
        }
        else
        {
            await repository.AddAsync(new SystemSetting 
            { 
                Key = key, 
                Value = value,
                Description = key,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        
        // Atualiza cache apenas se DB succeeded
        _cache[key] = value;
    }
}
```

## 🎯 Impacto e Resultado

* **Flexibilidade Operacional**: Admins podem ajustar `CancellationWindowHours` (e futuras configurações) em tempo real, sem deploy, via UI ou API.
* **Performance O(1)**: Cache `ConcurrentDictionary` em memória garante acesso ultrarrápido às configurações, evitando queries no banco a cada requisição.
* **Segurança**: Endpoints protegidos por RBAC (`[Authorize(Roles = "Admin")]`), apenas Admins podem alterar configurações.
* **Consistência**: Cache e banco sempre sincronizados. Atualização do cache ocorre apenas após persistência bem-sucedida no banco.
* **Escalabilidade**: Padrão aplicável a N configurações (ex: `MaxOrdersPerClient`, `SubscriptionDiscountRate`, etc.).
* **Resolução de Conflito**: `IServiceScopeFactory` permite que Singleton acesse serviços Scoped sem violar regras de ciclo de vida.

---

**Nota do Desenvolvedor:** 
A decisão de usar **Singleton com IServiceScopeFactory** foi intencional: configurações do sistema são lidas milhares de vezes por hora, mas escritas raramente (uma vez por semana/mês). O trade-off é que, em cenários de alta disponibilidade (múltiplas instâncias da API), cada instância terá seu próprio cache. Para a maioria dos casos, isso é aceitável. Se precisarmos de cache distribuído, a migração para **Redis** seria trivial (trocar `ConcurrentDictionary` por `IDistributedCache`). A entidade `SystemSetting` foi desenhada para ser genérica o suficiente para suportar qualquer configuração futura sem mudanças no schema. O uso de `IServiceScopeFactory` é uma solução elegante para o problema Singleton/Scoped, mas deve ser usada com moderação para não criar escopos em excesso e degradar a performance.
