import { create } from 'zustand';
import { anomalies as initialAnomalies, stores } from '@/data';
import type { Anomaly, AnomalyType, AnomalyStatus, AnomalyStats, Message, Correction } from '@/types';

interface AnomalyState {
  anomalies: Anomaly[];
  selectedType: AnomalyType | null;
  selectedStore: string | null;
  selectedStatus: AnomalyStatus | null;
  activeAnomalyId: string | null;
  stats: AnomalyStats;
  setSelectedType: (type: AnomalyType | null) => void;
  setSelectedStore: (storeId: string | null) => void;
  setSelectedStatus: (status: AnomalyStatus | null) => void;
  setActiveAnomaly: (id: string | null) => void;
  addMessage: (anomalyId: string, content: string, sender: string) => void;
  addCorrection: (anomalyId: string, note: string, attachmentName: string, submittedBy: string) => void;
  resolveAnomaly: (anomalyId: string) => void;
  updateAnomalyStatus: (anomalyId: string, status: AnomalyStatus) => void;
  getFilteredAnomalies: () => Anomaly[];
  computeStats: () => void;
}

function computeAnomalyStats(anomalyList: Anomaly[]): AnomalyStats {
  return {
    missing: anomalyList.filter((a) => a.type === 'missing' && a.status !== 'resolved').length,
    duplicate: anomalyList.filter((a) => a.type === 'duplicate' && a.status !== 'resolved').length,
    expiry: anomalyList.filter((a) => a.type === 'expiry' && a.status !== 'resolved').length,
    unbound: anomalyList.filter((a) => a.type === 'unbound' && a.status !== 'resolved').length,
  };
}

export const useAnomalyStore = create<AnomalyState>((set, get) => ({
  anomalies: initialAnomalies,
  selectedType: null,
  selectedStore: null,
  selectedStatus: null,
  activeAnomalyId: null,
  stats: { missing: 0, duplicate: 0, expiry: 0, unbound: 0 },

  setSelectedType: (type) => set({ selectedType: type }),
  setSelectedStore: (storeId) => set({ selectedStore: storeId }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setActiveAnomaly: (id) => set({ activeAnomalyId: id }),

  addMessage: (anomalyId, content, sender) => {
    const newMessage: Message = {
      id: `m${Date.now()}`,
      anomalyId,
      sender,
      senderRole: 'headquarters',
      content,
      createdAt: new Date().toLocaleString('zh-CN'),
    };

    set((state) => ({
      anomalies: state.anomalies.map((a) =>
        a.id === anomalyId
          ? {
              ...a,
              status: 'processing',
              messages: [...a.messages, newMessage],
            }
          : a
      ),
    }));

    get().computeStats();
  },

  addCorrection: (anomalyId, note, attachmentName, submittedBy) => {
    const newCorrection: Correction = {
      id: `cr${Date.now()}`,
      anomalyId,
      note,
      attachmentName,
      submittedBy,
      submittedAt: new Date().toLocaleString('zh-CN'),
    };

    set((state) => ({
      anomalies: state.anomalies.map((a) =>
        a.id === anomalyId
          ? {
              ...a,
              status: 'processing' as AnomalyStatus,
              corrections: [...a.corrections, newCorrection],
            }
          : a
      ),
    }));

    get().computeStats();
  },

  resolveAnomaly: (anomalyId) => {
    set((state) => ({
      anomalies: state.anomalies.map((a) =>
        a.id === anomalyId ? { ...a, status: 'resolved' as AnomalyStatus } : a
      ),
    }));
    get().computeStats();
  },

  updateAnomalyStatus: (anomalyId, status) => {
    set((state) => ({
      anomalies: state.anomalies.map((a) =>
        a.id === anomalyId ? { ...a, status } : a
      ),
    }));
    get().computeStats();
  },

  getFilteredAnomalies: () => {
    const { anomalies, selectedType, selectedStore, selectedStatus } = get();
    let filtered = [...anomalies];

    if (selectedType) {
      filtered = filtered.filter((a) => a.type === selectedType);
    }
    if (selectedStore) {
      filtered = filtered.filter((a) => a.storeId === selectedStore);
    }
    if (selectedStatus) {
      filtered = filtered.filter((a) => a.status === selectedStatus);
    }

    return filtered.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      const statusOrder = { open: 0, processing: 1, resolved: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  },

  computeStats: () => {
    const { anomalies } = get();
    const stats = computeAnomalyStats(anomalies);
    set({ stats });
  },
}));
