Quero aplicar uma refatoração estrutural na aplicação para resolver a responsividade em TODAS as rotas de uma vez. O objetivo é transformar a experiência Mobile atual (que está apertada) em uma experiência "App Native" fluida.

Por favor, realize as seguintes alterações na Arquitetura do Frontend:

1. **Refatoração do componente Wrapper principal:**
   - Implemente um padrão de layout responsivo híbrido.
   - **Desktop (`md` para cima):** Mantenha a Sidebar fixa lateral visível.
   - **Mobile (`< md`):**
     - Oculte a Sidebar fixa (`hidden`).
     - Exiba uma **Mobile TopBar** fixa no topo (`sticky top-0 z-50`) com a cor de fundo Vinho (#400404) e a Logo centralizada ou à esquerda.
     - Adicione um botão de Menu (Hamburger) nesta TopBar que abre a Sidebar atual dentro de um componente `Sheet` (Gaveta) do shadcn/ui.
     - A `Sheet` deve ter o mesmo fundo Vinho e estilização da Sidebar original.

2. **Ajuste Global de Espaçamento (`Main Container`):**
   - No container `main` que envolve o conteúdo das páginas (`children`), ajuste o padding:
   - **Mobile:** `p-4` (ou `px-4 py-6`). Remova margens excessivas para aproveitar 100% da largura.
   - **Desktop:** Mantenha o `p-8` ou o espaçamento atual que funciona bem.
   - Isso deve corrigir o efeito "espremido" em todas as tabelas e formulários automaticamente.

3. **Atualização nos Componentes Base (`ui/input`, `ui/button`, `ui/select`):**
   - Vá nos arquivos de definição desses componentes (ex: `components/ui/button.tsx`) e adicione classes utilitárias para garantir "Touch Friendly" no mobile:
   - Adicione `h-12` (48px) para telas mobile e mantenha `md:h-10` para desktop se necessário.
   - Isso garantirá que *todos* os formulários do sistema fiquem fáceis de tocar sem precisar editar página por página.

4. **Tipografia Responsiva Global:**
   - Se houver um componente de `PageHeader` ou `Title`, ajuste o tamanho da fonte para escalar: `text-2xl` no mobile e `text-3xl/4xl` no desktop.

**Resumo:** O usuário não deve sentir que está num "site desktop diminuído", mas sim em um aplicativo web otimizado. Aplique essas regras de forma que afetem o layout raiz.