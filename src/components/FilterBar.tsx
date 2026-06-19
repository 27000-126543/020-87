import { useState } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { brands, stores, doctors } from '@/data';

interface FilterBarProps {
  selectedBrand: string | null;
  selectedStore: string | null;
  selectedDoctor: string | null;
  onBrandChange: (brandId: string | null) => void;
  onStoreChange: (storeId: string | null) => void;
  onDoctorChange: (doctorId: string | null) => void;
  showDoctorFilter?: boolean;
}

interface DropdownProps {
  label: string;
  value: string | null;
  options: { id: string; label: string; subLabel?: string }[];
  onChange: (value: string | null) => void;
  placeholder?: string;
}

function Dropdown({ label, value, options, onChange, placeholder }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 hover:bg-slate-750 hover:border-slate-600 transition-colors min-w-[160px]"
      >
        <span className="text-slate-400">{label}:</span>
        <span className={cn('flex-1 text-left truncate', !selectedOption && 'text-slate-500')}>
          {selectedOption ? selectedOption.label : placeholder || '全部'}
        </span>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="p-0.5 hover:bg-slate-700 rounded"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] max-h-64 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1">
            <button
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors',
                !value ? 'text-teal-400' : 'text-slate-300'
              )}
            >
              全部
            </button>
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors',
                  value === option.id ? 'text-teal-400 bg-teal-500/10' : 'text-slate-300'
                )}
              >
                <div>{option.label}</div>
                {option.subLabel && (
                  <div className="text-xs text-slate-500 mt-0.5">{option.subLabel}</div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function FilterBar({
  selectedBrand,
  selectedStore,
  selectedDoctor,
  onBrandChange,
  onStoreChange,
  onDoctorChange,
  showDoctorFilter = true,
}: FilterBarProps) {
  const brandOptions = brands.map((b) => ({ id: b.id, label: b.name, subLabel: b.country }));
  const storeOptions = stores.map((s) => ({ id: s.id, label: s.name, subLabel: s.city }));
  const doctorOptions = doctors
    .filter((d) => !selectedStore || d.storeId === selectedStore)
    .map((d) => ({ id: d.id, label: d.name, subLabel: d.title }));

  const hasFilters = selectedBrand || selectedStore || selectedDoctor;

  const clearAll = () => {
    onBrandChange(null);
    onStoreChange(null);
    onDoctorChange(null);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">筛选</span>
        </div>

        <Dropdown label="品牌" value={selectedBrand} options={brandOptions} onChange={onBrandChange} />
        <Dropdown label="门店" value={selectedStore} options={storeOptions} onChange={onStoreChange} />
        {showDoctorFilter && (
          <Dropdown label="医生" value={selectedDoctor} options={doctorOptions} onChange={onDoctorChange} />
        )}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-slate-400 hover:text-teal-400 transition-colors ml-2"
          >
            清除全部
          </button>
        )}
      </div>
    </div>
  );
}
