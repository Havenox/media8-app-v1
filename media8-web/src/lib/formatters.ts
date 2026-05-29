/**
 * Formata um SequentialId com prefixo customizado e preenchimento de zeros à esquerda.
 * Exemplo: formatSequentialId(12, 'Pedido') => 'Pedido #0012'
 * Exemplo: formatSequentialId(1, 'Contrato') => 'Contrato #0001'
 * Exemplo: formatSequentialId(5, 'Fatura') => 'Fatura #0005'
 */
export const formatSequentialId = (
  id?: number | null,
  prefix: string = '',
  digits: number = 4
): string => {
  if (id === undefined || id === null || id <= 0) return '';
  const formattedNumber = String(id).padStart(digits, '0');
  return prefix ? `${prefix} #${formattedNumber}` : `#${formattedNumber}`;
};

/**
 * Formata a duração máxima do vídeo em segundos ou minutos.
 * Exemplo: formatMaxDuration(90) => 'até 90s'
 * Exemplo: formatMaxDuration(120) => 'até 2 mins'
 */
export const formatMaxDuration = (seconds?: number | null): string => {
  if (!seconds || seconds <= 0) return '';
  if (seconds <= 90) {
    return `até ${seconds}s`;
  }
  const mins = Math.round(seconds / 60);
  return `até ${mins} min${mins > 1 ? 's' : ''}`;
};
