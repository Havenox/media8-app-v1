// ==========================================
// MEDIA 8 - Service Inventory Types
// Sistema de Saldos/Inventário de Serviços
// ==========================================

export type ServiceCategory = 'reels' | 'youtube' | 'pacote' | 'avulso';

// Enum-like union type matching Backend Enums (PascalCase)
export type ServiceType =
  | 'ReelsStandard'
  | 'ReelsPremium'
  | 'YoutubeCurto'
  | 'YoutubeMedio'
  | 'YoutubeLongo'
  | 'PacoteReels'
  | 'Avulso';

// Legacy interface - mantida para compatibilidade
export interface ServiceBalance {
  id: string;
  userId: string;
  serviceType: ServiceType;
  category: ServiceCategory;
  name: string;
  quantity: number;
  expiresAt?: string;
  renewsAt?: string;
  planName?: string;
  createdAt: string;
}

// NOVO: Interface para representar um lote individual (FIFO)
export interface ServiceBalanceLot {
  id: string;
  userId: string;
  serviceType: ServiceType;
  category: ServiceCategory;
  quantity: number;           // Quantidade original do lote
  remainingQuantity: number;  // Quanto ainda resta neste lote
  purchasedAt: string;        // Data da compra
  expiresAt?: string;         // Data de expiração (null = sem validade)
  renewsAt?: string;          // Para assinaturas
  source: 'purchase' | 'subscription' | 'promo' | 'gift';
  planName?: string;
}

// NOVO: Interface agregada para exibição no UI
export interface ServiceBalanceAggregated {
  serviceType: ServiceType;
  category: ServiceCategory;
  name: string;
  totalQuantity: number;           // Soma de todos os lotes
  nearestExpiryDate?: string;      // Data mais próxima de expiração
  expiringQuantity?: number;       // Quantidade expirando em breve
  renewsAt?: string;               // Para assinaturas
  planName?: string;
  lots: ServiceBalanceLot[];       // Todos os lotes (para referência)

  // Novos campos para estados visuais
  isSubscription: boolean;         // É assinatura recorrente?
  isZeroed: boolean;               // Zerou o saldo (mas não expirou)?
  isExpired: boolean;              // Todos os lotes expiraram?
  daysUntilRenewal?: number;       // Dias até renovar (assinaturas)
  daysUntilExpiry?: number;        // Dias até expirar (pacotes)
}

// NOVO: Interface Unificada vinda da API /service-balances/my-balances
export interface UnifiedServiceBalance {
  id: string;
  serviceName: string;
  packageName: string;
  remainingQuantity: number;
  totalQuantity: number;
  expiresAt?: string;
  purchaseDate: string;
  status: 'active' | 'expired' | 'depleted';
}

// Resultado do consumo de serviço
export interface ConsumeResult {
  success: boolean;
  consumedFromLotId?: string;
  remainingInLot?: number;
  error?: 'NO_BALANCE' | 'EXPIRED' | 'NOT_FOUND';
}

// Configuração de expiração por tipo de serviço (em dias)
export const SERVICE_EXPIRATION_DAYS: Partial<Record<ServiceType, number>> = {
  Avulso: 7,           // 7 dias para avulsos
  PacoteReels: 30,    // 30 dias para pacotes promocionais
  // Outros tipos não expiram (assinaturas renovam)
};

export interface ServiceConfig {
  type: ServiceType;
  category: ServiceCategory;
  name: string;
  shortName: string;
  icon: string; // lucide icon name
  minBusinessDays: number;
  deadlineType: 'fixed' | 'dynamic'; // fixed = prazo calculado, dynamic = prazo a definir
  description: string;
  // New attributes for comprehensive demo coverage
  maxDurationSeconds: number | null; // null = variable/no limit
  maxDurationLabel: string; // "até 90s", "até 10min", "variável"
  maxBusinessDays: number; // Default max deadline (10)
  isDeadlineNegotiable: boolean; // Can admin/editor adjust?
}

// Configurações de cada tipo de serviço
export const serviceConfigs: Record<ServiceType, ServiceConfig> = {
  ReelsStandard: {
    type: 'ReelsStandard',
    category: 'reels',
    name: 'Reels Estratégico',
    shortName: 'Reels',
    icon: 'Smartphone',
    minBusinessDays: 7,
    deadlineType: 'fixed',
    description: 'Vídeos curtos para Instagram/TikTok',
    maxDurationSeconds: 90,
    maxDurationLabel: 'até 90s',
    maxBusinessDays: 10,
    isDeadlineNegotiable: false,
  },
  ReelsPremium: {
    type: 'ReelsPremium',
    category: 'reels',
    name: 'Reels Premium',
    shortName: 'Reels Premium',
    icon: 'Smartphone',
    minBusinessDays: 5,
    deadlineType: 'fixed',
    description: 'Reels com edição avançada e efeitos',
    maxDurationSeconds: 180,
    maxDurationLabel: 'até 180s',
    maxBusinessDays: 10,
    isDeadlineNegotiable: false,
  },
  YoutubeCurto: {
    type: 'YoutubeCurto',
    category: 'youtube',
    name: 'YouTube Curto (até 10min)',
    shortName: 'YT Curto',
    icon: 'Youtube',
    minBusinessDays: 7,
    deadlineType: 'fixed',
    description: 'Vídeos curtos para YouTube',
    maxDurationSeconds: 600,
    maxDurationLabel: 'até 10min',
    maxBusinessDays: 10,
    isDeadlineNegotiable: false,
  },
  YoutubeMedio: {
    type: 'YoutubeMedio',
    category: 'youtube',
    name: 'YouTube Médio (10-30min)',
    shortName: 'YT Médio',
    icon: 'Youtube',
    minBusinessDays: 0,
    deadlineType: 'dynamic',
    description: 'Vídeos de média duração',
    maxDurationSeconds: 1800,
    maxDurationLabel: '10-30min',
    maxBusinessDays: 10,
    isDeadlineNegotiable: true,
  },
  YoutubeLongo: {
    type: 'YoutubeLongo',
    category: 'youtube',
    name: 'YouTube Longo (+30min)',
    shortName: 'YT Longo',
    icon: 'Youtube',
    minBusinessDays: 0,
    deadlineType: 'dynamic',
    description: 'Vídeos longos e documentários',
    maxDurationSeconds: null,
    maxDurationLabel: '+30min',
    maxBusinessDays: 10,
    isDeadlineNegotiable: true,
  },
  PacoteReels: {
    type: 'PacoteReels',
    category: 'pacote',
    name: 'Pacote de Reels',
    shortName: 'Pacote',
    icon: 'Package',
    minBusinessDays: 7,
    deadlineType: 'fixed',
    description: 'Pacote promocional de Reels',
    maxDurationSeconds: 90,
    maxDurationLabel: 'até 90s cada',
    maxBusinessDays: 10,
    isDeadlineNegotiable: false,
  },
  Avulso: {
    type: 'Avulso',
    category: 'avulso',
    name: 'Edição Avulsa',
    shortName: 'Avulso',
    icon: 'Video',
    minBusinessDays: 0,
    deadlineType: 'dynamic',
    description: 'Projeto personalizado',
    maxDurationSeconds: null,
    maxDurationLabel: 'variável',
    maxBusinessDays: 10,
    isDeadlineNegotiable: true,
  },
};

// Helper para obter configuração de um serviço
export const getServiceConfig = (type: ServiceType): ServiceConfig => {
  return serviceConfigs[type];
};

// Helper para verificar se prazo é dinâmico
export const isDynamicDeadline = (type: ServiceType): boolean => {
  return serviceConfigs[type]?.deadlineType === 'dynamic';
};
