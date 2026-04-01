import { useState, useEffect, useRef } from 'react';
import {
  IconV2,
  IconButton,
  BodyText,
  TextButton,
  SelectField,
  DatePicker,
} from '@bamboohr/fabric';
import type { Employee } from '../data/employees';

// ─── Types & Constants ────────────────────────────────────────────────────────

export type FilterRecord = {
  id: number;
  field: string;
  operator: string;
  value: string | string[];
  dateTo: string;
};

export const FILTER_FIELD_OPTIONS = [
  'Department', 'Location', 'Division', 'Employment Type', 'Employment Status',
  'Job Title', 'Hire Date', 'Birth Date', 'Gender', 'Ethnicity',
];

export const DATE_FILTER_FIELDS = new Set(['Hire Date', 'Birth Date']);

export const FILTER_OPERATORS: Record<string, string[]> = {
  date: ['is during', 'is before', 'is after', 'is on'],
  default: ['includes', 'excludes', 'is', 'is not'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMDYToISO(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const FILTER_FIELD_TO_PROP: Record<string, (e: Employee) => string> = {
  'Department': (e) => e.department,
  'Location': (e) => e.location,
  'Division': (e) => e.division,
  'Employment Type': (e) => e.employmentType,
  'Employment Status': (e) => e.employmentStatus,
  'Job Title': (e) => e.title,
  'Gender': (e) => e.gender,
  'Ethnicity': (e) => e.ethnicity,
  'Hire Date': (e) => parseMDYToISO(e.hireDate),
  'Birth Date': (e) => parseMDYToISO(e.birthDate),
};

export function applyFilters(emps: Employee[], filters: FilterRecord[], matchAll: boolean): Employee[] {
  const configured = filters.filter((f) => (Array.isArray(f.value) ? f.value.length > 0 : f.value) || f.dateTo);
  if (configured.length === 0) return emps;
  return emps.filter((emp) => {
    const results = configured.map((filter) => {
      const getProp = FILTER_FIELD_TO_PROP[filter.field];
      if (!getProp) return true;
      const empVal = getProp(emp).toLowerCase();
      const filterValues = Array.isArray(filter.value) ? filter.value : [filter.value];
      const filterVal = filterValues[0]?.toLowerCase() ?? '';
      switch (filter.operator) {
        case 'includes': return empVal.includes(filterVal);
        case 'excludes': return !empVal.includes(filterVal);
        case 'is': return filterValues.some((v) => empVal === v.toLowerCase());
        case 'is not': return filterValues.every((v) => empVal !== v.toLowerCase());
        case 'is before': return filter.value ? empVal < filterVal : true;
        case 'is after': return filter.value ? empVal > filterVal : true;
        case 'is on': return empVal === filterVal;
        case 'is during': {
          const from = Array.isArray(filter.value) ? filter.value[0] : filter.value;
          const to = filter.dateTo;
          if (from && to) return empVal >= from && empVal <= to;
          if (from) return empVal >= from;
          if (to) return empVal <= to;
          return true;
        }
        default: return true;
      }
    });
    return matchAll ? results.every(Boolean) : results.some(Boolean);
  });
}

// ─── FiltersPanel Component ───────────────────────────────────────────────────

export function FiltersPanel({
  onClose,
  initialFilterField,
  filters,
  onFiltersChange,
  matchAll,
  onMatchAllChange,
  nextIdRef,
  anchor,
  filterFieldValues,
}: {
  onClose: () => void;
  initialFilterField?: string | null;
  filters: FilterRecord[];
  onFiltersChange: (f: FilterRecord[]) => void;
  matchAll: boolean;
  onMatchAllChange: (v: boolean) => void;
  nextIdRef: React.MutableRefObject<number>;
  anchor: DOMRect;
  filterFieldValues: Record<string, string[]>;
}) {
  const [matchDropdownOpen, setMatchDropdownOpen] = useState(false);

  useEffect(() => {
    if (initialFilterField) {
      const isDate = DATE_FILTER_FIELDS.has(initialFilterField);
      onFiltersChange([
        ...filters,
        {
          id: nextIdRef.current++,
          field: initialFilterField,
          operator: FILTER_OPERATORS[isDate ? 'date' : 'default'][0],
          value: isDate ? '' : [],
          dateTo: '',
        },
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      const target = e.target as Node;
      const insideFabricMenu = (target as Element).closest?.('.fab-MenuList, .fab-Menu, .fab-SelectToggle');
      if (insideFabricMenu) return;
      if (panelRef.current && !panelRef.current.contains(target)) onClose();
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  function updateFilter(id: number, patch: Partial<FilterRecord>) {
    onFiltersChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function removeFilter(id: number) {
    onFiltersChange(filters.filter((f) => f.id !== id));
  }
  function addFilter() {
    onFiltersChange([
      ...filters,
      { id: nextIdRef.current++, field: 'Department', operator: 'is', value: [], dateTo: '' },
    ]);
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: anchor.bottom + 8,
        left: anchor.left,
        zIndex: 9999,
        background: 'var(--surface-neutral-white)',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 580,
        boxShadow: '3px 3px 10px 2px rgba(56,49,47,0.10), 1px 1px 0px 1px rgba(56,49,47,0.04)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <BodyText size="large" weight="semibold" color="primary">Filters</BodyText>
        <IconButton icon="xmark-solid" aria-label="Close" variant="outlined" color="secondary" size="small" onClick={onClose} />
      </div>

      {/* Records matching All/Any */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <BodyText size="extra-small" color="neutral-medium">Records matching</BodyText>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <TextButton onClick={() => setMatchDropdownOpen((v) => !v)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconV2 name="caret-down-solid" size={10} />
              {matchAll ? 'All' : 'Any'}
            </span>
          </TextButton>
          {matchDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                zIndex: 60,
                background: 'var(--surface-neutral-white)',
                borderRadius: 8,
                border: '1px solid var(--border-neutral-weak)',
                boxShadow: '0 2px 8px rgba(56,49,47,0.12)',
                overflow: 'hidden',
                minWidth: 80,
              }}
            >
              {(['Any', 'All'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onMatchAllChange(opt === 'All'); setMatchDropdownOpen(false); }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-neutral-xx-weak)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = (opt === 'All') === matchAll ? 'var(--surface-neutral-x-weak)' : 'transparent'; }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: (opt === 'All') === matchAll ? 'var(--surface-neutral-x-weak)' : 'transparent',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 14,
                    color: 'var(--text-neutral-strong)',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filters.map((filter) => {
          const isDate = DATE_FILTER_FIELDS.has(filter.field);
          const operators = FILTER_OPERATORS[isDate ? 'date' : 'default'];
          const valueOptions = filterFieldValues[filter.field] ?? [];
          return (
            <div key={filter.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Field selector */}
              <div style={{ flexShrink: 0, width: 160 }}>
                <SelectField
                  variant="form"
                  size="small"
                  value={filter.field}
                  items={FILTER_FIELD_OPTIONS.map((f) => ({ text: f, value: f }))}
                  onChange={(e) => {
                    const newField = e.target.value as string;
                    updateFilter(filter.id, {
                      field: newField,
                      operator: FILTER_OPERATORS[DATE_FILTER_FIELDS.has(newField) ? 'date' : 'default'][0],
                      value: '',
                      dateTo: '',
                    });
                  }}
                />
              </div>
              {/* Operator selector */}
              <div style={{ flexShrink: 0, width: 130 }}>
                <SelectField
                  variant="form"
                  size="small"
                  value={filter.operator}
                  items={operators.map((op) => ({ text: op, value: op }))}
                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value as string })}
                />
              </div>
              {/* Value */}
              {isDate ? (
                <>
                  <div style={{ flexShrink: 0, width: 140 }}>
                    <DatePicker
                      value={(filter.value as string) || undefined}
                      onChange={({ value }) => updateFilter(filter.id, { value: value ?? '' })}
                      size="small"
                      width={100}
                    />
                  </div>
                  <BodyText size="small" color="neutral-medium">–</BodyText>
                  <div style={{ flexShrink: 0, width: 140 }}>
                    <DatePicker
                      value={filter.dateTo || undefined}
                      onChange={({ value }) => updateFilter(filter.id, { dateTo: value ?? '' })}
                      size="small"
                      width={100}
                    />
                  </div>
                </>
              ) : (
                <div style={{ flexShrink: 0, width: 170 }}>
                  <SelectField
                    variant="form"
                    size="small"
                    canSelectMultiple
                    value={Array.isArray(filter.value) ? filter.value : (filter.value ? [filter.value] : [])}
                    items={valueOptions.map((v) => ({ text: v, value: v }))}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value as string[] })}
                  />
                </div>
              )}
              {/* Remove */}
              <IconButton
                icon="trash-can-regular"
                aria-label="Remove filter"
                color="secondary"
                size="small"
                onClick={() => removeFilter(filter.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Add filter */}
      <div style={{ alignSelf: 'flex-start' }}>
        <TextButton onClick={addFilter}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconV2 name="circle-plus-regular" size={16} />
            Add filter
          </span>
        </TextButton>
      </div>
    </div>
  );
}
