# 046 - Backend: Validação de VideoFormatId Obrigatório e Log de Auditoria em Ofertas

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

**Problema:** Mesmo com o frontend agora exigindo a seleção de `VideoFormatId`, o backend ainda aceitava requisições de criação de ofertas com `VideoFormatId` nulo ou vazio via API direta. Isso permitia que dados incompletos chegassem ao banco de dados, fazendo o provisionamento de saldos falhar silenciosamente.

**Sintoma:** Ofertas criadas sem formato de vídeo resultavam em contratos de clientes sem saldos provisionados, quebrando o fluxo principal de consumo de créditos.

**Causa Raiz:** DTO `CreateOfferRequest` tratava `VideoFormatId` como `Guid?` (nullable) sem validação `[Required]`, permitindo que requisições mal-formadas fossem processadas.

## 🧠 Estratégia da Solução

**Abordagem:** Defesa em profundidade (defense in depth) em duas camadas:

1. **Camada 1: Validação de DTO** - Tornar `VideoFormatId` obrigatório via data annotations
2. **Camada 2: Log de Auditoria** - Se alguma exceção passar, registrar warning claro para diagnóstico

**Decisões de Design:**
- **Breaking Change Intencional:** Mudar de `Guid?` para `Guid` força consumidores de API a corrigirem payloads
- **Log Estruturado:** Warning inclui IDs de contrato, cliente e oferta para rastreabilidade
- **Não Quebrar Fluxo:** Manter `return` silencioso no provisionamento, mas com log para auditoria

## 🛠️ Implementação Técnica

### 1. Validação no DTO (`OfferDtos.cs`)

**Antes (Opcional):**
```csharp
/// <summary>
/// ID do formato de vídeo associado à oferta
/// </summary>
public Guid? VideoFormatId { get; set; }
```

**Depois (Obrigatório):**
```csharp
/// <summary>
/// ID do formato de vídeo associado à oferta
/// </summary>
[Required(ErrorMessage = "O formato de vídeo associado à oferta é obrigatório.")]
public Guid VideoFormatId { get; set; }
```

**Impacto:**
- ModelState do ASP.NET rejeita requisições sem `VideoFormatId`
- Retorna `400 Bad Request` com mensagem clara
- TypeScript do frontend já estava enviando como `string | undefined`, compatível

### 2. Log de Auditoria (`ServiceBalanceService.cs`)

**Adicionado:**
- Import: `using Microsoft.Extensions.Logging;`
- Injeção de dependência: `ILogger<ServiceBalanceService>`
- Log warning no provisionamento:

```csharp
if (videoFormatId == Guid.Empty)
{
    _logger.LogWarning(
        "⚠️  PROVISIONAMENTO PULADO: Contrato {ContractId} do cliente {ClientId} sem VideoFormatId. Oferta: {OfferName} (ID: {OfferId}). Verifique se o frontend está enviando o formato selecionado.",
        contract.Id,
        contract.ClientId,
        offer.Name,
        offer.Id
    );
    
    return;
}
```

**Benefícios:**
- Rastreabilidade completa: IDs de contrato, cliente e oferta
- Mensagem em português para facilitar diagnóstico
- Emoji `⚠️` destaca visualmente em logs coloridos (Seq, Application Insights)

### 3. Pacote NuGet Adicionado

`Media8.Application.csproj`:
```xml
<PackageReference Include="Microsoft.Extensions.Logging.Abstractions" Version="10.0.1" />
```

## 🎯 Impacto e Resultado

* **Validação Forte:** Impossível criar oferta sem `VideoFormatId` via API
* **Auditoria:** Logs claros para diagnosticar falhas de provisionamento
* **Quebra Controlada:** Breaking change documentada e justificada
* **10 Testes:** Suíte de integração passando (100% green)

---

**Nota do Desenvolvedor:**

*Esta é a última peça do quebra-cabeça iniciado no estudo de caso #043 (Roadmap). Com esta validação, o ciclo está completo: Frontend obriga seleção → Backend valida → Provisionamento cria saldos → Cliente visualiza e consome. O log de warning é intencionalmente verboso: em produção, se um admin somehow contornar o frontend e criar oferta sem formato via API direta, o log fornecerá o rastro de auditoria necessário para investigação. A validação de DTO é a "porta da frente"; o log é a "câmera de segurança".*

**Lição Arquitetural:** Validação em múltiplas camadas (frontend + backend) não é redundância — é defesa em profundidade. O frontend protege usuários; o backend protege contra APIs maliciosas ou bugs.

**Roadmap Concluído:** ✅
- Fase 0: CRUD Editing Styles
- Fase 1: Hooks + Service + UI
- Fase 2: Seletores em Ofertas
- Fase 3: Validação Backend + Log
