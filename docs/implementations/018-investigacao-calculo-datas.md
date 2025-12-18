# 018 - Debugging: Análise Forense de Inconsistência de Dados (Datas)

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 16/12/2025

---

## 🚀 Desafio de Engenharia
Um bug sutil foi reportado: "Editei a validade do pacote de 30 para 60 dias, mas os clientes continuam recebendo pacotes de 30 dias".
Esse tipo de erro é complexo pois envolve múltiplos pontos de falha: o Frontend pode não ter enviado, o Backend pode não ter salvo, ou a lógica de atribuição pode estar usando cache obsoleto.

## 🧠 Estratégia da Solução
Aplicação da **Metodologia Científica de Debugging** (Isolamento de Variáveis).
Em vez de tentar correções aleatórias ("shotgun debugging"), mapeamos o fluxo completo da informação e instrumentamos pontos de verificação.

## 🛠️ Implementação Técnica

### Plano de Investigação e Ação
1.  **Auditoria de Payload (Frontend)**: Verificação via Network Tab para confirmar se o `PUT` enviava `validityDays: 60`. (Confirmado: Sim).
2.  **Instrumentação de Log (Backend)**: Adição de logs estruturados no Controller de Atribuição para revelar o "ponto de vista" do servidor.
    ```csharp
    _logger.LogInfo("Pacote ID {Id} carregado. Validade no DB: {Days}", pkg.Id, pkg.ValidityDays);
    ```
3.  **Verificação de Persistência**: Consulta direta SQL para validar se o `UPDATE` anterior persistiu.

(O resultado da investigação apontou para uma falha na atualização do DTO, corrigida posteriormente).

## 🎯 Impacto e Resultado
*   **Qualidade**: A correção impediu prejuízo financeiro (clientes recebendo menos tempo do que pagaram).
*   **Cultura**: Demonstração de que bugs "misteriosos" devem ser resolvidos com evidências, não suposições.

---
**Nota do Desenvolvedor:** *Logs bem posicionados valem mais que 10 horas de debugger. A observabilidade é a chave para resolver inconsistências.*
