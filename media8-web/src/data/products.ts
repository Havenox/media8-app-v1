// ==========================================
// STATIC LANDING PAGE DATA
// This data is used exclusively for the public landing page
// Dashboard/App data comes from the API
// ==========================================

export interface Product {
    id: string;
    title: string;
    description: string;
    price: string;
    pricePerUnit?: string;
    features: string[];
    duration?: string;
    badge?: string;
    highlight?: boolean;
    note?: string;
}

// ==========================================
// AVULSO PRODUCTS
// ==========================================
export const avulsoProducts: Product[] = [
    {
        id: 'avulso-reels-130',
        title: 'Reels Estratégico',
        description: 'Edição avançada com cortes bem posicionados, legendas e trilha.',
        price: '130',
        duration: 'Até 1m30s',
        features: [
            'Cortes inteligentes',
            'Legendas dinâmicas',
            'Trilha sonora',
            'Transições suaves',
            'Elementos gráficos',
            'Sound Design',
        ],
        note: 'Prazo de entrega: até 7 dias corridos',
    },
    {
        id: 'avulso-reels-200',
        title: 'Reels Estendido',
        description: 'Edição avançada para conteúdos mais longos e detalhados.',
        price: '200',
        duration: 'Até 3 min',
        features: [
            'Cortes inteligentes',
            'Legendas dinâmicas',
            'Trilha sonora',
            'Transições suaves',
            'Elementos gráficos',
            'Sound Design',
        ],
        note: 'Prazo de entrega: até 7 dias corridos',
        highlight: true,
        badge: 'Popular',
    },
    {
        id: 'avulso-reels-narrado',
        title: 'Reels Narrado',
        description: 'Vídeo criado a partir de fotos ou vídeos soltos, com narração.',
        price: '150',
        duration: 'Até 1m30s',
        features: [
            'Criado a partir de fotos/vídeos',
            'Narração em áudio',
            'Legendas dinâmicas',
            'Transições cinematográficas',
            'Trilha sonora',
        ],
        note: 'Prazo de entrega: até 7 dias corridos',
    },
];

// ==========================================
// ASSINATURA PRODUCTS
// ==========================================
export const assinaturaProducts: Product[] = [
    {
        id: 'assinatura-starter',
        title: 'Plano Starter',
        description: 'Ideal para quem está começando a criar conteúdo.',
        price: '597',
        pricePerUnit: 'R$ 74,63/vídeo',
        features: [
            '8 Reels por mês',
            'Fidelidade de 6 meses',
            'Formato vertical (1080x1920)',
            'Entrega programada',
            'Suporte prioritário',
        ],
        note: 'Contrato de fidelidade mínima de 6 meses',
    },
    {
        id: 'assinatura-growth',
        title: 'Plano Growth',
        description: 'Para quem busca constância e crescimento exponencial.',
        price: '847',
        pricePerUnit: 'R$ 70,58/vídeo',
        features: [
            '12 Reels por mês',
            'Fidelidade de 6 meses',
            'Formato vertical (1080x1920)',
            'Entrega programada',
            'Suporte prioritário',
            'Revisões ilimitadas',
        ],
        note: 'Contrato de fidelidade mínima de 6 meses',
        highlight: true,
        badge: 'Mais Popular',
    },
    {
        id: 'assinatura-scale',
        title: 'Plano Scale',
        description: 'Máximo volume para marcas que dominam as redes.',
        price: '1.497',
        pricePerUnit: 'R$ 62,38/vídeo',
        features: [
            '24 Reels por mês',
            'Fidelidade de 6 meses',
            'Formato vertical (1080x1920)',
            'Entrega programada',
            'Suporte prioritário',
            'Revisões ilimitadas',
            'Reunião mensal de estratégia',
        ],
        note: 'Contrato de fidelidade mínima de 6 meses',
    },
];

// ==========================================
// PACOTE PRODUCTS
// ==========================================
export const pacoteProducts: Product[] = [
    {
        id: 'pacote-essencial',
        title: 'Pacote Essencial',
        description: 'Para quem quer testar a qualidade sem compromisso.',
        price: '697',
        pricePerUnit: 'R$ 87,13/vídeo',
        features: [
            '8 Reels inclusos',
            'Sem fidelidade',
            'Validade de 60 dias',
            'Formato vertical',
            'Suporte dedicado',
        ],
        note: 'Use quando quiser dentro de 60 dias',
    },
    {
        id: 'pacote-profissional',
        title: 'Pacote Profissional',
        description: 'Flexibilidade com economia para campanhas específicas.',
        price: '997',
        pricePerUnit: 'R$ 83,08/vídeo',
        features: [
            '12 Reels inclusos',
            'Sem fidelidade',
            'Validade de 60 dias',
            'Formato vertical',
            'Suporte dedicado',
            'Prioridade na fila',
        ],
        note: 'Use quando quiser dentro de 60 dias',
        highlight: true,
        badge: 'Melhor Custo-Benefício',
    },
    {
        id: 'pacote-premium',
        title: 'Pacote Premium',
        description: 'Volume máximo para campanhas de alto impacto.',
        price: '1.697',
        pricePerUnit: 'R$ 70,71/vídeo',
        features: [
            '24 Reels inclusos',
            'Sem fidelidade',
            'Validade de 60 dias',
            'Formato vertical',
            'Suporte dedicado',
            'Prioridade máxima',
        ],
        note: 'Use quando quiser dentro de 60 dias',
    },
];

// ==========================================
// YOUTUBE PRODUCTS
// ==========================================
export const youtubeProducts: Product[] = [
    {
        id: 'youtube-curto',
        title: 'YouTube Curto',
        description: 'Edição profissional para vídeos curtos do YouTube.',
        price: '280',
        duration: 'Até 15 min',
        features: [
            'Cortes dinâmicos',
            'Legendas estratégicas',
            'Trilha sonora',
            'Correção de cor',
            'Thumbnail incluso',
        ],
        note: 'Prazo alinhado previamente',
    },
    {
        id: 'youtube-medio',
        title: 'YouTube Médio',
        description: 'Ideal para tutoriais, reviews e entrevistas.',
        price: '350',
        duration: 'Até 30 min',
        features: [
            'Cortes dinâmicos',
            'Legendas estratégicas',
            'Trilha sonora',
            'Correção de cor',
            'Thumbnail incluso',
            'Capítulos marcados',
        ],
        note: 'Prazo alinhado previamente',
        highlight: true,
        badge: 'Mais Vendido',
    },
    {
        id: 'youtube-longo',
        title: 'YouTube Longo',
        description: 'Para aulas, webinars, CPLs e conteúdos extensos.',
        price: '530',
        duration: 'Até 1 hora',
        features: [
            'Cortes dinâmicos',
            'Legendas estratégicas',
            'Trilha sonora',
            'Correção de cor',
            'Thumbnail incluso',
            'Capítulos marcados',
            'Revisão completa',
        ],
        note: 'Prazo alinhado previamente',
    },
];

// ==========================================
// FAQ ITEMS
// ==========================================
export const faqItems = [
    {
        question: 'Qual o prazo de entrega?',
        answer: 'Para Reels e vídeos curtos, o prazo é de até 7 dias corridos. Para vídeos de YouTube, o prazo é alinhado previamente de acordo com a duração do conteúdo.',
    },
    {
        question: 'Como funciona o processo de revisão?',
        answer: 'Após a primeira entrega, você pode solicitar ajustes. Nos planos de assinatura, as revisões são ilimitadas. Nos serviços avulsos, incluímos 2 rodadas de revisão.',
    },
    {
        question: 'Vocês fazem captação de vídeo?',
        answer: 'Não, trabalhamos exclusivamente com pós-produção e edição. Você nos envia o material bruto e nós transformamos em conteúdo profissional.',
    },
    {
        question: 'Como funciona a fidelidade nos planos?',
        answer: 'Os planos de assinatura têm fidelidade mínima de 6 meses para garantir os preços especiais. Se preferir flexibilidade, oferecemos os Pacotes sem fidelidade.',
    },
    {
        question: 'Posso cancelar a assinatura a qualquer momento?',
        answer: 'Após o período de fidelidade de 6 meses, você pode cancelar a qualquer momento com 30 dias de antecedência.',
    },
    {
        question: 'Como envio meus arquivos?',
        answer: 'Utilizamos Google Drive, Dropbox ou WeTransfer. Após a contratação, você receberá acesso à nossa pasta compartilhada para uploads.',
    },
];

// ==========================================
// TESTIMONIALS
// ==========================================
export const testimonials = [
    {
        name: 'Carlos Mendes',
        role: 'Mentor de Negócios',
        content: 'A Media 8 transformou completamente minha presença no Instagram. Meus reels agora têm uma qualidade profissional que me posiciona como autoridade no mercado.',
    },
    {
        name: 'Ana Paula Silva',
        role: 'Coach de Carreira',
        content: 'Finalmente encontrei uma equipe que entende o que é edição estratégica. Cada vídeo que recebo já vem pronto para converter.',
    },
    {
        name: 'Ricardo Oliveira',
        role: 'Especialista em Marketing Digital',
        content: 'O atendimento é impecável e a qualidade supera expectativas. Recomendo para qualquer expert que quer escalar seu conteúdo.',
    },
];

// ==========================================
// CONTACT INFO
// ==========================================
export const contactInfo = {
    whatsapp: '(11) 99999-9999',
    whatsappLink: 'https://wa.me/5511999999999?text=Olá!%20Vim%20pelo%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20os%20serviços.',
    email: 'contato@media8.com.br',
    behance: 'behance.net/media8',
    instagram: '@media8oficial',
};
