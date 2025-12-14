# Fix: Atribuição de Pacotes Privados

**Data:** 13/12/2025
**Responsável:** Havenox
**Status:** Planejado

## Problema
Atualmente, a opção **"Atribuir a Cliente"** no menu de ações de um pacote fica desabilitada (cinza) quando o pacote está marcado como **Privado** (`!isPublic`).

## Contexto
Pacotes privados não aparecem na "Loja" pública, mas são frequentemente usados para propostas personalizadas ou negociações especiais. Portanto, o Administrador DEVE ter permissão para atribuir esses pacotes manualmente a um cliente específico.

## Solução Técnica
Remover a restrição `disabled={!pkg.isPublic}` no componente `PackagesPage.tsx`.

### Arquivo Alvo
`media8-web/src/pages/admin/PackagesPage.tsx`

### Mudança
```tsx
// ANTES
<DropdownMenuItem onClick={() => openAssignDialog(pkg)} disabled={!pkg.isPublic}>

// DEPOIS
<DropdownMenuItem onClick={() => openAssignDialog(pkg)}>
```

## Verificação
1.  Identificar um pacote Privado na lista.
2.  Clicar em "Ações".
3.  Verificar se "Atribuir a Cliente" está habilitado.
4.  Realizar a atribuição e confirmar sucesso.
