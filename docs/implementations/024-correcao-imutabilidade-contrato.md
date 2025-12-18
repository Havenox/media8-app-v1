# Correção de Imutabilidade de Contrato (Lista de Usuários)

## Problema
A lista de usuários exibe o **nome atual do pacote** em vez do **nome do contrato** (pacote no momento da atribuição).
Isso viola o princípio de imutabilidade, pois se o pacote original mudar de nome (ex: "Pacote A" -> "Pacote A Editado"), os usuários antigos não deveriam ver essa mudança, pois contrataram "Pacote A".

## Diagnóstico
O controlador `UsersController.cs` mapeia o DTO de usuário (`AdminUserDto`) acessando diretamente a propriedade de navegação `Package`:

```csharp
// Código Atual (Bug)
dto.ActivePackage = new ActivePackageSummary
{
    Name = activeAssignment.Package.Name, // Busca o nome dinâmico atual
    // ...
};
```

## Solução Técnica
A entidade `PackageAssignment` já possui propriedades de "Snapshot" para garantir a imutabilidade do contrato.
A propriedade correta a ser utilizada é `SnapshotPackageName`.

### Alterações no Backend (`UsersController.cs`)
Alterar o mapeamento para priorizar o snapshot:

```csharp
// Código Corrigido
dto.ActivePackage = new ActivePackageSummary
{
    // Usa o snapshot (contrato). Se nulo (legado), usa o nome atual.
    Name = activeAssignment.SnapshotPackageName ?? activeAssignment.Package?.Name ?? "Unknown Package",
    
    // Mesma lógica para quantidade de vídeos, se aplicável
    VideoQuantity = activeAssignment.SnapshotVideoQuantity ?? activeAssignment.Package?.VideoQuantity ?? 0,
    // ...
};
```

Isso garante que o usuário veja exatamente o que contratou.
