import { create } from 'zustand';
import { anomalies as initialAnomalies, stores } from '@/data';
import type { Anomaly, AnomalyType, AnomalyStatus, AnomalyStats, Message, Correction, CorrectionStatus } from '@/types';

interface AnomalyState {
  anomalies: Anomaly[];
  selectedType: AnomalyType | null;
  selectedStore: string | null;
  selectedStatus: AnomalyStatus | null;
  activeAnomalyId: string | null;
  stats: AnomalyStats;
  trendFilter: { storeId: string | null; brandId: string | null; month: string | null } | null;
  setSelectedType: (type: AnomalyType | null) => void;
  setSelectedStore: (storeId: string | null) => void;
  setSelectedStatus: (status: AnomalyStatus | null) => void;
  setActiveAnomaly: (id: string | null) => void;
  addMessage: (anomalyId: string, content: string, sender: string) => void;
  addCorrection: (anomalyId: string, note: string, attachmentName: string, submittedBy: string) => void;
  rejectCorrection: (anomalyId: string, correctionId: string, reviewNote: string) => void;
  approveCorrection: (anomalyId: string, correctionId: string) => void;
  resolveAnomaly: (anomalyId: string, note: string) => void;
  updateAnomalyStatus: (anomalyId: string, status: AnomalyStatus) => void;
  getFilteredAnomalies: () => Anomaly[];
  computeStats: () => void;
  setTrendFilter: (filter: { storeId: string | null; brandId: string | null; month: string | null } | null) => void;
  closeAnomaly: (anomalyId: string, note: string) => void;
  reopenAnomaly: (anomalyId: string, reason: string) => void;
  clearTrendFilter: () => void;
  getTrendFilterLabel: () => string;
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
  trendFilter: null,

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
      status: 'pending_review',
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

  rejectCorrection: (anomalyId, correctionId, reviewNote) => {
    set((state) => ({
      anomalies: state.anomalies.map((a) =>
        a.id === anomalyId
          ? {
              ...a,
              status: 'processing' as AnomalyStatus,
              corrections: a.corrections.map((c) =>
                c.id === correctionId
                  ? {
                      ...c,
                      status: 'rejected' as CorrectionStatus,
                      reviewNote,
                      reviewedBy: '质控总部',
                      reviewedAt: new Date().toLocaleString('zh-CN'),
                    }
                  : c
              ),
            }
          : a
      ),
    }));

    get().computeStats();
  },

  approveCorrection: (anomalyId, correctionId) => {
    set((state) => ({
      anomalies: state.anomalies.map((a) =>
        a.id === anomalyId
          ? {
              ...a,
              status: 'processing' as AnomalyStatus,
              corrections: a.corrections.map((c) =>
                c.id === correctionId
                  ? {
                      ...c,
                      status: 'approved' as CorrectionStatus,
                      reviewedBy: '质控总部',
                      reviewedAt: new Date().toLocaleString('zh-CN'),
                    }
                  : c
              ),
            }
          : a
      ),
    }));

    get().computeStats();
  },

  resolveAnomaly: (anomalyId, note) => {
    set((state) => ({
      anomalies: state.anomalies.map((a) =>
        a.id === anomalyId
          ? {
              ...a,
              status: 'resolved' as AnomalyStatus,
              resolvedAt: new Date().toLocaleString('zh-CN'),
              resolvedBy: '质控总部',
              resolvedNote: note,
            }
          : a
      ),
    }));
    get().computeStats();
  },

  reopenAnomaly: (anomalyId, reason) => {
    set((state) => ({
      anomalies: state.anomalies.map((a) =>
        a.id === anomalyId
          ? {
              ...a,
              status: 'processing' as AnomalyStatus,
              reopenedAt: new Date().toLocaleString('zh-CN'),
              reopenedBy: '质控总部',
              reopenReason: reason,
              reopenCount: (a.reopenCount || 0) + 1,
            }
          : a
      ),
    }));
    get().computeStats();
  },

  closeAnomaly: (anomalyId, note) => {
    get().resolveAnomaly(anomalyId, note);
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
    const { anomalies, selectedType, selectedStore, selectedStatus, trendFilter } = get();
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
    if (trendFilter && trendFilter.storeId) {
      filtered = filtered.filter((a) => a.storeId === trendFilter.storeId);
    }
    if (trendFilter && trendFilter.month) {
      filtered = filtered.filter((a) => a.discoveredAt.startsWith(trendFilter.month!));
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

  setTrendFilter: (filter) => {
    set({ trendFilter: filter });
    if (filter && filter.storeId) {
      get().setSelectedStore(filter.storeId);
    }
    get().computeStats();
  },

  clearTrendFilter: () => {
    set({ trendFilter: null });
    get().computeStats();
  },

  getTrendFilterLabel: () => {
    const { trendFilter } = get();
    if (!trendFilter) return '';

    const parts: string[] = [];

    if (trendFilter.month) {
      const [year, month] = trendFilter.month.split('-');
      parts.push(`${year}年${parseInt(month)}月`);
    }

    if (trendFilter.storeId) {
      const store = stores.find((s) => s.id === trendFilter.storeId);
      if (store) {
        parts.push(store.name);
      }
    }

    return parts.join(' · ');
  },
}));
