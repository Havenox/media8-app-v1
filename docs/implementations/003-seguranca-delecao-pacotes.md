# 003 - Integridade de Dados: Sistema de Deleção Segura com Validação de Dependências

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 13/12/2025

---

## 🚀 Desafio de Engenharia
Em sistemas ERP/CRM, a deleção de registros "pai" (como Pacotes de Serviço) que possuem registros "filhos" (Vendas/Atribuições) é uma operação destrutiva crítica. A simples deleção em cascata (`CASCADE DELETE`) seria inaceitável, pois apagaria histórico financeiro. O desafio era impedir essa ação de forma robusta no backend e educar o usuário no frontend sobre o porquê da operação ser bloqueada.

## 🧠 Estratégia da Solução
Implementei uma estratégia de **Defesa em Profundidade**:
1.  **Backend (Regra de Ouro)**: O banco de dados e a API são a autoridade final. Bloqueiam fisicamente a operação se existirem dependências, retornando `409 Conflict`.
2.  **Frontend (UX de Fricção Cognitiva)**: Para deleções permitidas (sem dependências), adicionei fricção intencional (modal de confirmação com digitação de nome) para evitar cliques acidentais.

## 🛠️ Implementação Técnica

### Backend Protegido
*   **Verificação de Integridade Referencial**: Antes de tentar deletar, o controller verifica `_repository.HasAssignments(id)`.
*   **Status HTTP Semântico**: Retorna `409 Conflict` com uma mensagem clara ("Pacote possui vendas associadas"), permitindo que o frontend reaja especificamente a este erro.

### UX Preventiva (React)
*   **Padrão "Destructive Action"**: Implementei um componente reutilizável `DeleteConfirmationDialog`.
*   **Trava de Segurança**: O botão "Excluir" permanece desabilitado até que o usuário digite exatamente o nome do pacote, garantindo que ele está ciente do contexto da ação.

## 🎯 Impacto e Resultado
*   **Segurança de Dados**: Risco zero de perda acidental de histórico de vendas de clientes.
*   **Melhoria de Operação**: Redução de chamadas de suporte ("Apaguei sem querer"), pois o sistema agora impede o erro humano e o erro sistêmico simultaneamente.

---
**Nota do Desenvolvedor:** *A decisão de não usar `Soft Delete` aqui foi deliberada para manter a limpeza do banco, optando em vez disso por orientar o usuário a "Desativar/Arquivar" pacotes antigos em vez de deletá-los.*
