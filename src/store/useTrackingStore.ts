import { create } from 'zustand';
import { implantBatches, stores, patientCases, doctors, nurses, brands } from '@/data';
import type { TrackingResult, StoreDistribution, TrackingCase } from '@/types';

interface TrackingState {
  searchKeyword: string;
  trackingResult: TrackingResult | null;
  searchHistory: string[];
  isSearching: boolean;
  setSearchKeyword: (keyword: string) => void;
  searchBatch: (batchNumber: string) => void;
  clearSearch: () => void;
  updateRecallStatus: (caseId: string, status: 'none' | 'pending' | 'completed') => void;
}

function searchBatchNumber(keyword: string): TrackingResult | null {
  const keywordLower = keyword.toLowerCase().trim();
  if (!keywordLower) return null;

  const matchedBatches = implantBatches.filter((b) =>
    b.batchNumber.toLowerCase().includes(keywordLower)
  );

  if (matchedBatches.length === 0) return null;

  const firstBatch = matchedBatches[0];
  const brand = brands.find((b) => b.id === firstBatch.brandId);

  const storeDistributions: StoreDistribution[] = [];
  const groupedByStore = new Map<string, typeof matchedBatches>();

  matchedBatches.forEach((batch) => {
    if (!groupedByStore.has(batch.storeId)) {
      groupedByStore.set(batch.storeId, []);
    }
    groupedByStore.get(batch.storeId)!.push(batch);
  });

  groupedByStore.forEach((batches, storeId) => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    const totalQty = batches.reduce((sum, b) => sum + b.quantity, 0);
    const usedQty = batches.filter((b) => b.status === 'used').reduce((sum, b) => sum + b.quantity, 0);

    const cases: TrackingCase[] = [];
    const batchIds = batches.map((b) => b.id);

    patientCases
      .filter((c) => batchIds.includes(c.implantBatchId))
      .forEach((caseItem) => {
        const doctor = doctors.find((d) => d.id === caseItem.doctorId);
        const nurse = nurses.find((n) => n.id === caseItem.nurseId);

        cases.push({
          caseId: caseItem.id,
          patientName: caseItem.patientName,
          toothPosition: caseItem.toothPosition,
          surgeryDate: caseItem.surgeryDate,
          doctorName: doctor?.name || '-',
          nurseName: nurse?.name || '-',
          followUpStatus: caseItem.followUpStatus,
          followUpDate: caseItem.followUpDate,
          recallStatus: caseItem.recallStatus || 'none',
        });
      });

    storeDistributions.push({
      storeId: store.id,
      storeName: store.name,
      city: store.city,
      inboundDate: batches[0]?.inboundDate || '',
      quantity: totalQty,
      usedQuantity: usedQty,
      remainingQuantity: totalQty - usedQty,
      cases,
    });
  });

  return {
    batchNumber: firstBatch.batchNumber,
    brandName: brand?.name || '-',
    productName: firstBatch.productName,
    spec: firstBatch.spec,
    totalQuantity: matchedBatches.reduce((sum, b) => sum + b.quantity, 0),
    storeDistributions: storeDistributions.sort((a, b) => b.usedQuantity - a.usedQuantity),
  };
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  searchKeyword: '',
  trackingResult: null,
  searchHistory: ['NB-2025-0315', 'STM-2025-0620', 'OS-2025-0228'],
  isSearching: false,

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
  },

  searchBatch: (batchNumber) => {
    set({ isSearching: true });
    const result = searchBatchNumber(batchNumber);

    set((state) => {
      const history = state.searchHistory.filter((h) => h !== batchNumber);
      history.unshift(batchNumber);
      const newHistory = history.slice(0, 10);

      return {
        trackingResult: result,
        searchKeyword: batchNumber,
        searchHistory: newHistory,
        isSearching: false,
      };
    });
  },

  clearSearch: () => {
    set({ trackingResult: null, searchKeyword: '' });
  },

  updateRecallStatus: (caseId, status) => {
    set((state) => {
      if (!state.trackingResult) return state;

      const newDistributions = state.trackingResult.storeDistributions.map((sd) => ({
        ...sd,
        cases: sd.cases.map((c) =>
          c.caseId === caseId ? { ...c, recallStatus: status } : c
        ),
      }));

      return {
        trackingResult: {
          ...state.trackingResult,
          storeDistributions: newDistributions,
        },
      };
    });
  },
}));
