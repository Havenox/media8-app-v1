# Investigação: Cálculo de Datas de Validade e Expiração

## Problema Relatado
O usuário relatou inconsistência nas datas de expiração dos pacotes.
- **Cenário:** Pacote com validade de 30 dias é editado para 60 dias.
- **Expectativa:** Novas atribuições deveriam expirar em 60 dias.
- **Realidade:** Novas atribuições continuam expirando em 30 dias (ex: 16/01/2026 para uma atribuição em 17/12/2025).

## Análise do Código (Fluxo Completo)

### 1. Definição do Pacote (Frontend -> Backend Update)
O fluxo de atualização do pacote parece correto:
*   **Frontend (`PackagesPage.tsx`):** O campo "Validade (dias)" é capturado corretamente no estado `newPackage.validityDays` e enviado como `validityDays` no payload JSON.
*   **DTO (`UpdatePackageRequest.cs`):** Possui a propriedade `public int? ValidityDays { get; set; }`, mapeando corretamente o JSON.
*   **Controller (`PackagesController.Update`):** Verifica se o valor foi enviado e atualiza a entidade:
    ```csharp
    if (request.ValidityDays.HasValue) package.ValidityDays = request.ValidityDays;
    ```
*   **Persistência:** O repositório salva as alterações no banco.

### 2. Atribuição do Pacote (Atribuição -> Cálculo da Data)
A lógica de criação da atribuição (`PackageAssignmentsController.Create`) é explícita:
```csharp
// 1. Busca o pacote no banco (deveria trazer o valor atualizado, ex: 60)
var package = await _packageRepository.GetByIdAsync(request.PackageId);

// 2. Calcula a expiração
DateTime? expiresAt = null;
if (package.ValidityDays.HasValue && package.ValidityDays.Value > 0)
{
    // Adiciona X dias à data atual UTC
    expiresAt = DateTime.UtcNow.AddDays(package.ValidityDays.Value);
}

// 3. Salva no banco (Snapshot)
var assignment = new PackageAssignment { ExpiresAt = expiresAt, ... };
```

Se a data resultante é sempre +30 dias, a única conclusão lógica é que `package.ValidityDays` **ainda está retornando 30** do banco de dados no momento da atribuição.

## Hipóteses Prováveis

1.  **Falha Silenciosa na Edição:** A requisição `PUT /packages/{id}` pode não estar enviando o campo `validityDays` corretamente (ex: enviando `null` ou `0` se o campo foi limpo indevidamente), ou o Backend não está persistindo por algum outro erro de validação não notado.
    *   *Contra-ponto:* O usuário relatou que o nome do pacote mudou ("MODIFICADO"), indicando que o Update ocorreu com sucesso pelo menos para o Nome.

2.  **Erro de Cache (Menos provável no Backend):** Se o Entity Framework estiver mantendo uma versão "cacheada" do Pacote na memória do processo (mas como o escopo é por requisição, isso é improvável a menos que haja algum mecanismo de cache distribuído ou Singleton services envolvidos).

3.  **Confusão de Pacotes:** O pacote "MODIFICADO" atribuído pode não ser o mesmo pacote que foi editado (ex: criação de um novo pacote em vez de edição, mas atribuição do antigo).

## Recomendações e Próximos Passos

Para solucionar definitivamente, propomos adicionar **Logs de Diagnóstico** no Backend para rastrear os valores exatos sendo processados.

### Ação 1: Adicionar Logs no `PackageAssignmentsController`
Inserir logs para ver o que o backend está "enxergando":
```csharp
_logger.LogInformation($"Atribuindo Pacote ID: {package.Id}. ValidityDays no DB: {package.ValidityDays}");
_logger.LogInformation($"Data de Expiração Calculada: {expiresAt}");
```

### Ação 2: Verificação Manual (Frontend)
No navegador (Chrome DevTools -> Network), ao editar o pacote:
1.  Filtrar por "Fetch/XHR".
2.  Clicar em "Salvar Alterações".
3.  Inspecionar o request `PUT`.
4.  Confirmar na aba **Payload** se `validityDays: 60` está sendo enviado.

### Ação 3: Verificação de Banco de Dados
Se possível, consultar diretamente o banco:
```sql
SELECT Name, ValidityDays FROM Packages WHERE Name LIKE '%Bolicho%';
```
Isso confirmará se o valor 60 está de fato salvo.
