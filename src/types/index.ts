export interface Store {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface Brand {
  id: string;
  name: string;
  country: string;
}

export interface ImplantBatch {
  id: string;
  batchNumber: string;
  brandId: string;
  productName: string;
  spec: string;
  expiryDate: string;
  quantity: number;
  storeId: string;
  inboundDate: string;
  status: 'in_stock' | 'used' | 'expired';
}

export interface Doctor {
  id: string;
  name: string;
  storeId: string;
  title: string;
}

export interface Nurse {
  id: string;
  name: string;
  storeId: string;
}

export interface PatientCase {
  id: string;
  patientName: string;
  patientId: string;
  storeId: string;
  doctorId: string;
  nurseId: string;
  implantBatchId: string;
  toothPosition: string;
  surgeryDate: string;
  followUpStatus: 'pending' | 'completed' | 'failed';
  followUpDate?: string;
  recallStatus?: 'none' | 'pending' | 'completed';
}

export type AnomalyType = 'missing' | 'duplicate' | 'expiry' | 'unbound';
export type AnomalySeverity = 'high' | 'medium' | 'low';
export type AnomalyStatus = 'open' | 'processing' | 'resolved';

export interface Message {
  id: string;
  anomalyId: string;
  sender: string;
  senderRole: 'headquarters' | 'store';
  content: string;
  createdAt: string;
}

export interface Correction {
  id: string;
  anomalyId: string;
  note: string;
  attachmentName: string;
  submittedBy: string;
  submittedAt: string;
}

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  storeId: string;
  batchNumber?: string;
  description: string;
  caseId?: string;
  patientName?: string;
  doctorName?: string;
  surgeryDate?: string;
  discoveredAt: string;
  status: AnomalyStatus;
  messages: Message[];
  corrections: Correction[];
}

export interface DashboardStats {
  totalUsage: number;
  expiringStock: number;
  unboundBatches: number;
  totalAnomalies: number;
  monthOverMonth: {
    usage: number;
    expiring: number;
    unbound: number;
    anomalies: number;
  };
}

export interface StoreUsageData {
  storeId: string;
  storeName: string;
  usageCount: number;
  brandBreakdown: { brandId: string; brandName: string; count: number }[];
}

export interface ExpiringStockItem {
  id: string;
  batchNumber: string;
  brandName: string;
  productName: string;
  spec: string;
  expiryDate: string;
  daysLeft: number;
  quantity: number;
  storeId: string;
  storeName: string;
}

export interface UnboundBatchItem {
  id: string;
  batchNumber: string;
  brandName: string;
  productName: string;
  outboundDate: string;
  daysSinceOutbound: number;
  storeId: string;
  storeName: string;
  nurseName?: string;
}

export interface StoreDrillDownData {
  storeId: string;
  storeName: string;
  city: string;
  usageCount: number;
  unboundBatches: UnboundBatchItem[];
  expiringStock: ExpiringStockItem[];
  anomalyList: Anomaly[];
}

export interface BatchTrackingGroup {
  batchNumber: string;
  brandName: string;
  productName: string;
  spec: string;
  matchedStores: number;
  totalPatients: number;
  pendingRecall: number;
  storeDistributions: StoreDistribution[];
}

export interface TrackingResult {
  batchNumber: string;
  brandName: string;
  productName: string;
  spec: string;
  totalQuantity: number;
  storeDistributions: StoreDistribution[];
}

export interface StoreDistribution {
  storeId: string;
  storeName: string;
  city: string;
  inboundDate: string;
  quantity: number;
  usedQuantity: number;
  remainingQuantity: number;
  cases: TrackingCase[];
}

export interface TrackingCase {
  caseId: string;
  patientName: string;
  toothPosition: string;
  surgeryDate: string;
  doctorName: string;
  nurseName: string;
  followUpStatus: 'pending' | 'completed' | 'failed';
  followUpDate?: string;
  recallStatus: 'none' | 'pending' | 'completed';
}

export interface AnomalyStats {
  missing: number;
  duplicate: number;
  expiry: number;
  unbound: number;
}

export type FilterState = {
  brandId: string | null;
  storeId: string | null;
  doctorId: string | null;
  dateRange: { start: string; end: string } | null;
};
