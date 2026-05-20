# 037 - Testes Unitários: Blindagem da Engine Offers/Contracts do Frontend

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 20/05/2026

---

## 🚀 Desafio de Engenharia

Com a migração completa do frontend para a nova arquitetura de `Offers` e `ClientContracts` (Épico 3.6), era crítico garantir que as novas camadas de serviço e hooks do TanStack Query funcionassem com precisão cirúrgica. Os testes manuais via UI seriam lentos, propensos a erros e não ofereceriam cobertura de regressão. Era necessário implementar uma suíte de testes automatizados que validasse isoladamente cada função de API e hook, garantindo que URLs, payloads e invalidações de cache ocorressem conforme o esperado.

## 🧠 Estratégia da Solução

A implementação seguiu uma abordagem em camadas, começando pela infraestrutura base (Vitest + jsdom), seguida por testes unitários de services (foco em chamadas HTTP e payloads) e finalizando com testes de hooks (foco em ciclo de vida, toasts e invalidação de cache do TanStack Query). A decisão de usar **Vitest** ao invés de Jest foi estratégica: integração nativa com Vite, hot-reload mais rápido e configuração simplificada.

Cada fase foi commitada atomicamente para permitir rollback seguro e documentação clara da evolução dos testes.

## 🛠️ Implementação Técnica

### Infraestrutura (Commit: `d5d800a`)
- **Instalação**: `vitest`, `@testing-library/react`, `jsdom`, `@types/jsdom`
- **Configuração**: `vite.config.ts` com bloco `test` apontando para `happy-dom` e setup global
- **Sanity Check**: `sanity.test.ts` validando a infraestrutura do Vitest
- **Setup**: `src/tests/setup.ts` com QueryClient de teste e silência de warnings

### Services (Commit: `58366b8`)
**offerService.test.ts (7 testes):**
- `getAll`: Valida URL com paginação e search
- `getById`: Testa retorno de oferta única e null quando não encontrado
- `create`: Assegura envio correto de `ContractType` em português
- `update`: Valida atualização parcial
- `delete`: Confirma chamada DELETE na URL correta

**clientContractService.test.ts (5 testes):**
- `getAll`: Testa com e sem filtro de clientId
- `getById`: Valida retorno de contrato específico
- `create`: Assegura payload com `offerId`, `clientId`, `assignedByUserId`
- `update`: Testa mudança de status (`Active` → `Expired`)

### Hooks (Commit: `026fbea`)
**useOffers.test.tsx (4 testes):**
- `useOffers`: Valida carregamento de dados e estado `isLoading`
- `useCreateOffer`: Testa toast de sucesso e invalidação de cache
- `useUpdateOffer`: Valida atualização e refresh de queries
- `useDeleteOffer`: Confirma remoção e invalidação

**useClientContracts.test.tsx (3 testes):**
- `useClientContracts`: Testa listagem com wrapper do QueryClient
- `useCreateClientContract`: Valida toast e invalidação de `['client-contracts']` e `['service-balances']`
- `useUpdateClientContract`: Testa atualização de status

### Estrutura de Arquivos Criados:
```\
media8-web/src/
├── tests/setup.ts                      # Setup global dos testes
├── services/__tests__/
│   ├── sanity.test.ts                  # Sanity check da infra
│   ├── offerService.test.ts            # 7 testes de service
│   └── clientContractService.test.ts   # 5 testes de service
└── hooks/__tests__/
    ├── useOffers.test.tsx              # 4 testes de hook
    └── useClientContracts.test.tsx     # 3 testes de hook
```

## 🎯 Impacto e Resultado

* **21 Testes Automatizados**: Cobertura completa de services e hooks da engine Offers/Contracts
* **Build Verde**: Todos os testes passando (5 arquivos, 21 testes, 2.32s)
* **Detecção Precoce de Bugs**: Erros de URL, payload ou invalidação são pegos no CI, não em produção
* **Documentação Viva**: Testes servem como especificação executável do comportamento esperado
* **Confiança para Refatorar**: Mudanças futuras podem ser validadas rapidamente com `npm run test`
* **Cultura de Qualidade**: Estabelece padrão para futuros testes de componentes UI

---

**Nota do Desenvolvedor:**

A escolha de testar services e hooks separadamente foi intencional. Services testam a "borda" do sistema (chamadas HTTP), enquanto hooks testam o "gerenciamento de estado" (TanStack Query). Essa separação permite isolar falhas: se um teste de hook quebra, sabemos que é problema de estado/cache, não de API. O uso de `vi.mock()` para simular o axios e o toast garantiu que os testes fossem rápidos e determinísticos, sem dependência de rede ou UI real. A renomeação de `.test.ts` para `.test.tsx` foi necessária para suportar JSX dos wrappers do React Testing Library, revelando a importância de configurar corretamente o pipeline de testes desde o início.
