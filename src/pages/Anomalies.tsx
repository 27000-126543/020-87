import { useEffect, useState } from 'react';
import {
  AlertTriangle,
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
  CheckCircle
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useAnomalyStore } from '@/store/useAnomalyStore';
import { stores } from '@/data';
import { cn } from '@/lib/utils';
import type { AnomalyType, Anomaly, AnomalyStatus } from '@/types';

const anomalyTypeConfig: Record<AnomalyType, { label: string; icon: any; color: string; bg: string; border: string }> = {
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

interface MessagePanelProps {
  anomaly: Anomaly | null;
  onClose: () => void;
  onSendMessage: (content: string) => void;
}

function MessagePanel({ anomaly, onClose, onSendMessage }: MessagePanelProps) {
  const [message, setMessage] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const { addCorrection, resolveAnomaly } = useAnomalyStore();

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
    resolveAnomaly(anomaly.id);
  };

  if (!anomaly) return null;

  const store = stores.find((s) => s.id === anomaly.storeId);
  const typeConfig = anomalyTypeConfig[anomaly.type];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-800 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-[slideIn_0.3s_ease-out]">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">异常详情</h3>
          <p className="text-xs text-slate-400 mt-0.5">留言督办</p>
        </div>
        <div className="flex items-center gap-2">
          {anomaly.status === 'processing' && anomaly.corrections.length > 0 && (
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
                <p className="text-sm text-slate-300">{correction.note}</p>
                <div className="flex items-center gap-1.5 text-xs text-teal-400">
                  <Paperclip className="w-3 h-3" />
                  <span>{correction.attachmentName}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{correction.submittedBy}</span>
                  <span>{correction.submittedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    setSelectedType,
    setSelectedStore,
    setSelectedStatus,
    setActiveAnomaly,
    addMessage,
    getFilteredAnomalies,
    computeStats,
    anomalies,
  } = useAnomalyStore();

  const [isLoaded, setIsLoaded] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);

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

  const statusOptions: { value: AnomalyStatus | null; label: string }[] = [
    { value: null, label: '全部状态' },
    { value: 'open', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'resolved', label: '已解决' },
  ];

  return (
    <div className={`space-y-6 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
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
                      <p className="text-sm text-slate-400 truncate">{anomaly.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-400">{anomaly.discoveredAt}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge variant={statConfig.variant}>
                          {statConfig.label}
                        </StatusBadge>
                        {anomaly.corrections.length > 0 && (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-teal-500/20 text-teal-400 rounded-full">
                            {anomaly.corrections.length}补正
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

      <MessagePanel
        anomaly={activeAnomaly}
        onClose={() => setActiveAnomaly(null)}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
