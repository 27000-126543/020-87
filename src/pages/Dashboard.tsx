import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  PackageOpen,
  FileQuestion,
  Clock,
  Store,
  TrendingUp,
  ArrowLeft,
  XCircle,
  Copy,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatCard } from '@/components/StatCard';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useNavigate } from 'react-router-dom';
import type { AnomalyType, Anomaly } from '@/types';
import { cn } from '@/lib/utils';

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

const anomalyStatusConfig: Record<string, { label: string; variant: 'danger' | 'warning' | 'success' }> = {
  open: { label: '待处理', variant: 'danger' },
  processing: { label: '处理中', variant: 'warning' },
  resolved: { label: '已解决', variant: 'success' },
};

function DrillDownView() {
  const navigate = useNavigate();
  const { drillDownStoreId, setDrillDownStore, getStoreDrillDown } = useDashboardStore();

  if (!drillDownStoreId) return null;

  const data = getStoreDrillDown(drillDownStoreId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setDrillDownStore(null)}
          className="p-2 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">{data.storeName}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{data.city}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="本月用量"
          value={data.usageCount}
          suffix="颗"
          icon={<Activity className="w-6 h-6" />}
          color="teal"
          description="本月累计种植体使用数量"
        />
        <StatCard
          title="未绑定批号数"
          value={data.unboundBatches.length}
          suffix="批"
          icon={<FileQuestion className="w-6 h-6" />}
          color="red"
          description="已出库但未绑定病例的批号"
        />
        <StatCard
          title="临期库存数"
          value={data.expiringStock.length}
          suffix="批"
          icon={<Clock className="w-6 h-6" />}
          color="amber"
          description="90天内到期的种植体批次"
        />
        <StatCard
          title="异常数"
          value={data.anomalyList.length}
          suffix="项"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          description="待处理的质量异常问题"
        />
      </div>

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">未绑定病例监控</h3>
            <p className="text-sm text-slate-400 mt-1">
              已出库但未绑定病例的批号，可能存在"先用后补录"风险
            </p>
          </div>
          <button
            onClick={() => navigate('/anomalies')}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            查看全部异常 →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  批号
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  品牌产品
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  所属门店
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  出库时间
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  未绑定天数
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  经手护士
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {data.unboundBatches.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-700/30 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="py-3">
                    <span className="font-mono text-sm text-teal-400 font-medium">
                      {item.batchNumber}
                    </span>
                  </td>
                  <td className="py-3">
                    <p className="text-sm text-slate-200">{item.brandName}</p>
                    <p className="text-xs text-slate-500">{item.productName}</p>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-slate-300">{item.storeName}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-slate-400">{item.outboundDate}</span>
                  </td>
                  <td className="py-3">
                    <StatusBadge
                      variant={item.daysSinceOutbound > 7 ? 'danger' : item.daysSinceOutbound > 3 ? 'warning' : 'default'}
                    >
                      {item.daysSinceOutbound} 天
                    </StatusBadge>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-slate-400">{item.nurseName || '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.unboundBatches.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileQuestion className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">所有批号均已绑定病例</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">临期库存预警</h3>
            <p className="text-sm text-slate-400 mt-1">90天内即将到期</p>
          </div>
          <StatusBadge variant="warning" pulse>
            {data.expiringStock.length} 批临期
          </StatusBadge>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {data.expiringStock.map((item, index) => (
            <div
              key={item.id}
              className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-amber-500/30 transition-colors cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {item.batchNumber}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.brandName} · {item.spec}
                  </p>
                </div>
                <StatusBadge variant={item.daysLeft <= 30 ? 'danger' : 'warning'}>
                  {item.daysLeft}天
                </StatusBadge>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <Store className="w-3.5 h-3.5" />
                <span className="truncate">{item.storeName}</span>
                <span className="ml-auto">剩{item.quantity}颗</span>
              </div>
            </div>
          ))}
          {data.expiringStock.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <PackageOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无临期库存</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">门店异常</h3>
            <p className="text-sm text-slate-400 mt-1">该门店的异常记录</p>
          </div>
          <button
            onClick={() => navigate('/anomalies')}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            查看全部异常 →
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {data.anomalyList.map((anomaly, index) => {
            const typeConfig = anomalyTypeConfig[anomaly.type];
            const sevConfig = severityConfig[anomaly.severity];
            const statConfig = anomalyStatusConfig[anomaly.status];
            const Icon = typeConfig.icon;

            return (
              <div
                key={anomaly.id}
                className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2.5 rounded-lg', typeConfig.bg)}>
                      <Icon className={cn('w-5 h-5', typeConfig.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{typeConfig.label}</span>
                        <StatusBadge variant={sevConfig.variant} pulse={anomaly.status === 'open' && anomaly.severity === 'high'}>
                          {sevConfig.label}
                        </StatusBadge>
                        <StatusBadge variant={statConfig.variant}>
                          {statConfig.label}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{anomaly.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  {anomaly.batchNumber && (
                    <span className="font-mono text-teal-400/70">{anomaly.batchNumber}</span>
                  )}
                  {anomaly.patientName && (
                    <span>{anomaly.patientName}</span>
                  )}
                  <span className="ml-auto">{anomaly.discoveredAt}</span>
                </div>
              </div>
            );
          })}
          {data.anomalyList.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无异常记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const {
    filters,
    stats,
    storeUsage,
    expiringStock,
    unboundBatches,
    drillDownStoreId,
    setBrandFilter,
    setStoreFilter,
    setDoctorFilter,
    setDrillDownStore,
    computeDashboardData,
  } = useDashboardStore();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    computeDashboardData();
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [computeDashboardData]);

  if (drillDownStoreId) {
    return (
      <div className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <DrillDownView />
      </div>
    );
  }

  const chartData = storeUsage.map((item) => ({
    name: item.storeName.replace('瑞尔口腔 ', '').replace('店', ''),
    使用量: item.usageCount,
    storeId: item.storeId,
  }));

  const COLORS = ['#0D9488', '#0891B2', '#0EA5E9', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-slate-200">{data.name}</p>
          <p className="text-teal-400 font-semibold mt-1">{data.使用量} 颗</p>
          <p className="text-xs text-slate-500 mt-1">点击查看详情</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <FilterBar
        selectedBrand={filters.brandId}
        selectedStore={filters.storeId}
        selectedDoctor={filters.doctorId}
        onBrandChange={setBrandFilter}
        onStoreChange={setStoreFilter}
        onDoctorChange={setDoctorFilter}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="本月种植体使用量"
          value={stats.totalUsage}
          suffix="颗"
          change={stats.monthOverMonth.usage}
          icon={<Activity className="w-6 h-6" />}
          color="teal"
          description="本月累计种植体使用数量"
        />
        <StatCard
          title="临期库存"
          value={stats.expiringStock}
          suffix="批"
          change={stats.monthOverMonth.expiring}
          icon={<Clock className="w-6 h-6" />}
          color="amber"
          description="90天内到期的种植体批次"
        />
        <StatCard
          title="未绑定病例批号"
          value={stats.unboundBatches}
          suffix="批"
          change={stats.monthOverMonth.unbound}
          icon={<FileQuestion className="w-6 h-6" />}
          color="red"
          description="已出库但未绑定病例的批号"
        />
        <StatCard
          title="异常总数"
          value={stats.totalAnomalies}
          suffix="项"
          change={stats.monthOverMonth.anomalies}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          description="待处理的质量异常问题"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">门店使用量排行</h3>
              <p className="text-sm text-slate-400 mt-1">本月各门店种植体使用情况</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <TrendingUp className="w-4 h-4" />
              <span>按使用量排序</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={12}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="使用量" radius={[0, 6, 6, 0]} barSize={24} onClick={(data) => setDrillDownStore(data.storeId)}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ cursor: 'pointer' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">临期库存预警</h3>
              <p className="text-sm text-slate-400 mt-1">90天内即将到期</p>
            </div>
            <StatusBadge variant="warning" pulse>
              {expiringStock.length} 批临期
            </StatusBadge>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {expiringStock.slice(0, 6).map((item, index) => (
              <div
                key={item.id}
                className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-amber-500/30 transition-colors cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {item.batchNumber}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.brandName} · {item.spec}
                    </p>
                  </div>
                  <StatusBadge variant={item.daysLeft <= 30 ? 'danger' : 'warning'}>
                    {item.daysLeft}天
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <Store className="w-3.5 h-3.5" />
                  <span className="truncate">{item.storeName}</span>
                  <span className="ml-auto">剩{item.quantity}颗</span>
                </div>
              </div>
            ))}
            {expiringStock.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <PackageOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无临期库存</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">未绑定病例监控</h3>
            <p className="text-sm text-slate-400 mt-1">
              已出库但未绑定病例的批号，可能存在"先用后补录"风险
            </p>
          </div>
          <button
            onClick={() => navigate('/anomalies')}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            查看全部异常 →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  批号
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  品牌产品
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  所属门店
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  出库时间
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  未绑定天数
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                  经手护士
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {unboundBatches.slice(0, 5).map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-700/30 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="py-3">
                    <span className="font-mono text-sm text-teal-400 font-medium">
                      {item.batchNumber}
                    </span>
                  </td>
                  <td className="py-3">
                    <p className="text-sm text-slate-200">{item.brandName}</p>
                    <p className="text-xs text-slate-500">{item.productName}</p>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-slate-300">{item.storeName}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-slate-400">{item.outboundDate}</span>
                  </td>
                  <td className="py-3">
                    <StatusBadge
                      variant={item.daysSinceOutbound > 7 ? 'danger' : item.daysSinceOutbound > 3 ? 'warning' : 'default'}
                    >
                      {item.daysSinceOutbound} 天
                    </StatusBadge>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-slate-400">{item.nurseName || '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {unboundBatches.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileQuestion className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">所有批号均已绑定病例</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
