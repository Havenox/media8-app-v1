// ==========================================
// MEDIA 8 - Services Index
// Central export for all service modules
// ==========================================

export { userService, resetUsersState } from './userService';
export { orderService, resetOrdersState } from './orderService';
export { packageService, resetPackagesState } from './packageService';
export { packageAssignmentService, resetPackageAssignmentsState } from './packageAssignmentService';
export { serviceBalanceService, resetServiceBalanceState, addLots } from './serviceBalanceService';

// Reset all demo states (useful for testing)
import { resetUsersState } from './userService';
import { resetOrdersState } from './orderService';
import { resetPackagesState } from './packageService';
import { resetPackageAssignmentsState } from './packageAssignmentService';
import { resetServiceBalanceState } from './serviceBalanceService';

export const resetAllDemoData = () => {
  resetUsersState();
  resetOrdersState();
  resetPackagesState();
  resetPackageAssignmentsState();
  resetServiceBalanceState();
  console.log('[Demo] All demo data has been reset to initial state');
};
