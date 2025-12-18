# 008 - Otimização de Queries: Estatísticas Agregadas em Tempo Real (Server-Side)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 14/12/2025

---

## 🚀 Desafio de Engenharia
O dashboard administrativo exibia contadores (Total de Usuários, Admins, Clientes) baseados incorretamente na lista paginada do frontend. Com a paginação de 20 itens, os cards mostravam "20" em vez do total real (ex: "1500").
Trazer **todos** os objetos de usuário do banco apenas para contar `.length` no Javascript seria desastroso para a memória do servidor e banda de rede.

## 🧠 Estratégia da Solução
Mover a responsabilidade da agregação para o Banco de Dados (Database Engine), que é otimizado para operações de contagem (`COUNT`), e criar um endpoint leve dedicado apenas para metadados.

## 🛠️ Implementação Técnica

### Backend (SQL Optimization)
Em vez de serializar objetos, o ORM executa queries de agregação puras.

```csharp
// Extremamente Rápido (Query SQL: SELECT COUNT(*) FROM Users WHERE Role = 'Admin')
var adminCount = await _repository.CountAsync(u => u.Role == Roles.Admin);
```
O payload de resposta JSON é minúsculo (apenas 4 inteiros), em vez de megabytes de dados de usuários.

### Frontend (User Experience)
*   **Skeleton Loading**: Enquanto o cálculo ocorre, os cards exibem uma animação de esqueleto, evitando layout shift (CLS).
*   **Hook Dedicado**: `useUserStats` separa a busca de números da busca de lista, permitindo que a lista carregue independentemente dos totais.

## 🎯 Impacto e Resultado
*   **Performance de Rede**: Redução de payload de ~2MB (hipotético 5k users) para <1KB.
*   **Precisão**: Os dados agora refletem 100% da base real, corrigindo um bug lógico crítico de visualização.

---
**Nota do Desenvolvedor:** *Compute near the data. Sempre que possível, deixe o banco de dados fazer a matemática de agregação. Trazer dados para a aplicação para apenas contá-los é um anti-pattern de performance clássico.*
