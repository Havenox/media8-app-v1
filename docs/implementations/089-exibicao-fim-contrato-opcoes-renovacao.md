# 089 - Assinaturas: Exibição de Fim de Contrato e Ações de Renovação no Último Mês

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 29/05/2026

---

## 🚀 Desafio de Engenharia
Nas assinaturas recorrentes com fidelidade contratual (ex: 6 meses), o último ciclo mensal (ex: Mês 6/6) estava exibindo no rodapé a mensagem "Renova em X dias". Isso gerava confusão para o cliente, pois o plano na verdade **não** seria renovado de forma automática na virada, mas sim finalizado e marcado como `Expired` de acordo com as regras de fidelidade estabelecidas no backend.

Adicionalmente, o cliente precisava de uma via simplificada para realizar a proposta de renovação contratual antes do encerramento automático da vigência do plano atual, necessitando de botões de atalho rápidos e intuitivos na própria interface dos saldos do painel.

## 🧠 Estratégia da Solução
Para alinhar a interface visual com as regras rígidas do servidor, implementamos a detecção do último mês de fidelidade comparando o ciclo atual com o total permitido (`currentMonth === totalMonths`).
1. **Ajuste de Labels de Fim de Vigência:** Substituímos todos os rótulos de renovação do último ciclo por textos voltados ao encerramento, como `"Contrato Encerra dia X"`.
2. **Garantia de Cores da Marca:** Mantivemos a cor vinho da marca (`#7B0A0A`) mesmo em termos de vigência final de assinaturas ativos, evitando confusão cromática com outros tipos comerciais.
3. **Opção de Renovação Rápida (Grid):** Inserimos o item **"Renovar Contrato"** no menu Radix (`DropdownMenu`) de cartões ativos em seu último ciclo mensal, com navegação reativa direcionada a `/contracts/:id/renew`.
4. **Opção de Renovação Rápida (Lista):** Renderizamos o botão elegante **"Renovar"** com visual contornado em `ServiceListItem` (visualização de linhas/rows) para o último ciclo ativo.

## 🛠️ Implementação Técnica

### Backend (Mapeamento de Chaves de Ligação)
* **Chave Estrangeira do Contrato:** Expusemos a propriedade `ContractId` no DTO plano [UnifiedServiceBalanceDto.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Application/DTOs/Services/ServiceBalanceDtos.cs) e no mapeador do controlador [ServiceBalancesController.cs](file:///g:/DEV/Media8/media8-app-v1/media8-api/Media8.Api/Controllers/ServiceBalancesController.cs), permitindo que o frontend descubra qual contrato gerou o lote para fins de links de renovação direcionados.

### Frontend (Labels e Ações de Renovação)
* **Tipagem:** Atualizado o modelo `UnifiedServiceBalance` em [services.ts](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/types/services.ts) para incluir `ContractId?: string`.
* **Diferenciação de Ciclo no Rodapé:** Ajustamos a lógica de [getExpirationInfo](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/components/dashboard/ServiceCard.tsx#L77-L174) em [ServiceCard.tsx](file:///g:/DEV/Media8/media8-app-v1/media8-web/src/components/dashboard/ServiceCard.tsx) para verificar `isLastMonth`.
  * Se for o último mês e o saldo estiver ativo, as mensagens do rodapé passam a ser:
    * `"Contrato Encerra dia DD/MM/YYYY"`
    * `"Contrato Encerra hoje! (DD/MM/YYYY)"`
    * `"Contrato Encerra amanhã! (DD/MM/YYYY)"`
  * Se o lote do último mês já expirou, a mensagem passa a ser:
    * `"Contrato Encerrado em DD/MM/YYYY"`
* **Menu do Cartão (Grid):** Adicionada a condicional `{isSubscription && expInfo.isLastMonth && (...)}` no dropdown do `ServiceCard` para exibir o item de menu "Renovar Contrato" com navegação contextual.
* **Ações em Linha (List):** Em `ServiceListItem`, incluímos o botão "Renovar" com borda e cor vinho (`border-[#7B0A0A]/30 text-[#7B0A0A]`) quando a assinatura está em seu ciclo de encerramento, preservando a harmonia estética da marca.

## 🎯 Impacto e Resultado
* **Transparência de Vigência:** O cliente entende claramente quando o plano vai expirar em definitivo de acordo com a fidelidade, eliminando falsas expectativas de renovação automática.
* **Canal Ativo de Retenção e Conversão:** A inclusão das ações de renovação com direcionamento simples para a tela de propostas de renovação incentiva novas assinaturas antes que as atuais terminem e os créditos expirem.
* **Sincronismo Estrito:** Alinhamento absoluto de regras de fidelidade do backend com a experiência final de navegação do usuário.
