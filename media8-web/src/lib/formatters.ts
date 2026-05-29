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
