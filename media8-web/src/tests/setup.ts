import '@testing-library/react';

// Mock do QueryClient para testes
import { QueryClient } from '@tanstack/react-query';

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

// Silenciar warnings do React Testing Library
const originalWarn = console.warn.bind(console.warn);
console.warn = (...args) => {
  if (
    args[0]?.includes?.('Warning:') &&
    args[0]?.includes?.('react-dom')
  ) {
    return;
  }
  originalWarn(...args);
};
