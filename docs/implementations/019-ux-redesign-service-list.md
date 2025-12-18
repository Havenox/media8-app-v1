# Redesign de UX: Lista de Saldos e Serviços

## Objetivo
Melhorar a experiência de visualização dos pacotes ativos no painel lateral de detalhes do usuário (`UserDetailsSheet`).
Substituir o layout de cards em grid (que fica comprimido na lateral) por uma lista vertical limpa, seguindo a referência visual fornecida ("imagem 2").

## Problema Atual
*   O componente `ServiceBalanceList` forçam um layout `grid` que não se adapta bem a containers estreitos como o Sheet.
*   Informações ficam quebradas ou difíceis de ler.
*   Poluição visual com bordas grossas e ícones grandes.

## Solução Proposta

### 1. Refatoração do `ServiceBalanceList.tsx`
Introduzir uma prop `variant` para controlar o modo de exibição.

```typescript
type ServiceListVariant = 'grid' | 'list';

interface ServiceBalanceListProps {
  // ... props existentes
  variant?: ServiceListVariant; // Default: 'grid'
}
```

### 2. Novo Layout 'List' (Referência Imagem 2)
Quando `variant="list"`, renderizaremos um novo sub-componente `ServiceListItem` com as seguintes características:
*   **Container:** `flex flex-col gap-3` (Lista vertical simples).
*   **Card:** Design minimalista, fundo suave (amarelo claro/bege para harmonizar com a marca).
*   **Tipografia:** Título e quantidade em destaque, datas alinhadas em uma linha separada ou grid interno.
*   **Alertas:** Ícone de aviso (triângulo) discreto para itens expirando ou vencidos.

#### Estrutura Visual (Esboço)
```tsx
<div className="bg-orange-50/50 border border-orange-100 rounded-lg p-4">
  <div className="flex justify-between items-start">
    <div>
      <h4 className="font-semibold text-foreground">{packageName}</h4>
      <p className="text-sm text-muted-foreground">{videoQuantity} vídeos</p>
    </div>
    {isExpiring && <AlertTriangle className="text-orange-500 h-4 w-4" />}
  </div>
  
  <Separator className="my-3 bg-orange-200/30" />
  
  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
    <div>
      <Calendar className="h-3 w-3 inline mr-1" />
      Ativado em: <span className="text-foreground">{activatedDate}</span>
    </div>
    <div className="text-right">
       Expira em: <span className="text-orange-700 font-medium">{expiryDate}</span>
    </div>
  </div>
</div>
```

### 3. Integração
Atualizar o `UserDetailsSheet.tsx` para usar o novo visual:
```tsx
<ServiceBalanceList 
  clientId={user.id} 
  variant="list" // Novo modo
  className="w-full"
/>
```

## Benefícios
*   **Responsividade:** Funciona perfeitamente em Mobile e no Side Panel.
*   **Leitura:** Escaneabilidade muito superior (1 item por linha).
*   **Estética:** Visual mais profissional e alinhado com "SaaS Premium".
