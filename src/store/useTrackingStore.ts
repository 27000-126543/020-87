import { create } from 'zustand';
import { implantBatches, stores, patientCases, doctors, nurses, brands } from '@/data';
import type { BatchTrackingGroup, StoreDistribution, TrackingCase } from '@/types';

interface TrackingState {
  searchKeyword: string;
  trackingResult: BatchTrackingGroup[];
  searchHistory: string[];
  isSearching: boolean;
  setSearchKeyword: (keyword: string) => void;
  searchBatch: (batchNumber: string) => void;
  searchBatches: (input: string) => void;
  clearSearch: () => void;
  updateRecallStatus: (caseId: string, status: 'none' | 'pending' | 'completed' | 'unreachable') => void;
  batchRecall: () => void;
  updateRecallResult: (caseId: string, result: { status: 'pending' | 'completed' | 'unreachable'; note?: string }) => void;
  markUnreachable: (caseId: string) => void;
}

function buildBatchTrackingGroup(batchNumber: string): BatchTrackingGroup | null {
  const keywordLower = batchNumber.toLowerCase().trim();
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
          recallResult: caseItem.recallResult,
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

  const sortedDistributions = storeDistributions.sort((a, b) => b.usedQuantity - a.usedQuantity);
  const allCases = sortedDistributions.flatMap((sd) => sd.cases);

  return {
    batchNumber: firstBatch.batchNumber,
    brandName: brand?.name || '-',
    productName: firstBatch.productName,
    spec: firstBatch.spec,
    matchedStores: groupedByStore.size,
    totalPatients: allCases.length,
    pendingRecall: allCases.filter((c) => c.recallStatus === 'pending' || c.recallStatus === 'none').length,
    completedRecall: allCases.filter((c) => c.recallStatus === 'completed').length,
    unreachableRecall: allCases.filter((c) => c.recallStatus === 'unreachable').length,
    storeDistributions: sortedDistributions,
  };
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  searchKeyword: '',
  trackingResult: [],
  searchHistory: ['NB-2025-0315', 'STM-2025-0620', 'OS-2025-0228'],
  isSearching: false,

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
  },

  searchBatch: (batchNumber) => {
    set({ isSearching: true });
    const group = buildBatchTrackingGroup(batchNumber);
    const results = group ? [group] : [];

    set((state) => {
      const history = state.searchHistory.filter((h) => h !== batchNumber);
      history.unshift(batchNumber);
      const newHistory = history.slice(0, 10);

      return {
        trackingResult: results,
        searchKeyword: batchNumber,
        searchHistory: newHistory,
        isSearching: false,
      };
    });
  },

  searchBatches: (input) => {
    set({ isSearching: true });

    const batchNumbers = input
      .split(/[,，\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const uniqueBatchNumbers = [...new Set(batchNumbers)];

    const results: BatchTrackingGroup[] = [];
    uniqueBatchNumbers.forEach((bn) => {
      const group = buildBatchTrackingGroup(bn);
      if (group) {
        results.push(group);
      }
    });

    set((state) => {
      const history = [...state.searchHistory];
      uniqueBatchNumbers.forEach((bn) => {
        const idx = history.indexOf(bn);
        if (idx !== -1) history.splice(idx, 1);
        history.unshift(bn);
      });
      const newHistory = history.slice(0, 10);

      return {
        trackingResult: results,
        searchKeyword: input,
        searchHistory: newHistory,
        isSearching: false,
      };
    });
  },

  clearSearch: () => {
    set({ trackingResult: [], searchKeyword: '' });
  },

  updateRecallStatus: (caseId, status) => {
    set((state) => {
      const newResults = state.trackingResult.map((group) => ({
        ...group,
        storeDistributions: group.storeDistributions.map((sd) => ({
          ...sd,
          cases: sd.cases.map((c) =>
            c.caseId === caseId ? { ...c, recallStatus: status } : c
          ),
        })),
      }));

      return {
        trackingResult: newResults.map((g) => {
          const groupCases = g.storeDistributions.flatMap((sd) => sd.cases);
          return {
            ...g,
            pendingRecall: groupCases.filter((c) => c.recallStatus === 'pending' || c.recallStatus === 'none').length,
            completedRecall: groupCases.filter((c) => c.recallStatus === 'completed').length,
            unreachableRecall: groupCases.filter((c) => c.recallStatus === 'unreachable').length,
          };
        }),
      };
    });
  },

  batchRecall: () => {
    set((state) => {
      const newResults = state.trackingResult.map((group) => {
        const newDistributions = group.storeDistributions.map((sd) => ({
          ...sd,
          cases: sd.cases.map((c) =>
            c.recallStatus === 'none' ? { ...c, recallStatus: 'pending' as const } : c
          ),
        }));

        const groupCases = newDistributions.flatMap((sd) => sd.cases);
        const pendingCount = groupCases.filter((c) => c.recallStatus === 'pending' || c.recallStatus === 'none').length;
        const completedCount = groupCases.filter((c) => c.recallStatus === 'completed').length;
        const unreachableCount = groupCases.filter((c) => c.recallStatus === 'unreachable').length;

        return {
          ...group,
          storeDistributions: newDistributions,
          pendingRecall: pendingCount,
          completedRecall: completedCount,
          unreachableRecall: unreachableCount,
        };
      });

      return { trackingResult: newResults };
    });
  },

  updateRecallResult: (caseId, result) => {
    set((state) => {
      const now = new Date().toISOString();

      const newResults = state.trackingResult.map((group) => ({
        ...group,
        storeDistributions: group.storeDistributions.map((sd) => ({
          ...sd,
          cases: sd.cases.map((c) => {
            if (c.caseId !== caseId) return c;

            if (result.status === 'completed') {
              return {
                ...c,
                recallStatus: result.status,
                recallResult: {
                  rechecked: true,
                  contactedAt: now,
                  note: result.note,
                },
              };
            }

            if (result.status === 'unreachable') {
              return {
                ...c,
                recallStatus: result.status,
                recallResult: {
                  rechecked: false,
                  contactedAt: now,
                  note: result.note,
                },
              };
            }

            if (result.status === 'pending') {
              return {
                ...c,
                recallStatus: result.status,
                recallResult: undefined,
              };
            }

            return c;
          }),
        })),
      }));

      return {
        trackingResult: newResults.map((g) => {
          const groupCases = g.storeDistributions.flatMap((sd) => sd.cases);
          return {
            ...g,
            pendingRecall: groupCases.filter((c) => c.recallStatus === 'pending' || c.recallStatus === 'none').length,
            completedRecall: groupCases.filter((c) => c.recallStatus === 'completed').length,
            unreachableRecall: groupCases.filter((c) => c.recallStatus === 'unreachable').length,
          };
        }),
      };
    });
  },

  markUnreachable: (caseId) => {
    get().updateRecallResult(caseId, { status: 'unreachable' });
  },
}));
