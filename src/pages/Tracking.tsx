import { useState } from 'react';
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
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  FileDown,
  RefreshCw
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useTrackingStore } from '@/store/useTrackingStore';
import { cn } from '@/lib/utils';
import type { TrackingCase } from '@/types';

export function Tracking() {
  const {
    searchKeyword,
    trackingResult,
    searchHistory,
    isSearching,
    setSearchKeyword,
    searchBatch,
    clearSearch,
    updateRecallStatus,
  } = useTrackingStore();

  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      searchBatch(searchKeyword);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
      default:
        return <StatusBadge variant="default">未召回</StatusBadge>;
    }
  };

  const handleRecall = (caseItem: TrackingCase) => {
    const newStatus = caseItem.recallStatus === 'none' ? 'pending' : caseItem.recallStatus === 'pending' ? 'completed' : 'none';
    updateRecallStatus(caseItem.caseId, newStatus as any);
  };

  const totalPatients = trackingResult?.storeDistributions.reduce(
    (sum, sd) => sum + sd.cases.length,
    0
  ) || 0;

  const pendingRecall = trackingResult?.storeDistributions.reduce(
    (sum, sd) => sum + sd.cases.filter((c) => c.recallStatus === 'pending').length,
    0
  ) || 0;

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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入种植体批号，如 NB-2025-0315-A"
              className="w-full pl-12 pr-28 py-4 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-lg"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchKeyword.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
                    searchBatch(keyword);
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

      {trackingResult && (
        <>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white font-mono">
                    {trackingResult.batchNumber}
                  </h3>
                  <StatusBadge variant="info">
                    {trackingResult.brandName}
                  </StatusBadge>
                </div>
                <p className="text-slate-400 mt-2">
                  {trackingResult.productName} · {trackingResult.spec}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  清除
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-700 text-white hover:bg-slate-600 rounded-lg transition-colors">
                  <FileDown className="w-4 h-4" />
                  导出报告
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm text-slate-400">总入库数量</p>
                <p className="text-2xl font-bold text-teal-400 mt-1">
                  {trackingResult.totalQuantity}
                  <span className="text-sm font-normal text-slate-500 ml-1">颗</span>
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm text-slate-400">覆盖门店</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {trackingResult.storeDistributions.length}
                  <span className="text-sm font-normal text-slate-500 ml-1">家</span>
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm text-slate-400">使用患者</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {totalPatients}
                  <span className="text-sm font-normal text-slate-500 ml-1">人</span>
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm text-slate-400">待复查</p>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {pendingRecall}
                  <span className="text-sm font-normal text-slate-500 ml-1">人</span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {trackingResult.storeDistributions.map((storeDist) => {
              const isExpanded = expandedStores.has(storeDist.storeId);
              return (
                <div
                  key={storeDist.storeId}
                  className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleStoreExpand(storeDist.storeId)}
                    className="w-full p-5 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-teal-400" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-white">{storeDist.storeName}</h4>
                        <p className="text-sm text-slate-400">{storeDist.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
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
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-700/50 px-5 pb-5">
                      <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
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
        </>
      )}

      {!trackingResult && !isSearching && (
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">输入批号开始追踪</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            请在上方搜索框中输入需要追踪的种植体批号，系统将展示该批号在各门店的流向和使用情况
          </p>
        </div>
      )}
    </div>
  );
}
