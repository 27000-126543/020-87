import type { Anomaly, Correction, ExpiryAnomalyDetail, ExpiryRiskLevel } from '@/types';
import { patientCases, implantBatches, doctors } from '@/data';

const NEAR_EXPIRY_THRESHOLD = 90;

function parseDate(dateStr: string): Date {
  return new Date(dateStr.replace(/-/g, '/'));
}

function daysBetween(date1: string, date2: string): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  const diff = d2.getTime() - d1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function buildExpiryAnomalyDetail(
  caseItem: typeof patientCases[0],
  batch: typeof implantBatches[0]
): ExpiryAnomalyDetail {
  const daysDiff = daysBetween(caseItem.surgeryDate, batch.expiryDate);
  const expiredAtSurgery = daysDiff <= 0;
  const nearExpiry = daysDiff > 0 && daysDiff <= NEAR_EXPIRY_THRESHOLD;
  let riskLevel: ExpiryRiskLevel = 'normal';
  let judgement = '';

  if (expiredAtSurgery) {
    riskLevel = 'expired';
    judgement = `手术时种植体已过期 ${Math.abs(daysDiff)} 天，属于严重质量问题`;
  } else if (nearExpiry) {
    riskLevel = 'near_expiry';
    judgement = `种植体距过期仅 ${daysDiff} 天，临近有效期，建议优先使用并密切关注`;
  } else {
    riskLevel = 'normal';
    judgement = `距过期还有 ${daysDiff} 天，在正常范围内`;
  }

  return {
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    batchExpiryDate: batch.expiryDate,
    caseId: caseItem.id,
    caseSurgeryDate: caseItem.surgeryDate,
    daysDiff,
    expiredAtSurgery,
    nearExpiryThreshold: NEAR_EXPIRY_THRESHOLD,
    riskLevel,
    judgement,
  };
}

function generateExpiryAnomalies(): Anomaly[] {
  const result: Anomaly[] = [];
  let expiryIndex = 8;

  patientCases.forEach((caseItem) => {
    const batch = implantBatches.find((b) => b.id === caseItem.implantBatchId);
    if (!batch) return;

    const detail = buildExpiryAnomalyDetail(caseItem, batch);

    if (detail.riskLevel === 'normal') return;

    const doctor = doctors.find((d) => d.id === caseItem.doctorId);
    const severity = detail.riskLevel === 'expired' ? 'high' : 'medium';

    const description =
      detail.riskLevel === 'expired'
        ? `严重：该病例手术时种植体已过期 ${Math.abs(detail.daysDiff)} 天（有效期 ${batch.expiryDate}，手术日期 ${caseItem.surgeryDate}）`
        : `预警：该病例使用的种植体距过期仅 ${detail.daysDiff} 天（有效期 ${batch.expiryDate}，手术日期 ${caseItem.surgeryDate}）`;

    result.push({
      id: `a${String(expiryIndex).padStart(3, '0')}`,
      type: 'expiry',
      severity,
      storeId: caseItem.storeId,
      batchNumber: batch.batchNumber,
      batchExpiryDate: batch.expiryDate,
      description,
      caseId: caseItem.id,
      patientName: caseItem.patientName,
      doctorName: doctor?.name,
      surgeryDate: caseItem.surgeryDate,
      expiryDetail: detail,
      discoveredAt: caseItem.surgeryDate,
      status: 'open',
      messages: [],
      corrections: [],
    });

    expiryIndex++;
  });

  return result;
}

const correctionsFromHistory: Record<string, Correction[]> = {
  a003: [
    { id: 'cr001', anomalyId: 'a003', note: '已补录病例信息，患者张某于8月12日行种植手术，因系统延迟未能及时录入。', attachmentName: '出库单_ZB-2025-0505-Q.pdf', submittedBy: '深圳南山店-周颖', submittedAt: '2025-08-16 09:30', status: 'approved', reviewedBy: '质控总部', reviewedAt: '2025-08-17 10:00' },
  ],
  a007: [
    { id: 'cr002', anomalyId: 'a007', note: '经核查为护士录入时选错批号，实际使用批号为DT-2025-0620-R，已更正系统记录。', attachmentName: '更正记录_DT-2025-0110-U.png', submittedBy: '武汉江汉店-林薇', submittedAt: '2025-08-09 10:15', status: 'pending_review' },
  ],
  a014: [
    { id: 'cr004', anomalyId: 'a014', note: '系统规格字段已修正为4.0x11.5mm，与实际使用一致。', attachmentName: '规格更正截图.png', submittedBy: '南京鼓楼店-何霞', submittedAt: '2025-08-21 09:45', status: 'approved', reviewedBy: '质控总部', reviewedAt: '2025-08-22 10:30' },
  ],
};

const baseAnomalies: Anomaly[] = [
  {
    id: 'a001',
    type: 'unbound',
    severity: 'high',
    storeId: 's001',
    batchNumber: 'NB-2025-0315-A',
    description: '种植体已出库7天，尚未绑定病例记录，存在先用后补录风险',
    discoveredAt: '2025-08-18',
    status: 'open',
    messages: [],
    corrections: [],
  },
  {
    id: 'a002',
    type: 'unbound',
    severity: 'medium',
    storeId: 's002',
    batchNumber: 'OS-2025-0228-M',
    description: '种植体已出库3天，尚未绑定病例记录',
    discoveredAt: '2025-08-22',
    status: 'open',
    messages: [],
    corrections: [],
  },
  {
    id: 'a003',
    type: 'unbound',
    severity: 'high',
    storeId: 's004',
    batchNumber: 'ZB-2025-0505-Q',
    description: '种植体已出库12天，尚未绑定病例记录，存在先用后补录风险',
    discoveredAt: '2025-08-13',
    status: 'processing',
    messages: [
      { id: 'm001', anomalyId: 'a003', sender: '质控总部', senderRole: 'headquarters', content: '请尽快补录该批号对应的病例信息，注意规范操作流程。', createdAt: '2025-08-15 10:30' },
      { id: 'm002', anomalyId: 'a003', sender: '深圳南山店', senderRole: 'store', content: '收到，正在核对相关病例，预计今天内完成补录。', createdAt: '2025-08-15 14:20' },
    ],
    corrections: correctionsFromHistory.a003,
    resolvedAt: '2025-08-17 11:00',
    resolvedBy: '质控总部',
    resolvedNote: '补正资料审核通过，已完成病例绑定，异常关闭。',
  },
  {
    id: 'a004',
    type: 'missing',
    severity: 'high',
    storeId: 's003',
    batchNumber: '',
    description: '病例的种植体批号缺失，手术记录中未填写批号信息',
    caseId: 'c013',
    patientName: '陈志强',
    doctorName: '黄志强',
    surgeryDate: '2025-07-20',
    discoveredAt: '2025-07-25',
    status: 'open',
    messages: [],
    corrections: [],
  },
  {
    id: 'a005',
    type: 'missing',
    severity: 'medium',
    storeId: 's005',
    batchNumber: '',
    description: '病例的种植体批号缺失，护士交接记录不完整',
    caseId: 'c024',
    patientName: '何美玲',
    doctorName: '周逸飞',
    surgeryDate: '2025-08-05',
    discoveredAt: '2025-08-10',
    status: 'processing',
    messages: [
      { id: 'm003', anomalyId: 'a005', sender: '质控总部', senderRole: 'headquarters', content: '请补全该病例的种植体批号信息，并提供出库单。', createdAt: '2025-08-12 09:15' },
    ],
    corrections: [],
  },
  {
    id: 'a006',
    type: 'duplicate',
    severity: 'high',
    storeId: 's006',
    batchNumber: 'STM-2025-0214-I',
    description: '同一批号被绑定到多个病例，请核实是否有串货或记录错误',
    caseId: 'c028',
    patientName: '孔志强',
    doctorName: '孙婉清',
    surgeryDate: '2025-07-25',
    discoveredAt: '2025-08-01',
    status: 'open',
    messages: [],
    corrections: [],
  },
  {
    id: 'a007',
    type: 'duplicate',
    severity: 'medium',
    storeId: 's007',
    batchNumber: 'DT-2025-0110-U',
    description: '批号重复绑定疑似病例，请核实种植体使用记录',
    caseId: 'c033',
    patientName: '魏文博',
    doctorName: '冯雅琴',
    surgeryDate: '2025-07-28',
    discoveredAt: '2025-08-05',
    status: 'processing',
    messages: [
      { id: 'm004', anomalyId: 'a007', sender: '质控总部', senderRole: 'headquarters', content: '请核查该批号的实际使用情况，确认是否存在记录错误。', createdAt: '2025-08-07 11:00' },
      { id: 'm005', anomalyId: 'a007', sender: '武汉江汉店', senderRole: 'store', content: '已核实，是护士录入错误，已更正。', createdAt: '2025-08-08 16:45' },
    ],
    corrections: correctionsFromHistory.a007,
  },
  {
    id: 'a012',
    type: 'unbound',
    severity: 'low',
    storeId: 's008',
    batchNumber: 'OS-2024-1201-P',
    description: '种植体已出库1天，尚未绑定病例记录',
    discoveredAt: '2025-08-24',
    status: 'open',
    messages: [],
    corrections: [],
  },
  {
    id: 'a013',
    type: 'missing',
    severity: 'low',
    storeId: 's001',
    batchNumber: 'STM-2025-0620-X',
    description: '病例的随访记录不完整，缺少术后一周复查记录',
    caseId: 'c005',
    patientName: '刘志强',
    doctorName: '李建国',
    surgeryDate: '2025-08-05',
    discoveredAt: '2025-08-20',
    status: 'open',
    messages: [],
    corrections: [],
  },
  {
    id: 'a014',
    type: 'duplicate',
    severity: 'low',
    storeId: 's008',
    batchNumber: 'ZB-2025-0228-W',
    description: '同一批号绑定多个病例，已确认是不同规格，请确认系统记录',
    caseId: 'c040',
    patientName: '章慧敏',
    doctorName: '许明辉',
    surgeryDate: '2025-08-15',
    discoveredAt: '2025-08-18',
    status: 'resolved',
    messages: [
      { id: 'm008', anomalyId: 'a014', sender: '质控总部', senderRole: 'headquarters', content: '请核实该批号的详细规格信息。', createdAt: '2025-08-19 09:30' },
      { id: 'm009', anomalyId: 'a014', sender: '南京鼓楼店', senderRole: 'store', content: '已确认，是系统中规格字段录入有误，已修正。', createdAt: '2025-08-20 14:00' },
    ],
    corrections: correctionsFromHistory.a014,
    resolvedAt: '2025-08-22 11:30',
    resolvedBy: '质控总部',
    resolvedNote: '补正资料审核通过，系统记录已更正，异常关闭。',
  },
  {
    id: 'a015',
    type: 'unbound',
    severity: 'medium',
    storeId: 's003',
    batchNumber: 'BC-2025-0601-V',
    description: '种植体已出库5天，尚未绑定病例记录',
    discoveredAt: '2025-08-19',
    status: 'open',
    messages: [],
    corrections: [],
  },
];

const expiryAnomalies = generateExpiryAnomalies();

const a009Corrections: Correction[] = [
  { id: 'cr003', anomalyId: 'a009', note: '已更换为有效期内的同规格种植体，原批次已退回供应商。', attachmentName: '退回凭证_DS-2024-1015-02.pdf', submittedBy: '深圳南山店-吴婷', submittedAt: '2025-08-22 11:00', status: 'rejected', reviewNote: '请补充更换后的种植体出库单和病例截图。', reviewedBy: '质控总部', reviewedAt: '2025-08-23 09:15' },
  { id: 'cr003b', anomalyId: 'a009', note: '已补充更换后的出库单和病例截图，请查阅附件。', attachmentName: '更换凭证及病例_DS-2024-1015-02.zip', submittedBy: '深圳南山店-吴婷', submittedAt: '2025-08-24 14:20', status: 'approved', reviewedBy: '质控总部', reviewedAt: '2025-08-25 10:00' },
];

if (expiryAnomalies.length > 0) {
  const firstExpiry = expiryAnomalies.find((a) => a.expiryDetail?.riskLevel === 'expired');
  if (firstExpiry) {
    firstExpiry.id = 'a009';
    firstExpiry.status = 'resolved';
    firstExpiry.messages = [
      { id: 'm006', anomalyId: 'a009', sender: '质控总部', senderRole: 'headquarters', content: '该问题非常严重，请立即核查并采取补救措施。', createdAt: '2025-08-06 10:00' },
      { id: 'm007', anomalyId: 'a009', sender: '深圳南山店', senderRole: 'store', content: '已为患者安排免费复查和更换种植体，患者无不适反应。', createdAt: '2025-08-20 15:30' },
    ];
    firstExpiry.corrections = a009Corrections;
    firstExpiry.resolvedAt = '2025-08-25 11:00';
    firstExpiry.resolvedBy = '质控总部';
    firstExpiry.resolvedNote = '患者已完成补救治疗，资料齐全，异常关闭。';
  }
}

export const anomalies: Anomaly[] = [...baseAnomalies, ...expiryAnomalies];
