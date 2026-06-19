import { useState, useMemo } from 'react';
import {
  Search,
  History,
  MapPin,
  Calendar,
  User,
  Stethoscope,
  Activity,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  FileDown,
  RefreshCw,
  Layers,
  Store,
  Users,
  Bell,
  XCircle,
  UserCheck,
  PhoneOff,
  UserCircle,
  CalendarDays,
  StickyNote,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useTrackingStore } from '@/store/useTrackingStore';
import { stores } from '@/data';
import { cn } from '@/lib/utils';
import type { TrackingCase } from '@/types';

export function Tracking() {
  const {
    searchKeyword,
    trackingResult,
    searchHistory,
    isSearching,
    recallTaskFilters,
    showRecallView,
    setSearchKeyword,
    searchBatches,
    clearSearch,
    updateRecallStatus,
    updateRecallResult,
    setRecallTaskFilterStore,
    setRecallTaskFilterBatch,
    setRecallTaskFilterStatus,
    updateRecallOwner,
    updatePlannedReviewDate,
    updateContactNotes,
    batchRecallAndEnterView,
    setShowRecallView,
  } = useTrackingStore();

  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [selectedCaseForReview, setSelectedCaseForReview] = useState<TrackingCase | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'completed' | 'unreachable'>('pending');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{ caseId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const uniqueBatchNumbers = useMemo(() => {
    const batches = new Set<string>();
    trackingResult.forEach((group) => {
      group.storeDistributions.forEach((sd) => {
        sd.cases.forEach((c) => batches.add(c.batchNumber));
      });
    });
    return Array.from(batches);
  }, [trackingResult]);

  const allCasesFlat = useMemo(() => {
    const cases: (TrackingCase & { storeName: string; batchNumber: string })[] = [];
    trackingResult.forEach((group) => {
      group.storeDistributions.forEach((sd) => {
        sd.cases.forEach((c) => {
          cases.push({
            ...c,
            storeName: sd.storeName,
            batchNumber: group.batchNumber,
          });
        });
      });
    });
    return cases;
  }, [trackingResult]);

  const filteredCases = useMemo(() => {
    let result = [...allCasesFlat];

    if (recallTaskFilters.storeId) {
      result = result.filter((c) => c.storeId === recallTaskFilters.storeId);
    }

    if (recallTaskFilters.batchNumber) {
      result = result.filter((c) => c.batchNumber === recallTaskFilters.batchNumber);
    }

    if (recallTaskFilters.recallStatus && recallTaskFilters.recallStatus !== '全部') {
      let statusValue: string;
      switch (recallTaskFilters.recallStatus) {
        case '待复查':
          statusValue = 'pending';
          break;
        case '已复查':
          statusValue = 'completed';
          break;
        case '无法联系':
          statusValue = 'unreachable';
          break;
        default:
          statusValue = recallTaskFilters.recallStatus;
      }
      result = result.filter((c) => c.recallStatus === statusValue);
    }

    return result;
  }, [allCasesFlat, recallTaskFilters]);

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      searchBatches(searchKeyword);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const toggleStoreExpand = (storeId: string) => {
    setExpandedStores((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) {
        next.delete(storeId);
      } else {
        next.add(storeId);
      }
      return next;
    });
  };

  const getFollowUpStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <StatusBadge variant="success">已完成随访</StatusBadge>;
      case 'pending':
        return <StatusBadge variant="pending">待随访</StatusBadge>;
      case 'failed':
        return <StatusBadge variant="danger">随访失败</StatusBadge>;
      default:
        return <StatusBadge variant="default">未知</StatusBadge>;
    }
  };

  const getRecallStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <StatusBadge variant="success">已复查</StatusBadge>;
      case 'pending':
        return <StatusBadge variant="warning" pulse>待复查</StatusBadge>;
      case 'unreachable':
        return <StatusBadge variant="danger">无法联系</StatusBadge>;
      default:
        return <StatusBadge variant="default">未召回</StatusBadge>;
    }
  };

  const handleRecall = (caseItem: TrackingCase) => {
    const newStatus = caseItem.recallStatus === 'none' ? 'pending' : caseItem.recallStatus === 'pending' ? 'completed' : 'none';
    updateRecallStatus(caseItem.caseId, newStatus as 'none' | 'pending' | 'completed' | 'unreachable');
  };

  const openReviewModal = (caseItem: TrackingCase, initialStatus: 'pending' | 'completed' | 'unreachable') => {
    setSelectedCaseForReview(caseItem);
    setReviewStatus(initialStatus);
    setReviewNote(caseItem.recallResult?.note || '');
  };

  const closeReviewModal = () => {
    setSelectedCaseForReview(null);
    setReviewNote('');
  };

  const confirmReview = () => {
    if (selectedCaseForReview) {
      updateRecallResult(selectedCaseForReview.caseId, {
        status: reviewStatus,
        note: reviewNote.trim() || undefined,
      });
      closeReviewModal();
    }
  };

  const handleReset = (caseItem: TrackingCase) => {
    updateRecallResult(caseItem.caseId, { status: 'pending' });
  };

  const summaryTotalBatches = trackingResult.length;
  const summaryTotalStores = trackingResult.reduce((sum, g) => sum + g.matchedStores, 0);
  const summaryTotalPatients = trackingResult.reduce((sum, g) => sum + g.totalPatients, 0);
  const summaryPendingRecall = trackingResult.reduce((sum, g) => sum + g.pendingRecall, 0);

  const formatContactedAt = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const startEditing = (caseId: string, field: string, currentValue: string | undefined) => {
    setEditingCell({ caseId, field });
    setEditValue(currentValue || '');
  };

  const saveEditing = () => {
    if (!editingCell) return;

    const { caseId, field } = editingCell;

    switch (field) {
      case 'recallOwner':
        updateRecallOwner(caseId, editValue);
        break;
      case 'plannedReviewDate':
        updatePlannedReviewDate(caseId, editValue);
        break;
      case 'contactNotes':
        updateContactNotes(caseId, editValue);
        break;
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editingCell?.field !== 'contactNotes') {
      e.preventDefault();
      saveEditing();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">批号流向追踪</h2>
            <p className="text-sm text-slate-400 mt-1">
              输入供应商通知的风险批号，快速定位流向门店和使用患者
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
            <textarea
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入风险批号，多个批号用逗号或换行分隔，如 NB-2025-0315-A, STM-2025-0620-X"
              rows={3}
              className="w-full pl-12 pr-28 py-4 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-base resize-none"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchKeyword.trim()}
              className="absolute right-2 bottom-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              搜索
            </button>
          </div>

          {searchHistory.length > 0 && (
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <History className="w-3.5 h-3.5" />
                <span>历史搜索</span>
              </div>
              {searchHistory.slice(0, 5).map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => {
                    setSearchKeyword(keyword);
                    searchBatches(keyword);
                  }}
                  className="px-3 py-1 text-xs bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 hover:text-white transition-colors font-mono"
                >
                  {keyword}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {trackingResult.length > 0 && (
        <>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-sm text-slate-400">匹配批号</p>
                  <p className="text-2xl font-bold text-teal-400 mt-1">
                    {summaryTotalBatches}
                    <span className="text-sm font-normal text-slate-500 ml-1">个</span>
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-sm text-slate-400">覆盖门店</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">
                    {summaryTotalStores}
                    <span className="text-sm font-normal text-slate-500 ml-1">家</span>
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-sm text-slate-400">使用患者</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">
                    {summaryTotalPatients}
                    <span className="text-sm font-normal text-slate-500 ml-1">人</span>
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-sm text-slate-400">待召回</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    {summaryPendingRecall}
                    <span className="text-sm font-normal text-slate-500 ml-1">人</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  清除
                </button>
                <button
                  onClick={batchRecallAndEnterView}
                  disabled={summaryPendingRecall === 0}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors',
                    summaryPendingRecall > 0
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  )}
                >
                  <Bell className="w-4 h-4" />
                  批量发起召回
                </button>
                <button
                  onClick={() => setShowRecallView(!showRecallView)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors',
                    showRecallView
                      ? 'bg-teal-600 hover:bg-teal-500 text-white'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  召回任务视图
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-700 text-white hover:bg-slate-600 rounded-lg transition-colors">
                  <FileDown className="w-4 h-4" />
                  导出报告
                </button>
              </div>
            </div>
          </div>

          {showRecallView ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {trackingResult.map((group) => (
                  <div
                    key={group.batchNumber}
                    className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white font-mono">
                              {group.batchNumber}
                            </h3>
                            <StatusBadge variant="info">
                              {group.brandName}
                            </StatusBadge>
                          </div>
                          <p className="text-slate-400 text-sm mt-0.5">
                            {group.productName} · {group.spec}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center px-5 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <p className="text-2xl font-bold text-amber-400">{group.pendingRecall}</p>
                          <p className="text-xs text-amber-400/80 mt-0.5">待复查</p>
                        </div>
                        <div className="flex flex-col items-center px-5 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <p className="text-2xl font-bold text-emerald-400">{group.completedRecall}</p>
                          <p className="text-xs text-emerald-400/80 mt-0.5">已复查</p>
                        </div>
                        <div className="flex flex-col items-center px-5 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
                          <p className="text-2xl font-bold text-red-400">{group.unreachableRecall}</p>
                          <p className="text-xs text-red-400/80 mt-0.5">无法联系</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400 whitespace-nowrap">门店筛选:</label>
                    <select
                      value={recallTaskFilters.storeId || ''}
                      onChange={(e) => setRecallTaskFilterStore(e.target.value || null)}
                      className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all min-w-[200px]"
                    >
                      <option value="">全部门店</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400 whitespace-nowrap">批号筛选:</label>
                    <select
                      value={recallTaskFilters.batchNumber || ''}
                      onChange={(e) => setRecallTaskFilterBatch(e.target.value || null)}
                      className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all min-w-[200px]"
                    >
                      <option value="">全部批号</option>
                      {uniqueBatchNumbers.map((bn) => (
                        <option key={bn} value={bn}>
                          {bn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400 whitespace-nowrap">复查状态:</label>
                    <select
                      value={recallTaskFilters.recallStatus || '全部'}
                      onChange={(e) => setRecallTaskFilterStatus(e.target.value || null)}
                      className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all min-w-[150px]"
                    >
                      <option value="全部">全部</option>
                      <option value="待复查">待复查</option>
                      <option value="已复查">已复查</option>
                      <option value="无法联系">无法联系</option>
                    </select>
                  </div>

                  <div className="ml-auto text-sm text-slate-400">
                    共 <span className="text-teal-400 font-semibold">{filteredCases.length}</span> 条记录
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="bg-slate-900/50 overflow-hidden border border-slate-700/30">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          患者姓名
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          所属门店
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          风险批号
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          牙位
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          手术日期
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          主刀医生
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          负责人
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          计划复查日期
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          召回状态
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          最近联系时间
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          联系备注
                        </th>
                        <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {filteredCases.map((caseItem) => (
                        <tr
                          key={caseItem.caseId}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-400" />
                              </div>
                              <span className="text-sm text-slate-200 font-medium">
                                {caseItem.patientName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-sm text-slate-300">
                                {caseItem.storeName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-300 font-mono">
                              {caseItem.batchNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-sm font-mono">
                              {caseItem.toothPosition}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-400">
                              {caseItem.surgeryDate}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-sm text-slate-300">
                                {caseItem.doctorName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {editingCell?.caseId === caseItem.caseId && editingCell?.field === 'recallOwner' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEditing}
                                onKeyDown={handleEditKeyDown}
                                autoFocus
                                className="w-full px-2 py-1 bg-slate-900 border border-teal-500 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                              />
                            ) : (
                              <div
                                onClick={() => startEditing(caseItem.caseId, 'recallOwner', caseItem.recallOwner)}
                                className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-700/30 px-2 py-1 rounded transition-colors"
                              >
                                <UserCircle className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-sm text-slate-300">
                                  {caseItem.recallOwner || <span className="text-slate-500">点击分配</span>}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingCell?.caseId === caseItem.caseId && editingCell?.field === 'plannedReviewDate' ? (
                              <input
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEditing}
                                autoFocus
                                className="w-full px-2 py-1 bg-slate-900 border border-teal-500 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                              />
                            ) : (
                              <div
                                onClick={() => startEditing(caseItem.caseId, 'plannedReviewDate', caseItem.plannedReviewDate)}
                                className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-700/30 px-2 py-1 rounded transition-colors"
                              >
                                <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-sm text-slate-300">
                                  {caseItem.plannedReviewDate || <span className="text-slate-500">点击设置</span>}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {getRecallStatusBadge(caseItem.recallStatus)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-400">
                              {formatContactedAt(caseItem.recallResult?.contactedAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            {editingCell?.caseId === caseItem.caseId && editingCell?.field === 'contactNotes' ? (
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEditing}
                                autoFocus
                                rows={2}
                                className="w-full px-2 py-1 bg-slate-900 border border-teal-500 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                              />
                            ) : (
                              <div
                                onClick={() => startEditing(caseItem.caseId, 'contactNotes', caseItem.contactNotes)}
                                className="flex items-start gap-1.5 cursor-pointer hover:bg-slate-700/30 px-2 py-1 rounded transition-colors"
                              >
                                <StickyNote className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-slate-300">
                                  {caseItem.contactNotes || <span className="text-slate-500">点击添加</span>}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(caseItem.recallStatus === 'pending' || caseItem.recallStatus === 'none') && (
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => openReviewModal(caseItem, 'completed')}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  标记已复查
                                </button>
                                <button
                                  onClick={() => openReviewModal(caseItem, 'unreachable')}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 flex items-center gap-1.5"
                                >
                                  <PhoneOff className="w-3.5 h-3.5" />
                                  无法联系
                                </button>
                              </div>
                            )}
                            {(caseItem.recallStatus === 'completed' || caseItem.recallStatus === 'unreachable') && (
                              <button
                                onClick={() => handleReset(caseItem)}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center gap-1.5 ml-auto"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                重置
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {trackingResult.map((group) => (
                <div
                  key={group.batchNumber}
                  className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden"
                >
                  <div className="p-5 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white font-mono">
                              {group.batchNumber}
                            </h3>
                            <StatusBadge variant="info">
                              {group.brandName}
                            </StatusBadge>
                          </div>
                          <p className="text-slate-400 text-sm mt-0.5">
                            {group.productName} · {group.spec}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Store className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-400 font-semibold">{group.matchedStores}</span>
                          <span>家门店</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Users className="w-4 h-4 text-amber-400" />
                          <span className="text-amber-400 font-semibold">{group.totalPatients}</span>
                          <span>名患者</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 font-semibold">{group.pendingRecall}</span>
                          <span>待召回</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0">
                    {group.storeDistributions.map((storeDist) => {
                      const expandKey = `${group.batchNumber}-${storeDist.storeId}`;
                      const isExpanded = expandedStores.has(expandKey);
                      return (
                        <div
                          key={storeDist.storeId}
                          className="border-b border-slate-700/30 last:border-b-0 transition-all duration-300"
                        >
                          <button
                            onClick={() => toggleStoreExpand(expandKey)}
                            className="w-full p-4 pl-8 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-teal-400" />
                              </div>
                              <div className="text-left">
                                <h4 className="font-medium text-white text-sm">{storeDist.storeName}</h4>
                                <p className="text-xs text-slate-400">{storeDist.city}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-5">
                              <div className="text-right">
                                <p className="text-xs text-slate-500">入库 / 已用 / 剩余</p>
                                <p className="text-sm font-medium text-slate-200">
                                  <span className="text-slate-400">{storeDist.quantity}</span>
                                  <span className="mx-1 text-slate-600">/</span>
                                  <span className="text-amber-400">{storeDist.usedQuantity}</span>
                                  <span className="mx-1 text-slate-600">/</span>
                                  <span className="text-teal-400">{storeDist.remainingQuantity}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge variant="info">
                                  {storeDist.cases.length} 例患者
                                </StatusBadge>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-8 pb-4">
                              <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
                                <Calendar className="w-4 h-4" />
                                <span>入库时间：{storeDist.inboundDate}</span>
                              </div>

                              <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/30">
                                <table className="w-full">
                                  <thead className="bg-slate-800/50">
                                    <tr>
                                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                                        患者
                                      </th>
                                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                                        牙位
                                      </th>
                                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                                        手术日期
                                      </th>
                                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                                        主刀医生
                                      </th>
                                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                                        经手护士
                                      </th>
                                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                                        随访状态
                                      </th>
                                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                                        召回状态
                                      </th>
                                      <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                                        操作
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-700/50">
                                    {storeDist.cases.map((caseItem) => (
                                      <tr
                                        key={caseItem.caseId}
                                        className="hover:bg-slate-800/30 transition-colors"
                                      >
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                              <User className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <span className="text-sm text-slate-200 font-medium">
                                              {caseItem.patientName}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-sm font-mono">
                                            {caseItem.toothPosition}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className="text-sm text-slate-400">
                                            {caseItem.surgeryDate}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-1.5">
                                            <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="text-sm text-slate-300">
                                              {caseItem.doctorName}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-1.5">
                                            <Activity className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="text-sm text-slate-300">
                                              {caseItem.nurseName}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          {getFollowUpStatusBadge(caseItem.followUpStatus)}
                                        </td>
                                        <td className="px-4 py-3">
                                          {getRecallStatusBadge(caseItem.recallStatus)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <button
                                            onClick={() => handleRecall(caseItem)}
                                            className={cn(
                                              'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                                              caseItem.recallStatus === 'none'
                                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                                                : caseItem.recallStatus === 'pending'
                                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            )}
                                          >
                                            {caseItem.recallStatus === 'none'
                                              ? '发起召回'
                                              : caseItem.recallStatus === 'pending'
                                              ? '标记已复查'
                                              : '取消召回'}
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {trackingResult.length === 0 && !isSearching && (
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">输入批号开始追踪</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            请在上方搜索框中输入需要追踪的风险批号，支持多个批号同时查询，系统将展示各批号在各门店的流向和使用情况
          </p>
        </div>
      )}

      {selectedCaseForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-lg font-semibold text-white">患者复查结果</h3>
              <button
                onClick={closeReviewModal}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-white">{selectedCaseForReview.patientName}</p>
                    <p className="text-sm text-slate-400">
                      {selectedCaseForReview.toothPosition} · {selectedCaseForReview.surgeryDate}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  召回状态
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as 'pending' | 'completed' | 'unreachable')}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                >
                  <option value="pending">待复查</option>
                  <option value="completed">已复查</option>
                  <option value="unreachable">无法联系</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  备注
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="请输入复查备注信息..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <button
                onClick={closeReviewModal}
                className="px-4 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmReview}
                className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
