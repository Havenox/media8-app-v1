# 009 - Automação de Infra: Bulk Seeder Otimizado (Performance O(1))

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 14/12/2025

---

## 🚀 Desafio de Engenharia
Para testes de carga e desenvolvimento, era necessário popular o banco com milhares de usuários. O script inicial demorava **minutos** para processar 1.000 registros, pois executava uma verificação de existência (`SELECT * FROM Users WHERE Email = ...`) para cada linha do JSON, resultando em 1.000 _round-trips_ ao banco de dados (Problema N+1 de inserção).

## 🧠 Estratégia da Solução
Otimização algorítmica usando **Memory Cache** e **Batch Processing**.
Transformamos uma operação linear de I/O de disco em uma operação de verificação em memória de tempo constante O(1).

## 🛠️ Implementação Técnica

### Cache de Pré-Carregamento (HashSet)
Em vez de ir ao banco 1.000 vezes, fazemos **uma** consulta única buscando apenas os emails existentes e armazenamos em um `HashSet`.
```csharp
// Busca Única (Otimizada)
var existingEmails = new HashSet<string>(await _context.Users.Select(u => u.Email).ToListAsync());

foreach (var user in jsonUsers) {
    // Verificação Instantânea em Memória O(1)
    if (!existingEmails.Contains(user.Email)) {
        _context.Add(user);
    }
}
```

### Segurança (Circuit Breaker)
Implementação de flag mandatória via variável de ambiente (`SEED_USERS_FROM_JSON=true`). Sem essa flag explícita no Docker, o código do Seeder aborta a execução, prevenindo acidentes em produção.

## 🎯 Impacto e Resultado
*   **Performance Absoluta**: O tempo de seeding caiu de **~240 segundos** para **< 2 segundos**.
*   **Developer Experience (DX)**: Permite aos desenvolvedores resetar e popular o ambiente instantaneamente, acelerando ciclos de teste.

---
**Nota do Desenvolvedor:** *Entender Estruturas de Dados (HashSet vs List) e custo de I/O é o que diferencia scripts lentos de ferramentas de alta performance.*
