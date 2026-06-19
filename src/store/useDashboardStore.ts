import { create } from 'zustand';
import { stores, brands, implantBatches, patientCases, doctors, nurses, anomalies } from '@/data';
import type {
  DashboardStats,
  StoreUsageData,
  ExpiringStockItem,
  UnboundBatchItem,
  FilterState,
  StoreDrillDownData,
} from '@/types';
import { daysFromNow, daysBetween } from '@/utils/date';

interface DashboardState {
  filters: FilterState;
  stats: DashboardStats;
  storeUsage: StoreUsageData[];
  expiringStock: ExpiringStockItem[];
  unboundBatches: UnboundBatchItem[];
  drillDownStoreId: string | null;
  setBrandFilter: (brandId: string | null) => void;
  setStoreFilter: (storeId: string | null) => void;
  setDoctorFilter: (doctorId: string | null) => void;
  setDrillDownStore: (storeId: string | null) => void;
  getStoreDrillDown: (storeId: string) => StoreDrillDownData;
  computeDashboardData: () => void;
}

function computeStats(
  filteredBatches: typeof implantBatches,
  filteredCases: typeof patientCases,
  filteredAnomalies: typeof anomalies
): DashboardStats {
  const usedBatches = filteredBatches.filter((b) => b.status === 'used');
  const totalUsage = usedBatches.reduce((sum, b) => sum + b.quantity, 0);

  const expiringCount = filteredBatches.filter((b) => {
    const daysLeft = daysFromNow(b.expiryDate);
    return daysLeft > 0 && daysLeft <= 90;
  }).length;

  const unboundCount = filteredBatches.filter((b) => {
    const hasCase = filteredCases.some((c) => c.implantBatchId === b.id);
    return b.status === 'used' && !hasCase;
  }).length;

  const anomalyCount = filteredAnomalies.filter((a) => a.status !== 'resolved').length;

  return {
    totalUsage,
    expiringStock: expiringCount,
    unboundBatches: unboundCount,
    totalAnomalies: anomalyCount,
    monthOverMonth: {
      usage: 12.5,
      expiring: -8.3,
      unbound: 5.2,
      anomalies: -15.7,
    },
  };
}

function computeStoreUsage(
  filteredBatches: typeof implantBatches,
  brandFilter: string | null
): StoreUsageData[] {
  const usedBatches = filteredBatches.filter((b) => b.status === 'used');
  const storeMap = new Map<string, StoreUsageData>();

  usedBatches.forEach((batch) => {
    const store = stores.find((s) => s.id === batch.storeId);
    const brand = brands.find((b) => b.id === batch.brandId);
    if (!store || !brand) return;
    if (brandFilter && brand.id !== brandFilter) return;

    if (!storeMap.has(store.id)) {
      storeMap.set(store.id, {
        storeId: store.id,
        storeName: store.name,
        usageCount: 0,
        brandBreakdown: [],
      });
    }

    const data = storeMap.get(store.id)!;
    data.usageCount += batch.quantity;

    const brandIdx = data.brandBreakdown.findIndex((bb) => bb.brandId === brand.id);
    if (brandIdx >= 0) {
      data.brandBreakdown[brandIdx].count += batch.quantity;
    } else {
      data.brandBreakdown.push({
        brandId: brand.id,
        brandName: brand.name,
        count: batch.quantity,
      });
    }
  });

  return Array.from(storeMap.values()).sort((a, b) => b.usageCount - a.usageCount);
}

function computeExpiringStock(filteredBatches: typeof implantBatches): ExpiringStockItem[] {
  const items: ExpiringStockItem[] = [];

  filteredBatches.forEach((batch) => {
    const daysLeft = daysFromNow(batch.expiryDate);
    if (daysLeft <= 0 || daysLeft > 90) return;

    const store = stores.find((s) => s.id === batch.storeId);
    const brand = brands.find((b) => b.id === batch.brandId);
    if (!store || !brand) return;

    items.push({
      id: batch.id,
      batchNumber: batch.batchNumber,
      brandName: brand.name,
      productName: batch.productName,
      spec: batch.spec,
      expiryDate: batch.expiryDate,
      daysLeft,
      quantity: batch.quantity,
      storeId: store.id,
      storeName: store.name,
    });
  });

  return items.sort((a, b) => a.daysLeft - b.daysLeft);
}

function computeUnboundBatches(
  filteredBatches: typeof implantBatches,
  filteredCases: typeof patientCases
): UnboundBatchItem[] {
  const items: UnboundBatchItem[] = [];

  filteredBatches.forEach((batch) => {
    if (batch.status !== 'used') return;
    const hasCase = filteredCases.some((c) => c.implantBatchId === batch.id);
    if (hasCase) return;

    const store = stores.find((s) => s.id === batch.storeId);
    const brand = brands.find((b) => b.id === batch.brandId);
    if (!store || !brand) return;

    const daysSince = daysBetween(batch.inboundDate, new Date());
    const storeNurses = nurses.filter((n) => n.storeId === store.id);
    const nurse = storeNurses.length > 0 ? storeNurses[0] : null;

    items.push({
      id: batch.id,
      batchNumber: batch.batchNumber,
      brandName: brand.name,
      productName: batch.productName,
      outboundDate: batch.inboundDate,
      daysSinceOutbound: daysSince,
      storeId: store.id,
      storeName: store.name,
      nurseName: nurse?.name,
    });
  });

  return items.sort((a, b) => b.daysSinceOutbound - a.daysSinceOutbound);
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  filters: {
    brandId: null,
    storeId: null,
    doctorId: null,
    dateRange: null,
  },
  stats: {
    totalUsage: 0,
    expiringStock: 0,
    unboundBatches: 0,
    totalAnomalies: 0,
    monthOverMonth: { usage: 0, expiring: 0, unbound: 0, anomalies: 0 },
  },
  storeUsage: [],
  expiringStock: [],
  unboundBatches: [],
  drillDownStoreId: null,

  setBrandFilter: (brandId) => {
    set((state) => ({ filters: { ...state.filters, brandId } }));
    get().computeDashboardData();
  },
  setStoreFilter: (storeId) => {
    set((state) => ({ filters: { ...state.filters, storeId } }));
    get().computeDashboardData();
  },
  setDoctorFilter: (doctorId) => {
    set((state) => ({ filters: { ...state.filters, doctorId } }));
    get().computeDashboardData();
  },
  setDrillDownStore: (storeId) => {
    set({ drillDownStoreId: storeId });
  },

  getStoreDrillDown: (storeId) => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) {
      return {
        storeId,
        storeName: '',
        city: '',
        usageCount: 0,
        unboundBatches: [],
        expiringStock: [],
        anomalyList: [],
      };
    }

    const storeBatches = implantBatches.filter((b) => b.storeId === storeId);
    const usageCount = storeBatches
      .filter((b) => b.status === 'used')
      .reduce((sum, b) => sum + b.quantity, 0);

    const storeCases = patientCases.filter((c) => c.storeId === storeId);
    const unboundBatches = computeUnboundBatches(storeBatches, storeCases);
    const expiringStock = computeExpiringStock(storeBatches);
    const anomalyList = anomalies.filter((a) => a.storeId === storeId);

    return {
      storeId: store.id,
      storeName: store.name,
      city: store.city,
      usageCount,
      unboundBatches,
      expiringStock,
      anomalyList,
    };
  },

  computeDashboardData: () => {
    const { filters } = get();

    let filteredCases = [...patientCases];
    if (filters.storeId) {
      filteredCases = filteredCases.filter((c) => c.storeId === filters.storeId);
    }
    if (filters.doctorId) {
      filteredCases = filteredCases.filter((c) => c.doctorId === filters.doctorId);
    }

    let doctorBatchIds: string[] | null = null;
    if (filters.doctorId) {
      const doctorCases = patientCases.filter((c) => c.doctorId === filters.doctorId);
      doctorBatchIds = doctorCases.map((c) => c.implantBatchId);
    }

    let filteredBatches = [...implantBatches];
    if (filters.storeId) {
      filteredBatches = filteredBatches.filter((b) => b.storeId === filters.storeId);
    }
    if (filters.brandId) {
      filteredBatches = filteredBatches.filter((b) => b.brandId === filters.brandId);
    }
    if (doctorBatchIds) {
      filteredBatches = filteredBatches.filter((b) => doctorBatchIds!.includes(b.id));
    }

    if (filters.brandId) {
      const batchIds = filteredBatches.map((b) => b.id);
      filteredCases = filteredCases.filter((c) => batchIds.includes(c.implantBatchId));
    }

    let filteredAnomalies = [...anomalies];
    if (filters.storeId) {
      filteredAnomalies = filteredAnomalies.filter((a) => a.storeId === filters.storeId);
    }
    if (filters.doctorId) {
      const doctor = doctors.find((d) => d.id === filters.doctorId);
      const doctorCaseIds = new Set(filteredCases.map((c) => c.id));
      filteredAnomalies = filteredAnomalies.filter((a) => {
        if (doctor && a.doctorName === doctor.name) return true;
        if (a.caseId && doctorCaseIds.has(a.caseId)) return true;
        return false;
      });
    }

    const stats = computeStats(filteredBatches, filteredCases, filteredAnomalies);
    const storeUsage = computeStoreUsage(filteredBatches, filters.brandId);
    const expiringStock = computeExpiringStock(filteredBatches);
    const unboundBatches = computeUnboundBatches(filteredBatches, filteredCases);

    set({ stats, storeUsage, expiringStock, unboundBatches });
  },
}));
