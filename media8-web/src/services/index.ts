// ==========================================
// MEDIA 8 - Services Index
// Central export for all service modules
// ==========================================

export { userService, resetUsersState } from './userService';
export { orderService, resetOrdersState } from './orderService';
export { offerService, resetOffersState } from './offerService';
export { clientContractService, resetClientContractsState } from './clientContractService';
export { serviceBalanceService, resetServiceBalanceState, addLots } from './serviceBalanceService';
export { visualIdentityProfileService, editingProfileService } from './profileService';

// Reset all demo states (useful for testing)
import { resetUsersState } from './userService';
import { resetOrdersState } from './orderService';
import { resetOffersState } from './offerService';
import { resetClientContractsState } from './clientContractService';
import { resetServiceBalanceState } from './serviceBalanceService';

export const resetAllDemoData = () => {
  resetUsersState();
  resetOrdersState();
  resetOffersState();
  resetClientContractsState();
  resetServiceBalanceState();
  console.log('[Demo] All demo data has been reset to initial state');
};
