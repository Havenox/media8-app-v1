import { ClientPackageAssignment, AssignPackageRequest } from '@/types/packages';
import { ServiceBalanceLot } from '@/types/services';
import { api } from '@/lib/api';

// ==========================================
// API FUNCTIONS
// ==========================================

const getAllAPI = async (): Promise<ClientPackageAssignment[]> => {
  const response = await api.get('/package-assignments');
  return response.data;
};

const getByClientAPI = async (clientId: string): Promise<ClientPackageAssignment[]> => {
  const response = await api.get(`/package-assignments?clientId=${clientId}`);
  return response.data;
};

const getActiveByClientAPI = async (clientId: string): Promise<ClientPackageAssignment | null> => {
  const response = await api.get(`/package-assignments?clientId=${clientId}&status=active`);
  return response.data[0] || null;
};

const assignAPI = async (
  data: AssignPackageRequest
): Promise<{ assignment: ClientPackageAssignment; lots: ServiceBalanceLot[] }> => {
  const response = await api.post('/package-assignments', data);
  return response.data;
};

const cancelAPI = async (id: string): Promise<void> => {
  await api.patch(`/package-assignments/${id}/cancel`);
};

// ==========================================
// EXPORTED SERVICE
// ==========================================

export const packageAssignmentService = {
  async getAll(): Promise<ClientPackageAssignment[]> {
    return getAllAPI();
  },

  async getByClient(clientId: string): Promise<ClientPackageAssignment[]> {
    return getByClientAPI(clientId);
  },

  async getActiveByClient(clientId: string): Promise<ClientPackageAssignment | null> {
    return getActiveByClientAPI(clientId);
  },

  async getById(id: string): Promise<ClientPackageAssignment | null> {
    const all = await getAllAPI();
    return all.find(a => a.id === id) || null;
  },

  async assign(
    data: AssignPackageRequest,
    _assignedBy: string
  ): Promise<{ assignment: ClientPackageAssignment; lots: ServiceBalanceLot[] }> {
    return assignAPI(data);
  },

  async cancel(id: string): Promise<void> {
    return cancelAPI(id);
  },
};

export default packageAssignmentService;
