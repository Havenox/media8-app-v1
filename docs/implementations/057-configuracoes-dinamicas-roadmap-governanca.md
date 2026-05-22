# 057 - Configurações Dinâmicas: Roadmap de Governança de Regras de Negócio

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 21/05/2026

---

## 🚀 Desafio de Engenharia

O sistema de pedidos possuía regras de negócio críticas **hardcoded** no código-fonte, especificamente a **Janela de Cancelamento de Pedidos** (atualmente fixada em 24h). Isso gerava os seguintes problemas:

1. **Rigidez Operacional**: Qualquer ajuste na regra de negócio (ex: mudar de 24h para 48h) exigia **deploy de código**, recompilação do backend e downtime da aplicação.
2. **Falta de Transparência**: Admins não tinham visibilidade de qual era o prazo atual sem consultar o código ou documentação técnica.
3. **Impossibilidade de Testes A/B**: Não era possível testar diferentes janelas de cancelamento para diferentes clientes ou períodos.
4. **Acoplamento Técnico**: A lógica de negócio estava espalhada entre `OrderService` e constantes mágicas, violando o princípio Single Responsibility.

**Problema Central**: Como permitir que admins gerenciem regras de negócio críticas (como prazo de cancelamento) sem tocar no código, mantendo performance (cache) e segurança (validações)?

## 🧠 Estratégia da Solução

A solução adota o **Padrão de Configuração Dinâmica** com as seguintes premissas arquiteturais:

1. **Entidade `SystemSetting`**: Tabela no banco para armazenar pares chave-valor (`Key`, `Value`) com tipagem forte.
2. **Singleton Cache**: `SettingsService` carrega todas as configurações na inicialização da API (startup) e mantém em memória (`IMemoryCache`), garantindo acesso O(1) a cada requisição.
3. **Invalidação Atualizável**: Ao atualizar uma configuração via API Admin, o cache é invalidado e recarregado automaticamente.
4. **Injeção de Dependência**: `OrderService` consome `ISettingsService` para consultar `CancellationWindowHours` dinamicamente ao invés de constante fixa.
5. **Segurança**: Apenas usuários com role `Admin` podem acessar endpoints de escrita (`PATCH`).

**Roadmap de Implementação (4 Fases):**

| Fase | Escopo | Entregáveis |
|------|--------|-------------|
| **Fase 1** | Backend Core | Entidade `SystemSetting`, Migration, `ISettingsService` com cache Singleton |
| **Fase 2** | Backend API | `AdminSettingsController` com `GET` e `PATCH` |
| **Fase 3** | Integração de Regra | `OrderService` usa `SettingsService` para validar cancelamento |
| **Fase 4** | Frontend Admin | `SettingsPage.tsx` com lista de configurações e botão "Salvar" |

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
- Seed inicial: `CancellationWindowHours` = "24"

**Interface `ISettingsService.cs`:**
```csharp
public interface ISettingsService
{
    Task<T> GetSettingAsync<T>(string key, T defaultValue);
    Task SetSettingAsync(string key, string value);
    Task<Dictionary<string, string>> GetAllSettingsAsync();
}
```

**Implementação `SettingsService.cs` (Singleton com Cache):**
```csharp
public class SettingsService : ISettingsService
{
    private readonly IRepository<SystemSetting> _repository;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SettingsService> _logger;

    public SettingsService(
        IRepository<SystemSetting> repository,
        IMemoryCache cache,
        ILogger<SettingsService> logger)
    {
        _repository = repository;
        _cache = cache;
        _logger = logger;
    }

    public async Task<T> GetSettingAsync<T>(string key, T defaultValue)
    {
        // Tenta obter do cache
        if (_cache.TryGetValue(key, out var cachedValue))
        {
            return (T)cachedValue;
        }

        // Fallback: busca no banco e atualiza cache
        var setting = await _repository.FindAsync(s => s.Key == key);
        var result = setting.FirstOrDefault()?.Value ?? defaultValue.ToString();
        
        _cache.Set(key, result, TimeSpan.FromHours(1));
        return (T)Convert.ChangeType(result, typeof(T));
    }

    public async Task SetSettingAsync(string key, string value)
    {
        var settings = await _repository.FindAsync(s => s.Key == key);
        var setting = settings.FirstOrDefault();
        
        if (setting != null)
        {
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(setting);
        }
        else
        {
            // Cria nova se não existir
            await _repository.AddAsync(new SystemSetting 
            { 
                Key = key, 
                Value = value,
                Description = key
            });
        }

        // Atualiza cache
        _cache.Set(key, value, TimeSpan.FromHours(1));
        _logger.LogInformation("Configuração {Key} atualizada para {Value}", key, value);
    }

    public async Task<Dictionary<string, string>> GetAllSettingsAsync()
    {
        var allSettings = await _repository.GetAllAsync();
        return allSettings.ToDictionary(s => s.Key, s => s.Value);
    }
}
```

### Fase 2: Backend API (Admin Controller)

**Controller `AdminSettingsController.cs`:**
```csharp
[Authorize]
[ApiController]
[Route("api/v1/admin/settings")]
public class AdminSettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly IAuthService _authService;

    public AdminSettingsController(ISettingsService settingsService, IAuthService authService)
    {
        _settingsService = settingsService;
        _authService = authService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Dictionary<string, string>>> GetAllSettings()
    {
        var settings = await _settingsService.GetAllSettingsAsync();
        return Ok(settings);
    }

    [HttpPatch]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateSetting(UpdateSettingRequest request)
    {
        await _settingsService.SetSettingAsync(request.Key, request.Value);
        return Ok(new { message = $"Configuração {request.Key} atualizada" });
    }
}

public class UpdateSettingRequest
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
```

### Fase 3: Integração de Regra (OrderService)

**`OrderService.cs` - Validação Dinâmica:**
```csharp
public async Task<OrderResponse> CancelOrderAsync(Guid orderId)
{
    var order = await _orderRepository.GetByIdAsync(orderId)
        ?? throw new InvalidOperationException("Pedido não encontrado.");

    // Valida estado
    if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.Pending)
        throw new InvalidOperationException("Pedido não pode ser cancelado.");

    // Valida janela de tempo via SettingsService
    var cancellationWindowHours = await _settingsService.GetSettingAsync<int>("CancellationWindowHours", 24);
    var timeSinceCreation = DateTime.UtcNow - order.CreatedAt;
    
    if (timeSinceCreation.TotalHours > cancellationWindowHours)
    {
        throw new InvalidOperationException(
            $"Tempo limite excedido. Pedido criado há {timeSinceCreation.Hours}h, limite é {cancellationWindowHours}h.");
    }

    // Estorna saldo (lógica existente)
    if (order.ServiceBalanceLotId.HasValue)
    {
        var balanceLot = await _balanceRepository.GetByIdAsync(order.ServiceBalanceLotId.Value);
        if (balanceLot != null)
        {
            if (balanceLot.ExpiresAt.HasValue && balanceLot.ExpiresAt < DateTime.UtcNow)
            {
                balanceLot.ExpiresAt = DateTime.UtcNow.AddDays(30);
            }
            balanceLot.RemainingQuantity += 1;
            await _balanceRepository.UpdateAsync(balanceLot);
        }
    }

    order.Status = OrderStatus.Cancelled;
    order.UpdatedAt = DateTime.UtcNow;
    await _orderRepository.UpdateAsync(order);

    return MapToResponse(order);
}
```

### Fase 4: Frontend Admin (SettingsPage)

**Página `admin/SettingsPage.tsx`:**
```typescript
const SettingsPage: React.FC = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();

  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    await Promise.all(
      Object.entries(localSettings).map(([key, value]) =>
        updateSetting.mutateAsync({ key, value })
      )
    );
    toast.success('Configurações salvas!');
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(localSettings).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <Label>{key}</Label>
            <Input
              value={value}
              onChange={(e) =>
                setLocalSettings(prev => ({ ...prev, [key]: e.target.value }))
              }
            />
          </div>
        ))}
        <Button onClick={handleSave} disabled={updateSetting.isPending}>
          Salvar Alterações
        </Button>
      </CardContent>
    </Card>
  );
};
```

## 🎯 Impacto e Resultado

* **Flexibilidade Operacional**: Admins podem ajustar `CancellationWindowHours` (e futuras configurações) em tempo real, sem deploy.
* **Performance**: Cache em memória garante acesso O(1) às configurações, evitando queries no banco a cada requisição.
* **Segurança**: Endpoints protegidos por RBAC (`[Authorize(Roles = "Admin")]`).
* **Manutenibilidade**: Regras de negócio desacopladas do código, facilitando testes e evolução.
* **Escalabilidade**: Padrão aplicável a outras configurações (ex: `MaxOrdersPerClient`, `SubscriptionDiscountRate`).

---

**Nota do Desenvolvedor:** 
A decisão de usar **Singleton com IMemoryCache** foi intencional: configurações do sistema são lidas milhares de vezes por hora, mas escritas raramente (uma vez por semana/mês). O trade-off é que, em cenários de alta disponibilidade (múltiplas instâncias da API), cada instância terá seu próprio cache. Para a maioria dos casos, isso é aceitável. Se precisarmos de cache distribuído, a migração para **Redis** seria trivial (trocar `IMemoryCache` por `IDistributedCache`). A entidade `SystemSetting` foi desenhada para ser genérica o suficiente para suportar qualquer configuração futura sem mudanças no schema.
