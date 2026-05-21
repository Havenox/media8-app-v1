# 050 - Backend: Correção de Duplicidade de DTO em VideoFormatsController

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

**Problema:** Durante a implementação da Fase 2 (deleção condicional em Formatos e Estilos), o build falhou com erro CS0117: `"VideoFormatResponse" não contém uma definição para "IsActive"`. O erro persistiu mesmo após limpeza e rebuild do projeto.

**Sintoma:** Compilador reportava que as propriedades `IsActive` e `CanDeletePermanently` não existiam em `VideoFormatResponse`, apesar de estarem presentes no arquivo `VideoFormatDtos.cs`.

**Causa Raiz:** Uma declaração **duplicada e local** da classe `VideoFormatResponse` existia no rodapé do arquivo `VideoFormatsController.cs` (linhas 217-224), fazendo shadowing da classe global definida em `Media8.Application.DTOs.Services`.

## 🧠 Estratégia da Solução

**Abordagem:** Remover a declaração duplicada do controller, garantindo que o arquivo use exclusivamente o DTO da camada de aplicação.

**Lição:** Classes DTO nunca devem ser declaradas dentro de controllers. Isso viola o princípio de responsabilidade única e causa conflitos de namespace.

## 🛠️ Implementação Técnica

### Antes (Com Erro)

**VideoFormatsController.cs (linhas 217-224):**
```csharp
public class VideoFormatResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int MaxDurationSeconds { get; set; }
    public Guid? EditingStyleId { get; set; }
    // ❌ Faltam: IsActive, CanDeletePermanently
}
```

### Depois (Corrigido)

**VideoFormatsController.cs:**
- Removido bloco duplicado (linhas 217-224)
- Controller agora usa `Media8.Application.DTOs.Services.VideoFormatResponse`
- DTO correto contém `IsActive` e `CanDeletePermanently`

**VideoFormatDtos.cs (correto):**
```csharp
public class VideoFormatResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int MaxDurationSeconds { get; set; }
    public Guid? EditingStyleId { get; set; }
    public bool IsActive { get; set; }
    public bool CanDeletePermanently { get; set; }
}
```

## 🎯 Impacto e Resultado

* **Build:** ✅ 0 erros, 11 warnings (CS8602, CS8604 - nullable reference)
* **Testes:** ✅ 10/10 passando (100%)
* **Consistência:** DTOs centralizados em `Media8.Application.DTOs.Services`
* **Manutenibilidade:** Fim do shadowing de classes

---

**Nota do Desenvolvedor:**

*Este é um erro clássico de "classe aninhada acidental". Quando um arquivo de controller declara uma classe com mesmo nome de um DTO existente, o compilador C# prioriza a declaração mais próxima (no mesmo arquivo), causando shadowing. A solução é sempre manter DTOs em arquivos dedicados no projeto de Application, nunca dentro de controllers.*

**Boa Prática:**
```csharp
// ❌ ERRADO: DTO dentro do controller
public class VideoFormatsController { ... }
public class VideoFormatResponse { ... } // Fora!

// ✅ CERTO: DTO em arquivo dedicado
// Media8.Application/DTOs/Services/VideoFormatDtos.cs
public class VideoFormatResponse { ... }
```

**Próximo Passo:** Replicar padrão de deleção condicional para `EditingStylesController` (já implementado, aguardando frontend).
