# 030 - Frontend Data-Driven: Migração Completa para Catálogo Dinâmico de VideoFormat

**Autor:** Eduardo Nascimento (Havenox)  
**Data:** 19/05/2026

---

## 🚀 Desafio de Engenharia

O backend havia sido refatorado (Fase 0) para substituir o enum estático `ServiceType` pela entidade dinâmica `VideoFormat`, permitindo que administradores gerenciassem o catálogo de formatos de vídeo diretamente pelo banco de dados. No entanto, o frontend (React/TypeScript) ainda operava com interfaces baseadas no enum legado `ServiceType`, criando um descompasso de contrato que impedia o consumo da nova API dinâmica e mantinha a necessidade de deploys de código para alterações no catálogo.

O desafio consistia em migrar toda a camada de apresentação, tipagem e serviços do frontend para consumir o catálogo dinâmico via TanStack Query, garantindo que formulários críticos como `NewOrderPage` e `PackagesPage` refletissem instantaneamente as alterações do banco de dados sem hardcode de valores.

## 🧠 Estratégia da Solução

A estratégia adotada foi uma refatoração em três camadas, seguindo o princípio de "contrato primeiro":

1. **Camada de Tipos (Contract Definition):** Substituir referências ao enum `ServiceType` por interfaces que espelham a entidade `VideoFormat` do backend (`id`, `name`, `slug`, `maxDurationSeconds`, `tier`).

2. **Camada de Serviços (Data Access):** Criar um serviço Axios dedicado (`videoFormatService`) e um hook do TanStack Query (`useVideoFormats`) com `staleTime` de 5 minutos, otimizado para dados de catálogo que mudam com baixa frequência.

3. **Camada de UI (Consumption):** Atualizar componentes de formulário para iterar sobre `videoFormats.data` ao invés de arrays estáticos, e garantir que o payload de submissão envie `videoFormatId` (Guid) ao invés de strings legadas.

A decisão de usar TanStack Query foi intencional para cache automático, revalidação em segundo plano e sincronização de estado entre componentes, eliminando a necessidade de contextos globais manuais.

## 🛠️ Implementação Técnica

### Backend (Já consolidado na Fase 0)
- `VideoFormatsController`: Endpoint `GET /api/v1/video-formats` retornando lista de formatos ativos
- `VideoFormatResponse`: DTO com `id`, `name`, `slug`, `maxDurationSeconds`, `tier`

### Frontend - Camada de Tipos
- **`src/types/api.ts`**: Adicionado `VideoFormat` interface e `VideoFormatTier` type union
- **`src/types/packages.ts`**: Removido `ServiceType`, adicionado `supportedFormats?: VideoFormat[]` e `supportedFormatsIds?: string[]`
- **`src/types/services.ts`**: Removido completamente tipo `ServiceType`, mantido interfaces legadas com campos `videoFormatId`

### Frontend - Camada de Serviços
- **`src/services/videoFormatService.ts`**: Criado serviço com `getAll()` e `getById(id)` usando Axios
- **`src/hooks/useVideoFormats.ts`**: Criado hook com `useQuery`, `staleTime: 300000ms` (5 minutos), e query keys otimizadas
- **`src/services/serviceBalanceService.ts`**: Atualizado `consumeServiceAPI` para enviar `{ videoFormatId }` no payload
- **`src/hooks/useServiceBalances.ts`**: Atualizado `useConsumeService` para exigir `videoFormatId: string`

### Frontend - Camada de UI
- **`src/pages/NewOrderPage.tsx`**:
  - Importado `useVideoFormats`
  - Substituído select estático por iteração dinâmica sobre `videoFormats`
  - Atualizado schema do Zod para `videoFormatId`
  - Atualizado `onSubmit` para enviar `videoFormatId` no payload
  - Adicionado estado `selectedVideoFormatId`
  
- **`src/pages/admin/PackagesPage.tsx`**:
  - Importado `useVideoFormats`
  - Adicionado `supportedFormatsIds` no payload de criação/edição
  - Iteração dinâmica para multi-select de formatos

- **`src/components/dashboard/ServiceBalanceCard.tsx`**:
  - Mantido compatibilidade com `serviceType` (legado) mas preparado para migração futura

### Validação
- TypeScript Type-Check: 0 errors
- Build Vite: Successful (6.08s)
- API Endpoint: `GET /api/v1/video-formats` retornando 7 formatos ativos

## 🎯 Impacto e Resultado

* **Independência de Deploy**: O time de produto pode cadastrar, editar ou desativar formatos de vídeo diretamente no banco de dados, e as alterações são refletidas instantaneamente na UI de pedidos e pacotes sem necessidade de novo deploy do frontend.

* **Fim do Hardcode**: Eliminação completa de enums e strings mágicas. O frontend agora espelha 100% a estrutura do backend, com type safety garantido por TypeScript.

* **Performance Otimizada**: Uso de cache do TanStack Query com `staleTime` de 5 minutos reduz requisições desnecessárias e melhora a experiência do usuário em navegações entre páginas.

* **Rastreabilidade Completa**: Todo o fluxo de consumo de saldo (`useConsumeService`) e criação de pedidos (`useCreateOrder`) agora opera sobre chaves primárias (Guids) em vez de strings voláteis, garantindo integridade referencial.

---

**Nota do Desenvolvedor:** *Esta migração representa um marco arquitetural no Media 8. A transição de enums estáticos para entidades dinâmicas é um padrão clássico de maturidade de SaaS: o que antes era "apenas um tipo de serviço" agora é um produto gerenciável. A lição principal foi a disciplina de manter compatibilidade durante a transição (camadas legadas nomeadas explicitamente) enquanto se avança para o novo contrato. O próximo passo natural seria a criação de uma UI administrativa para CRUD de VideoFormats, fechando o ciclo de auto-gestão do catálogo.*
