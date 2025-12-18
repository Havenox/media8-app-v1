# Implementação: Correção de Exibição de Data de Cadastro

## Contexto
Durante testes de qualidade na interface de Detalhes do Usuário (`UserDetailsSheet`), observou-se que o campo "Membro desde" não exibia a data de cadastro, apresentando apenas um caractere de placeholder (`-`).

## Diagnóstico
A investigação do fluxo de dados revelou que, embora a entidade de domínio `User` possua a propriedade `CreatedAt`, esta informação era perdida durante a serialização da resposta da API.
O Data Transfer Object (DTO) utilizado para comunicação com o painel administrativo (`AdminUserDto`) não incluía a propriedade `CreatedAt`, resultando em um valor `undefined` no frontend.

## Solução Técnica
Para garantir a disponibilidade desta informação sem expor dados desnecessários, a solução foi estender o contrato de resposta da API.

### Alterações no Backend (.NET)
1.  **Extensão do DTO (`AdminUserDto.cs`):** Adição da propriedade `CreatedAt` ao modelo de transferência.
2.  **Atualização de Mapeamento (`UsersController.cs`):** Ajuste no método `MapToAdminDto` para popular a nova propriedade a partir da entidade `User`.

### Alterações no Frontend (React)
Nenhuma alteração lógica foi necessária no Frontend, pois o código já estava preparado para renderizar a propriedade `createdAt` (camelCase) assim que ela estivesse disponível na resposta JSON. A correção no Backend habilita automaticamente a exibição correta.

## Impacto
*   **Correção de Bug:** O campo "Membro desde" passa a exibir a data correta.
*   **Melhoria de UX:** Fornece contexto temporal sobre o usuário para os administradores.
