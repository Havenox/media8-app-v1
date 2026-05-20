# 040 - Frontend: Blindagem Defensiva em Acessos a Saldos de Serviços

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

Após a migração bem-sucedida do backend para a arquitetura `Offers/ClientContracts` e a integração dos hooks do frontend, as páginas de visualização de serviços do cliente (`/dashboard` e `/services`) estavam renderizando vazias. O problema ocorria devido a **crashes de runtime** no JavaScript causados por acessos inseguros a arrays e objetos aninhados (`s.lots[0]`), introduzidos na refatoração anterior.

O erro acontecia porque o código tentava acessar propriedades de `lots` sem verificar se o array existia, gerando exceções não tratadas que interrompiam a renderização do React, impedindo que o usuário final visualizasse seus créditos de edição mesmo com dados reais sendo retornados do PostgreSQL.

## 🧠 Estratégia da Solução

A solução adotada foi aplicar **optional chaining estrito** em todos os acessos a propriedades aninhadas, garantindo que qualquer caminho de dados que possa ser `undefined` ou `null` seja tratado defensivamente.

**Decisões de Design:**
- **Zero Assumptions:** Não assumir que `lots` sempre terá elementos; usar `?.` em cada nível de acesso
- **Fallback Seguro:** Prover valores padrão (`|| ''`) para strings quando o snapshot não estiver disponível
- **Prioridade de Leitura:** `contract?.snapshotOfferName` > `planName` > fallback vazio
- **Consistência de Padrão:** Padronizar todos os componentes (`ServicesPage`, `ServiceBalanceCard`, `NewOrderPage`) com a mesma lógica de acesso defensivo

Esta abordagem segue o princípio de **"defensive coding"** para resiliência a dados mal-formados ou respostas parciais da API.

## 🛠️ Implementação Técnica

### Frontend (`media8-web`)

**1. `ServicesPage.tsx`**
- Substituído `s.lots[0]?.contract` por `s.lots?.[0]?.contract` no filtro de busca
- Atualizado ordenação por data para usar `a.lots?.[0]?.purchasedAt` e `b.lots?.[0]?.purchasedAt`
- Adicionado fallback para `snapshotName` quando contrato não existe

**2. `ServiceBalanceCard.tsx`**
- Refinado acesso para `balance.lots?.[0]?.contract?.snapshotOfferName`
- Garantido que badge exibe snapshot ou fallback corretamente

**3. `NewOrderPage.tsx`**
- Atualizado lógica de pré-seleção de serviço para usar acesso defensivo
- Mantido compatibilidade com legado `planName` como fallback

### Validações
- **TypeScript:** 0 erros de tipagem
- **Vitest:** 21 testes unitários passando (services e hooks)
- **Build:** 1,159 KB minificado, 0 warnings críticos

## 🎯 Impacto e Resulto

* **Resiliência de Runtime:** UI do cliente agora renderiza corretamente mesmo com dados incompletos ou parciais
* **Experiência do Usuário:** Visualização de saldos, prazos e badges coloridos funciona com dados reais do PostgreSQL
* **Segurança de Código:** Padrão de optional chaining previne regressões futuras em acessos a objetos aninhados
* **Consistência Arquitetural:** Frontend alinhado com DTOs do backend (`UnifiedServiceBalance`, `ClientContract`)

---

**Nota do Desenvolvedor:**

*A migração de enums estáticos para entidades dinâmicas (`VideoFormat`, `Offer`, `ClientContract`) trouxe flexibilidade comercial, mas exigiu disciplina rigorosa no tratamento de dados opcionais no frontend. O padrão `lots?.[0]?.contract?.snapshotOfferName` tornou-se o "novo normal" para acessar informações de contratos, substituindo definitivamente o legado `planName`. Esta blindagem defensiva é crucial em arquiteturas onde o backend pode evoluir independentemente do frontend, garantindo que mudanças no schema não quebrem a UI do cliente.**
