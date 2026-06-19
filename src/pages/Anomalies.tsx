import { useEffect, useState } from 'react';
import {
  XCircle,
  Copy,
  Clock,
  FileQuestion,
  MessageSquare,
  Send,
  X,
  ChevronDown,
  Filter,
  CheckCircle2,
  Paperclip,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  CalendarDays,
  Info,
  RotateCcw,
  SearchX,
  Archive,
  type LucideIcon
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useAnomalyStore } from '@/store/useAnomalyStore';
import { stores } from '@/data';
import { cn } from '@/lib/utils';
import type { AnomalyType, Anomaly, AnomalyStatus, CorrectionStatus, ExpiryRiskLevel } from '@/types';

const anomalyTypeConfig: Record<AnomalyType, { label: string; icon: LucideIcon; color: string; bg: string; border: string }> = {
  missing: {
    label: '批号缺失',
    icon: FileQuestion,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  duplicate: {
    label: '重复绑定',
    icon: Copy,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  expiry: {
    label: '有效期异常',
    icon: Clock,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  unbound: {
    label: '未绑定病例',
    icon: XCircle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
};

const severityConfig = {
  high: { label: '高危', variant: 'danger' as const },
  medium: { label: '中危', variant: 'warning' as const },
  low: { label: '低危', variant: 'default' as const },
};

const statusConfig: Record<AnomalyStatus, { label: string; variant: 'danger' | 'warning' | 'success' }> = {
  open: { label: '待处理', variant: 'danger' },
  processing: { label: '处理中', variant: 'warning' },
  resolved: { label: '已解决', variant: 'success' },
};

const correctionStatusConfig: Record<CorrectionStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  pending_review: { label: '待质控确认', variant: 'warning' },
  rejected: { label: '已退回', variant: 'danger' },
  approved: { label: '已通过', variant: 'success' },
};

const riskLevelConfig: Record<ExpiryRiskLevel, { label: string; variant: 'danger' | 'warning' | 'success' }> = {
  expired: { label: '已过期', variant: 'danger' },
  near_expiry: { label: '临近过期', variant: 'warning' },
  normal: { label: '正常', variant: 'success' },
};

function getCorrectionsSummary(corrections: Anomaly['corrections']): { label: string; variant: 'warning' | 'danger' | 'success' | 'default'; count: number } | null {
  if (corrections.length === 0) return null;

  const hasPending = corrections.some((c) => c.status === 'pending_review');
  const hasApproved = corrections.some((c) => c.status === 'approved');
  const hasRejected = corrections.some((c) => c.status === 'rejected');

  if (hasPending) {
    return { label: '待确认', variant: 'warning', count: corrections.length };
  }
  if (hasApproved && hasRejected) {
    return { label: '部分通过', variant: 'warning', count: corrections.length };
  }
  if (hasApproved) {
    return { label: '已通过', variant: 'success', count: corrections.length };
  }
  if (hasRejected) {
    return { label: '已退回', variant: 'danger', count: corrections.length };
  }
  return { label: `${corrections.length}补正`, variant: 'default', count: corrections.length };
}

interface MessagePanelProps {
  anomaly: Anomaly | null;
  onClose: () => void;
  onSendMessage: (content: string) => void;
}

function MessagePanel({ anomaly, onClose, onSendMessage }: MessagePanelProps) {
  const [message, setMessage] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<string | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const { addCorrection, resolveAnomaly, rejectCorrection, approveCorrection, reopenAnomaly } = useAnomalyStore();

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleAttachFile = () => {
    setAttachmentName('出库单_补正.pdf');
  };

  const handleSubmitCorrection = () => {
    if (!anomaly || !correctionNote.trim()) return;
    addCorrection(anomaly.id, correctionNote.trim(), attachmentName, '门店负责人');
    setCorrectionNote('');
    setAttachmentName('');
  };

  const handleResolve = () => {
    if (!anomaly) return;
    setResolveDialogOpen(true);
  };

  const handleConfirmResolve = () => {
    if (!anomaly || !resolveNote.trim()) return;
    resolveAnomaly(anomaly.id, resolveNote.trim());
    setResolveDialogOpen(false);
    setResolveNote('');
  };

  const handleCancelResolve = () => {
    setResolveDialogOpen(false);
    setResolveNote('');
  };

  const handleApprove = (correctionId: string) => {
    if (!anomaly) return;
    approveCorrection(anomaly.id, correctionId);
  };

  const handleOpenRejectDialog = (correctionId: string) => {
    setSelectedCorrectionId(correctionId);
    setRejectNote('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!anomaly || !selectedCorrectionId || !rejectNote.trim()) return;
    rejectCorrection(anomaly.id, selectedCorrectionId, rejectNote.trim());
    setRejectDialogOpen(false);
    setSelectedCorrectionId(null);
    setRejectNote('');
  };

  const handleCancelReject = () => {
    setRejectDialogOpen(false);
    setSelectedCorrectionId(null);
    setRejectNote('');
  };

  const handleOpenReopenDialog = () => {
    setReopenReason('');
    setReopenDialogOpen(true);
  };

  const handleConfirmReopen = () => {
    if (!anomaly || !reopenReason.trim()) return;
    reopenAnomaly(anomaly.id, reopenReason.trim());
    setReopenDialogOpen(false);
    setReopenReason('');
  };

  const handleCancelReopen = () => {
    setReopenDialogOpen(false);
    setReopenReason('');
  };

  if (!anomaly) return null;

  const store = stores.find((s) => s.id === anomaly.storeId);
  const typeConfig = anomalyTypeConfig[anomaly.type];
  const hasApprovedCorrection = anomaly.corrections.some((c) => c.status === 'approved');
  const isResolved = anomaly.status === 'resolved';

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-800 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-[slideIn_0.3s_ease-out]">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">异常详情</h3>
          <p className="text-xs text-slate-400 mt-0.5">留言督办</p>
        </div>
        <div className="flex items-center gap-2">
          {isResolved && (
            <button
              onClick={handleOpenReopenDialog}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新开启异常</span>
            </button>
          )}
          {anomaly.status === 'processing' && hasApprovedCorrection && (
            <button
              onClick={handleResolve}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>关闭异常</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {isResolved && (
        <div className="px-4 py-3 bg-emerald-600/10 border-b border-emerald-500/30 flex items-center gap-2">
          <Archive className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">已归档</span>
        </div>
      )}

      <div className="p-4 border-b border-slate-700 space-y-3">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-lg', typeConfig.bg)}>
            <typeConfig.icon className={cn('w-5 h-5', typeConfig.color)} />
          </div>
          <div>
            <p className="font-medium text-white">{typeConfig.label}</p>
            <StatusBadge variant={severityConfig[anomaly.severity].variant} pulse={anomaly.status === 'open'}>
              {severityConfig[anomaly.severity].label}
            </StatusBadge>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">所属门店</span>
            <span className="text-slate-300">{store?.name}</span>
          </div>
          {anomaly.batchNumber && (
            <div className="flex justify-between">
              <span className="text-slate-500">涉及批号</span>
              <span className="text-slate-300 font-mono text-xs">{anomaly.batchNumber}</span>
            </div>
          )}
          {anomaly.patientName && (
            <div className="flex justify-between">
              <span className="text-slate-500">患者姓名</span>
              <span className="text-slate-300">{anomaly.patientName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">发现时间</span>
            <span className="text-slate-300">{anomaly.discoveredAt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">当前状态</span>
            <StatusBadge variant={statusConfig[anomaly.status].variant}>
              {statusConfig[anomaly.status].label}
            </StatusBadge>
          </div>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">问题描述</p>
          <p className="text-sm text-slate-300">{anomaly.description}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {anomaly.messages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无留言记录</p>
          </div>
        ) : (
          anomaly.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[85%]',
                msg.senderRole === 'headquarters' ? 'ml-auto' : 'mr-auto'
              )}
            >
              <div
                className={cn(
                  'rounded-xl px-3 py-2 text-sm',
                  msg.senderRole === 'headquarters'
                    ? 'bg-teal-600/20 text-teal-100 border border-teal-500/30'
                    : 'bg-slate-700 text-slate-200 border border-slate-600'
                )}
              >
                <p className="text-xs font-medium mb-1 opacity-70">{msg.sender}</p>
                <p>{msg.content}</p>
              </div>
              <p
                className={cn(
                  'text-xs text-slate-500 mt-1',
                  msg.senderRole === 'headquarters' ? 'text-right' : 'text-left'
                )}
              >
                {msg.createdAt}
              </p>
            </div>
          ))
        )}

        {anomaly.corrections.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-slate-700/50">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">补正记录</p>
            {anomaly.corrections.map((correction) => (
              <div key={correction.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-300">{correction.note}</p>
                  <StatusBadge variant={correctionStatusConfig[correction.status].variant}>
                    {correctionStatusConfig[correction.status].label}
                  </StatusBadge>
                </div>
                {correction.attachmentName && (
                  <div className="flex items-center gap-1.5 text-xs text-teal-400">
                    <Paperclip className="w-3 h-3" />
                    <span>{correction.attachmentName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{correction.submittedBy}</span>
                  <span>{correction.submittedAt}</span>
                </div>

                {correction.status === 'rejected' && correction.reviewNote && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-md space-y-1">
                    <p className="text-xs text-red-400 font-medium">
                      {correction.reviewedBy} 退回 · {correction.reviewedAt}
                    </p>
                    <p className="text-xs text-red-300">{correction.reviewNote}</p>
                  </div>
                )}

                {correction.status === 'approved' && correction.reviewedBy && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{correction.reviewedBy} 已通过 · {correction.reviewedAt}</span>
                  </div>
                )}

                {!isResolved && correction.status === 'pending_review' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(correction.id)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded-md transition-colors border border-emerald-500/30"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>通过</span>
                    </button>
                    <button
                      onClick={() => handleOpenRejectDialog(correction.id)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium rounded-md transition-colors border border-red-500/30"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span>退回</span>
                    </button>
                  </div>
                )}

                {rejectDialogOpen && selectedCorrectionId === correction.id && (
                  <div className="p-3 bg-slate-800 border border-slate-600 rounded-md space-y-2">
                    <p className="text-xs font-medium text-slate-300">退回原因</p>
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="请输入退回原因..."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleCancelReject}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-md transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleConfirmReject}
                        disabled={!rejectNote.trim()}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        确认退回
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {anomaly.status === 'resolved' && anomaly.resolvedAt && (
              <div className="p-4 bg-emerald-600/10 border border-emerald-500/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">异常已关闭</p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-emerald-300/70">关闭人</span>
                    <span className="text-emerald-200">{anomaly.resolvedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-300/70">关闭时间</span>
                    <span className="text-emerald-200">{anomaly.resolvedAt}</span>
                  </div>
                  {anomaly.resolvedNote && (
                    <div className="pt-2 mt-2 border-t border-emerald-500/20">
                      <p className="text-emerald-300/70 mb-1">结案说明</p>
                      <p className="text-emerald-200">{anomaly.resolvedNote}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {anomaly.reopenCount > 0 && anomaly.reopenedAt && (
              <div className="p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-600 rounded-full">
                    <RotateCcw className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-indigo-400">异常已重新开启</p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-indigo-300/70">重启次数</span>
                    <span className="text-indigo-200">{anomaly.reopenCount} 次</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-300/70">重启人</span>
                    <span className="text-indigo-200">{anomaly.reopenedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-300/70">重启时间</span>
                    <span className="text-indigo-200">{anomaly.reopenedAt}</span>
                  </div>
                  {anomaly.reopenReason && (
                    <div className="pt-2 mt-2 border-t border-indigo-500/20">
                      <p className="text-indigo-300/70 mb-1">重启原因</p>
                      <p className="text-indigo-200">{anomaly.reopenReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!isResolved && (
        <div className="p-4 border-t border-slate-700 space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">门店补正</p>
            <textarea
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
              placeholder="输入补正说明..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAttachFile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{attachmentName || '上传出库单/病例截图'}</span>
              </button>
              <button
                onClick={handleSubmitCorrection}
                disabled={!correctionNote.trim()}
                className="ml-auto px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                提交补正
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入留言内容，发送给门店..."
              rows={3}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {resolveDialogOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-72 space-y-3 shadow-2xl">
            <p className="text-sm font-medium text-white">关闭异常</p>
            <p className="text-xs text-slate-400">请输入结案说明</p>
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="请输入结案说明..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancelResolve}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={!resolveNote.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium rounded-md transition-colors"
              >
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {reopenDialogOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-72 space-y-3 shadow-2xl">
            <p className="text-sm font-medium text-white">重新开启异常</p>
            <p className="text-xs text-slate-400">请输入重启原因</p>
            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="请输入重启原因..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancelReopen}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmReopen}
                disabled={!reopenReason.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium rounded-md transition-colors"
              >
                确认重启
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Anomalies() {
  const {
    stats,
    selectedType,
    selectedStore,
    selectedStatus,
    activeAnomalyId,
    trendFilter,
    setSelectedType,
    setSelectedStore,
    setSelectedStatus,
    setActiveAnomaly,
    addMessage,
    getFilteredAnomalies,
    computeStats,
    anomalies,
    clearTrendFilter,
    getTrendFilterLabel,
  } = useAnomalyStore();

  const [isLoaded, setIsLoaded] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [showJudgementDialog, setShowJudgementDialog] = useState(false);
  const [judgementAnomaly, setJudgementAnomaly] = useState<Anomaly | null>(null);

  useEffect(() => {
    computeStats();
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [computeStats]);

  const filteredAnomalies = getFilteredAnomalies();
  const activeAnomaly = anomalies.find((a) => a.id === activeAnomalyId) || null;

  const handleSendMessage = (content: string) => {
    if (activeAnomalyId) {
      addMessage(activeAnomalyId, content, '质控总部');
    }
  };

  const handleOpenJudgementDialog = (anomaly: Anomaly) => {
    setJudgementAnomaly(anomaly);
    setShowJudgementDialog(true);
  };

  const handleCloseJudgementDialog = () => {
    setShowJudgementDialog(false);
    setJudgementAnomaly(null);
  };

  const statusOptions: { value: AnomalyStatus | null; label: string }[] = [
    { value: null, label: '全部状态' },
    { value: 'open', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'resolved', label: '已解决' },
  ];

  return (
    <div className={`space-y-6 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {trendFilter && (
        <div className="flex items-center justify-between px-4 py-3 bg-teal-500/10 border border-teal-500/30 rounded-xl">
          <div className="flex items-center gap-2">
            <SearchX className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-300">
              🔍 当前钻取范围：{getTrendFilterLabel()}
            </span>
          </div>
          <button
            onClick={clearTrendFilter}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 text-xs font-medium rounded-lg transition-colors border border-teal-500/30"
          >
            <X className="w-3.5 h-3.5" />
            <span>清除筛选</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(anomalyTypeConfig) as AnomalyType[]).map((type) => {
          const config = anomalyTypeConfig[type];
          const Icon = config.icon;
          const count = stats[type];
          const isSelected = selectedType === type;

          return (
            <button
              key={type}
              onClick={() => setSelectedType(isSelected ? null : type)}
              className={cn(
                'p-5 rounded-xl border text-left transition-all duration-200',
                isSelected
                  ? `${config.bg} ${config.border} ring-2 ring-offset-2 ring-offset-slate-900 ring-${type === 'expiry' ? 'red' : type === 'unbound' ? 'rose' : type === 'duplicate' ? 'orange' : 'amber'}-500/30`
                  : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-700'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg', isSelected ? config.bg : 'bg-slate-700/50')}>
                  <Icon className={cn('w-5 h-5', isSelected ? config.color : 'text-slate-400')} />
                </div>
                <div>
                  <p className={cn('text-2xl font-bold', isSelected ? config.color : 'text-white')}>
                    {count}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{config.label}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">筛选</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 hover:bg-slate-750 hover:border-slate-600 transition-colors min-w-[140px]"
            >
              <span className="text-slate-400">状态:</span>
              <span className="flex-1 text-left">
                {statusOptions.find((o) => o.value === selectedStatus)?.label || '全部'}
              </span>
              <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', statusDropdownOpen && 'rotate-180')} />
            </button>
            {statusDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => {
                        setSelectedStatus(option.value);
                        setStatusDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors',
                        selectedStatus === option.value ? 'text-teal-400 bg-teal-500/10' : 'text-slate-300'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 hover:bg-slate-750 hover:border-slate-600 transition-colors min-w-[200px]"
            >
              <span className="text-slate-400">门店:</span>
              <span className="flex-1 text-left truncate">
                {stores.find((s) => s.id === selectedStore)?.name || '全部门店'}
              </span>
              {selectedStore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStore(null);
                  }}
                  className="p-0.5 hover:bg-slate-700 rounded"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
              <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', storeDropdownOpen && 'rotate-180')} />
            </button>
            {storeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStoreDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-full max-h-64 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1">
                  <button
                    onClick={() => {
                      setSelectedStore(null);
                      setStoreDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors',
                      !selectedStore ? 'text-teal-400 bg-teal-500/10' : 'text-slate-300'
                    )}
                  >
                    全部门店
                  </button>
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedStore(store.id);
                        setStoreDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors',
                        selectedStore === store.id ? 'text-teal-400 bg-teal-500/10' : 'text-slate-300'
                      )}
                    >
                      <div>{store.name}</div>
                      <div className="text-xs text-slate-500">{store.city}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {(selectedType || selectedStore || selectedStatus) && (
            <button
              onClick={() => {
                setSelectedType(null);
                setSelectedStore(null);
                setSelectedStatus(null);
              }}
              className="text-sm text-slate-400 hover:text-teal-400 transition-colors"
            >
              清除全部
            </button>
          )}

          <div className="ml-auto text-sm text-slate-400">
            共 <span className="text-white font-medium">{filteredAnomalies.length}</span> 条异常
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/80">
              <tr>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-4">
                  类型
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-4">
                  严重程度
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-4">
                  门店
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-4">
                  病例/批号
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-4">
                  描述
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-4">
                  发现时间
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-4">
                  状态
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-4">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredAnomalies.map((anomaly, index) => {
                const typeConfig = anomalyTypeConfig[anomaly.type];
                const sevConfig = severityConfig[anomaly.severity];
                const statConfig = statusConfig[anomaly.status];
                const store = stores.find((s) => s.id === anomaly.storeId);
                const Icon = typeConfig.icon;
                const correctionsSummary = getCorrectionsSummary(anomaly.corrections);

                return (
                  <tr
                    key={anomaly.id}
                    className={cn(
                      'hover:bg-slate-700/30 transition-colors',
                      anomaly.status === 'resolved' && 'opacity-60'
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('p-2 rounded-lg', typeConfig.bg)}>
                          <Icon className={cn('w-4 h-4', typeConfig.color)} />
                        </div>
                        <span className="text-sm font-medium text-slate-200">{typeConfig.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge variant={sevConfig.variant} pulse={anomaly.status === 'open' && anomaly.severity === 'high'}>
                        {sevConfig.label}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-300">{store?.name}</p>
                      <p className="text-xs text-slate-500">{store?.city}</p>
                    </td>
                    <td className="px-5 py-4">
                      {anomaly.patientName && (
                        <p className="text-sm text-slate-300">
                          {anomaly.patientName}
                          {anomaly.doctorName && <span className="text-slate-500 ml-1">({anomaly.doctorName})</span>}
                        </p>
                      )}
                      {anomaly.batchNumber && (
                        <p className="text-sm font-mono text-teal-400">{anomaly.batchNumber}</p>
                      )}
                      {anomaly.surgeryDate && (
                        <p className="text-xs text-slate-500">{anomaly.surgeryDate}</p>
                      )}
                      {!anomaly.patientName && !anomaly.batchNumber && (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm text-slate-300">{anomaly.description}</p>
                      {anomaly.type === 'expiry' && anomaly.expiryDetail && (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge variant={riskLevelConfig[anomaly.expiryDetail.riskLevel].variant}>
                              {riskLevelConfig[anomaly.expiryDetail.riskLevel].label}
                            </StatusBadge>
                            <button
                              onClick={() => handleOpenJudgementDialog(anomaly)}
                              className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                            >
                              <Info className="w-3 h-3" />
                              <span>查看判断逻辑</span>
                            </button>
                          </div>
                          <p className="text-xs text-slate-500">{anomaly.expiryDetail.judgement}</p>
                        </div>
                      )}
                      {anomaly.type === 'expiry' && !anomaly.expiryDetail && (
                        <div className="mt-1.5 space-y-0.5">
                          <>
                            {anomaly.surgeryDate && (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <CalendarDays className="w-3 h-3" />
                                <span>手术日期: {anomaly.surgeryDate}</span>
                              </div>
                            )}
                            {anomaly.batchExpiryDate && (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <CalendarDays className="w-3 h-3" />
                                <span>批次有效期: {anomaly.batchExpiryDate}</span>
                              </div>
                            )}
                          </>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-400">{anomaly.discoveredAt}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge variant={statConfig.variant}>
                          {statConfig.label}
                        </StatusBadge>
                        {correctionsSummary && (
                          <StatusBadge variant={correctionsSummary.variant}>
                            {correctionsSummary.label}
                          </StatusBadge>
                        )}
                        {anomaly.reopenCount > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            重启{anomaly.reopenCount}次
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setActiveAnomaly(anomaly.id)}
                        className="flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>留言督办</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAnomalies.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
            <p className="text-lg font-medium text-slate-400">暂无异常记录</p>
            <p className="text-sm text-slate-500 mt-1">当前筛选条件下没有异常数据</p>
          </div>
        )}
      </div>

      {showJudgementDialog && judgementAnomaly?.expiryDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-5 w-96 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">有效期异常判断逻辑</p>
              <button
                onClick={handleCloseJudgementDialog}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">手术日期</span>
                <span className="text-slate-200">{judgementAnomaly.expiryDetail.caseSurgeryDate}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">批次有效期</span>
                <span className="text-slate-200">{judgementAnomaly.expiryDetail.batchExpiryDate}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">天数差</span>
                <span className="text-slate-200">{judgementAnomaly.expiryDetail.daysDiff} 天</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">阈值</span>
                <span className="text-slate-200">{judgementAnomaly.expiryDetail.nearExpiryThreshold} 天</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">风险等级</span>
                <StatusBadge variant={riskLevelConfig[judgementAnomaly.expiryDetail.riskLevel].variant}>
                  {riskLevelConfig[judgementAnomaly.expiryDetail.riskLevel].label}
                </StatusBadge>
              </div>
              <div className="pt-2">
                <span className="text-slate-400 text-xs">判断结果</span>
                <p className="text-slate-200 mt-1">{judgementAnomaly.expiryDetail.judgement}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <MessagePanel
        anomaly={activeAnomaly}
        onClose={() => setActiveAnomaly(null)}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
