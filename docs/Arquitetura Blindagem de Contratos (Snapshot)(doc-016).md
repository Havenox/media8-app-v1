# Manual de Validação (QA): Arquitetura de Snapshots

> **Objetivo**: Protocolo de teste para verificar a integridade e imutabilidade dos contratos (Assignments).

---

## 1. Conceito a Validar
**Imutabilidade**: Garantir que alterações no Catálogo de Pacotes (`Packages`) **NÃO** afetem contratos já assinados (`PackageAssignments`). O cliente deve ver sempre o que comprou, não o que o produto se tornou.

---

## 2. Roteiro de Teste (Box Testing)

### Cenário A: Contratação e Alteração de Produto

**Passo 1: Setup (Admin)**
1.  Acesse `/admin/packages`.
2.  Crie um Pacote:
    *   **Nome**: "Plano Teste V1"
    *   **Qtd**: 10 vídeos
    *   **Preço**: R$ 100,00
3.  Vá em Usuários e atribua este pacote ao `Cliente A`.

**Passo 2: Mutação (Admin)**
1.  Volte em `/admin/packages`.
2.  Edite o "Plano Teste V1":
    *   **Nome** -> "Plano Teste V2 (Inflacionado)"
    *   **Qtd** -> 50 vídeos
    *   **Preço** -> R$ 500,00
3.  Salve as alterações.

**Passo 3: Verificação (Cliente)**
1.  Acesse o Dashboard do `Cliente A` (ou simule visualização).
2.  **Resultado Esperado (SUCESSO)**:
    *   O card exibe: "Plano Teste V1" (Nome Original).
    *   O saldo exibe: "10 vídeos" (Qtd Original).
3.  **Resultado Falho**:
    *   O card exibe "Plano Teste V2". (Isso seria violação de contrato).

---

## 3. Verificação Técnica (SQL)

Para desenvolvedores, a validação pode ser feita diretamente no banco:

```sql
SELECT 
    p.name as current_catalog_name,
    pa.snapshot_package_name as contracted_name,
    pa.snapshot_video_quantity as contracted_qty
FROM package_assignments pa
JOIN packages p ON pa.package_id = p.id
WHERE pa.client_id = 'uuid-do-cliente';
```

Se `contracted_name` for diferente de `current_catalog_name`, o sistema está funcionando corretamente (Snapshot isolou o histórico).

---

## 4. Troubleshooting

Se o teste falhar:
1.  Verifique se a migration `AddSnapshotsToAssignments` foi aplicada.
2.  Verifique se o Controller `PackageAssignmentsController.Create` está populando os campos `Snapshot*` no momento do POST.
3.  Certifique-se de que o Frontend está lendo `snapshotPackageName` e não `package.name`.
