import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InputAdornment } from '@mui/material';
import {
  IconV2,
  Button,
  ButtonGroup,
  TextButton,
  IconButton,
  BodyText,
  Pill,
  PillType,
  TextField,
  Section,
  ActionFooter,
  StandardModal,
  SimpleSlidedown,
  DatePicker,
  SelectField,
  Checkbox,
  TextArea,
  Dropdown,
  RoundedToggle,
} from '@bamboohr/fabric';
import { employees, type Employee } from '../../data/employees';
import { sendMessage, type ChatMessage, type PowerEditAction, type TableContext } from './openai';

const SUGGESTIONS = [
  'Update job titles for everyone in Engineering',
  'Set the hire date to today for all employees',
  'Sort by hire date, oldest first',
  'Increase all salaries by 10%',
];

// ─── Describe It Panel ────────────────────────────────────────────────────────
function DescribeItPanel({ onClose, onAction, tableContext }: {
  onClose: () => void;
  onAction: (action: PowerEditAction) => void;
  tableContext: TableContext;
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;
    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);
    try {
      const { content, actions } = await sendMessage(updated, tableContext);
      for (const action of actions) onAction(action);
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally { setIsLoading(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const hasMessages = messages.length > 0;
  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'var(--surface-neutral-white)', borderRadius: 16, border: '1px solid var(--border-neutral-x-weak)', boxShadow: '3px 3px 10px 2px rgba(56,49,47,0.1), 1px 1px 0px 1px rgba(56,49,47,0.04)', overflow: 'hidden' }}>
      <style>{`@keyframes pe-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>

      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'var(--surface-neutral-xx-weak)', borderBottom: '1px solid var(--border-neutral-x-weak)' }}>
        <BodyText size="medium" weight="semibold">Power Edit Assistant</BodyText>
        <IconButton icon="xmark-solid" aria-label="Close" variant="outlined" color="secondary" size="small" onClick={onClose} />
      </div>

      {/* Body */}
      {hasMessages ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ padding: '10px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', maxWidth: '85%', whiteSpace: 'pre-wrap', background: msg.role === 'user' ? 'var(--color-primary-strong)' : 'var(--surface-neutral-xx-weak)', color: msg.role === 'user' ? 'white' : 'var(--text-neutral-strong)', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, lineHeight: '20px' }}>{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--surface-neutral-xx-weak)', display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-neutral-medium)', display: 'inline-block', animation: 'pe-bounce 1.4s infinite', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        /* Blank state */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', gap: 16 }}>
          <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-ai-strong)', borderRadius: '50%' }}>
            <IconV2 name="sparkles-solid" size={20} />
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <BodyText size="medium" weight="semibold">Describe the edits you'd like to make</BodyText>
            <BodyText size="small" color="neutral-weak">I'll apply your changes directly to the table.</BodyText>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {SUGGESTIONS.map((s) => (
              <Button key={s} variant="outlined" size="small" onClick={() => handleSend(s)}>{s}</Button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ flexShrink: 0, padding: 16, background: 'var(--surface-neutral-xx-weak)', borderTop: '1px solid var(--border-neutral-x-weak)', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextArea
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            minRows={1}
            maxRows={4}
            width={100}
          />
        </div>
        <Button
          variant="outlined"
          color="primary"
          icon="paper-plane-solid"
          aria-label="Send"
          onClick={() => handleSend()}
        />
      </div>
    </div>
  );
}

// ─── Fields Panel ─────────────────────────────────────────────────────────────
const fieldCategories = ['Personal', 'Job', 'Time Off', 'Benefits', 'Training', 'Performance', 'Assets', 'Notes', 'Emergency', 'Tasks', 'Calculated'];
type FieldType = 'text' | 'date' | 'number' | 'list';
type FieldDef = { name: string; type: FieldType };

const fieldsByCategory: Record<string, FieldDef[]> = {
  Personal: [{ name: 'Name', type: 'text' }, { name: 'Employee #', type: 'number' }, { name: 'Status', type: 'list' }, { name: 'First Name', type: 'text' }, { name: 'Middle Name', type: 'text' }, { name: 'Last Name', type: 'text' }, { name: 'Preferred Name', type: 'text' }, { name: 'Birth Date', type: 'date' }, { name: 'Gender', type: 'list' }, { name: 'Gender Identity', type: 'list' }, { name: 'Pronouns', type: 'text' }, { name: 'Ethnicity', type: 'list' }, { name: 'Marital Status', type: 'list' }, { name: 'SSN', type: 'text' }, { name: 'Tax File Number', type: 'text' }],
  Job: [{ name: 'Job Title', type: 'text' }, { name: 'Department', type: 'list' }, { name: 'Location', type: 'list' }, { name: 'Hire Date', type: 'date' }, { name: 'Manager', type: 'text' }, { name: 'Pay Rate', type: 'number' }, { name: 'Employment Status', type: 'list' }, { name: 'Employment Type', type: 'list' }, { name: 'Division', type: 'list' }, { name: 'Cost Center', type: 'text' }],
  'Time Off': [{ name: 'Available Balance', type: 'number' }, { name: 'Used YTD', type: 'number' }, { name: 'Policy', type: 'list' }, { name: 'Next Accrual Date', type: 'date' }],
  Benefits: [{ name: 'Plan Name', type: 'text' }, { name: 'Coverage Level', type: 'list' }, { name: 'Effective Date', type: 'date' }, { name: 'Annual Cost', type: 'number' }],
  Training: [{ name: 'Course Name', type: 'text' }, { name: 'Completion Date', type: 'date' }, { name: 'Status', type: 'list' }, { name: 'Score', type: 'number' }],
  Performance: [{ name: 'Review Date', type: 'date' }, { name: 'Rating', type: 'number' }, { name: 'Reviewer', type: 'text' }, { name: 'Goal Status', type: 'list' }],
  Assets: [{ name: 'Asset Name', type: 'text' }, { name: 'Serial Number', type: 'text' }, { name: 'Assigned Date', type: 'date' }, { name: 'Category', type: 'list' }],
  Notes: [{ name: 'Note', type: 'text' }, { name: 'Date Added', type: 'date' }, { name: 'Type', type: 'list' }],
  Emergency: [{ name: 'Contact Name', type: 'text' }, { name: 'Relationship', type: 'list' }, { name: 'Phone', type: 'text' }, { name: 'Email', type: 'text' }],
  Tasks: [{ name: 'Task Name', type: 'text' }, { name: 'Due Date', type: 'date' }, { name: 'Status', type: 'list' }, { name: 'Assignee', type: 'text' }],
  Calculated: [{ name: 'Tenure (Years)', type: 'number' }, { name: 'Age', type: 'number' }, { name: 'Days Since Hire', type: 'number' }],
};

function FieldTypeIcon({ type }: { type: FieldType }) {
  if (type === 'date') return <IconV2 name="calendar-solid" size={12} />;
  const label = type === 'number' ? '#' : type === 'list' ? '≡' : 'T';
  return <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1, width: 13, textAlign: 'center', color: 'var(--icon-neutral-medium)', flexShrink: 0 }}>{label}</span>;
}

function FieldsPanel({ onClose, selectedFields, onSelectedFieldsChange }: { onClose: () => void; selectedFields: string[]; onSelectedFieldsChange: (fields: string[]) => void }) {
  const [activeCategory, setActiveCategory] = useState('Personal');
  const [search, setSearch] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const categoryFields = fieldsByCategory[activeCategory] ?? [];
  const filtered = search ? Object.values(fieldsByCategory).flat().filter((f) => f.name.toLowerCase().includes(search.toLowerCase())) : categoryFields;
  const sectionHeading = search ? 'Search results' : activeCategory;

  return (
    <div ref={panelRef} style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, zIndex: 50, background: 'var(--surface-neutral-white)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: 760, height: 520, boxShadow: '3px 3px 10px 2px rgba(56,49,47,0.10), 1px 1px 0px 1px rgba(56,49,47,0.04)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0', flexShrink: 0 }}>
        <BodyText size="large" weight="semibold" color="primary">Fields</BodyText>
        <IconButton icon="xmark-solid" aria-label="Close" variant="outlined" color="secondary" size="small" onClick={onClose} />
      </div>

      {/* Body: three columns */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, marginTop: 16 }}>

        {/* Left: search + categories */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '0 12px 16px', overflowY: 'auto', borderRight: '1px solid var(--border-neutral-x-weak)' }}>
          <div style={{ marginBottom: 12 }}>
            <TextField
              size="small"
              placeholder="Search fields"
              value={search}
              onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
              width={100}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconV2 name="magnifying-glass-solid" size={12} />
                  </InputAdornment>
                ),
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {fieldCategories.map((cat) => {
              const isActive = activeCategory === cat && !search;
              return (
                <button key={cat} onClick={() => { setActiveCategory(cat); setSearch(''); }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: isActive ? 'var(--color-primary-strong)' : 'transparent' }}>
                  <BodyText size="small" weight={isActive ? 'semibold' : 'regular'} color={isActive ? undefined : 'neutral-strong'}>
                    <span style={isActive ? { color: 'white' } : undefined}>{cat}</span>
                  </BodyText>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle: section heading + field checkboxes */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto', padding: '0 16px 16px' }}>
          <div style={{ padding: '12px 0 8px', position: 'sticky', top: 0, background: 'var(--surface-neutral-white)', zIndex: 1 }}>
            <BodyText size="small" weight="semibold" color="neutral-strong">{sectionHeading}</BodyText>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filtered.map((field) => {
              const checked = selectedFields.includes(field.name);
              return (
                <div key={field.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6 }}>
                  <Checkbox
                    checked={checked}
                    value={field.name}
                    name={field.name}
                    size="small"
                    onChange={({ checked: c }) => {
                      onSelectedFieldsChange(c ? [...selectedFields, field.name] : selectedFields.filter((f) => f !== field.name));
                    }}
                    label={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FieldTypeIcon type={field.type} />
                        <BodyText size="extra-small" color="neutral-strong">{field.name}</BodyText>
                      </span>
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: selected fields */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-neutral-x-weak)', overflowY: 'auto', padding: '0 12px 16px' }}>
          <div style={{ padding: '12px 0 8px', position: 'sticky', top: 0, background: 'var(--surface-neutral-white)', zIndex: 1 }}>
            <BodyText size="small" weight="semibold" color="neutral-strong">Selected</BodyText>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedFields.map((name, idx) => {
              const allFields = Object.values(fieldsByCategory).flat();
              const fieldDef = allFields.find((f) => f.name === name);
              const isDragging = dragIdx === idx;
              const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
              return (
                <div key={name} draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragIdx(idx); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverIdx(idx); }}
                  onDrop={(e) => { e.preventDefault(); if (dragIdx === null || dragIdx === idx) return; const next = [...selectedFields]; const [moved] = next.splice(dragIdx, 1); next.splice(idx, 0, moved); onSelectedFieldsChange(next); setDragIdx(null); setOverIdx(null); }}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: `1px solid ${isOver ? 'var(--color-primary-strong)' : 'var(--border-neutral-weak)'}`, background: 'var(--surface-neutral-white)', userSelect: 'none', cursor: 'grab', opacity: isDragging ? 0.4 : 1, boxShadow: isOver ? '0 0 0 1px var(--color-primary-strong)' : undefined }}>
                  <span style={{ color: 'var(--icon-neutral-weak)', fontSize: 14, flexShrink: 0 }}>⠿</span>
                  {fieldDef && <FieldTypeIcon type={fieldDef.type} />}
                  <BodyText size="extra-small" color="neutral-strong">
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 140 }}>{name}</span>
                  </BodyText>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Employees Dropdown ───────────────────────────────────────────────────────
const EMPLOYEE_OPTIONS = [
  { label: 'Company', icon: 'building-regular' }, { label: 'Employee', icon: 'user-group-regular' },
  { label: 'Benefit Elections', icon: 'heart-regular' }, { label: 'Applicants', icon: 'id-badge-regular' }, { label: 'Payroll', icon: 'circle-dollar-regular' },
];


// ─── Filters Panel ────────────────────────────────────────────────────────────
type FilterRecord = { id: number; field: string; operator: string; value: string; dateTo: string };
const FILTER_FIELD_OPTIONS = ['Department', 'Location', 'Division', 'Employment Type', 'Employment Status', 'Job Title', 'Hire Date', 'Birth Date', 'Gender', 'Ethnicity'];
const DATE_FILTER_FIELDS = new Set(['Hire Date', 'Birth Date']);
const FILTER_OPERATORS: Record<string, string[]> = {
  date: ['is during', 'is before', 'is after', 'is on'],
  default: ['includes', 'excludes', 'is', 'is not'],
};

function FiltersPanel({ onClose, initialFilterField, filters, onFiltersChange, matchAll, onMatchAllChange, nextIdRef }: {
  onClose: () => void; initialFilterField?: string | null; filters: FilterRecord[];
  onFiltersChange: (f: FilterRecord[]) => void; matchAll: boolean; onMatchAllChange: (v: boolean) => void;
  nextIdRef: React.MutableRefObject<number>;
}) {
  useEffect(() => {
    if (initialFilterField) {
      const isDate = DATE_FILTER_FIELDS.has(initialFilterField);
      onFiltersChange([...filters, { id: nextIdRef.current++, field: initialFilterField, operator: FILTER_OPERATORS[isDate ? 'date' : 'default'][0], value: '', dateTo: '' }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  function updateFilter(id: number, patch: Partial<FilterRecord>) { onFiltersChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f))); }
  function removeFilter(id: number) { onFiltersChange(filters.filter((f) => f.id !== id)); }
  function addFilter() { onFiltersChange([...filters, { id: nextIdRef.current++, field: 'Department', operator: 'includes', value: '', dateTo: '' }]); }

  const fieldItems = FILTER_FIELD_OPTIONS.map((f) => ({ text: f, value: f }));

  return (
    <div ref={panelRef} style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, zIndex: 50, background: 'var(--surface-neutral-white)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 580, boxShadow: '3px 3px 10px 2px rgba(56,49,47,0.10), 1px 1px 0px 1px rgba(56,49,47,0.04)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <BodyText size="large" weight="semibold" color="primary">Filters</BodyText>
        <IconButton icon="xmark-solid" aria-label="Close" variant="outlined" color="secondary" size="small" onClick={onClose} />
      </div>

      {/* Records matching All/Any */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <BodyText size="extra-small" color="neutral-medium">Records matching</BodyText>
        <Dropdown
          type="text"
          showCaret={false}
          items={[
            { text: 'All', value: 'all' },
            { text: 'Any', value: 'any' },
          ]}
          onSelect={(value) => onMatchAllChange(value === 'all')}
        >
          {matchAll ? 'All' : 'Any'}
        </Dropdown>
      </div>

      {/* Filter rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filters.map((filter) => {
          const isDate = DATE_FILTER_FIELDS.has(filter.field);
          const operators = FILTER_OPERATORS[isDate ? 'date' : 'default'];
          const operatorItems = operators.map((op) => ({ text: op, value: op }));
          const valueItems = [{ text: 'Select...', value: '' }, ...(FILTER_FIELD_VALUES[filter.field] ?? []).map((v) => ({ text: v, value: v }))];
          return (
            <div key={filter.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Field selector */}
              <div style={{ flexShrink: 0, width: 148 }}>
                <SelectField
                  ariaLabel="Filter field"
                  items={fieldItems}
                  value={filter.field}
                  isClearable={false}
                  onChange={(e) => {
                    const newField = e.target.value as string;
                    updateFilter(filter.id, { field: newField, operator: FILTER_OPERATORS[DATE_FILTER_FIELDS.has(newField) ? 'date' : 'default'][0], value: '', dateTo: '' });
                  }}
                />
              </div>
              {/* Operator selector */}
              <div style={{ flexShrink: 0, width: 128 }}>
                <SelectField
                  ariaLabel="Filter operator"
                  items={operatorItems}
                  value={filter.operator}
                  isClearable={false}
                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value as string })}
                />
              </div>
              {/* Value */}
              {isDate ? (
                <>
                  <div style={{ flexShrink: 0, width: 148 }}>
                    <DatePicker
                      value={filter.value || undefined}
                      onChange={({ value }) => updateFilter(filter.id, { value: value ?? '' })}
                      size="small"
                      width={100}
                    />
                  </div>
                  <BodyText size="small" color="neutral-medium">–</BodyText>
                  <div style={{ flexShrink: 0, width: 148 }}>
                    <DatePicker
                      value={filter.dateTo || undefined}
                      onChange={({ value }) => updateFilter(filter.id, { dateTo: value ?? '' })}
                      size="small"
                      width={100}
                    />
                  </div>
                </>
              ) : (
                <div style={{ flexShrink: 0, width: 148 }}>
                  <SelectField
                    ariaLabel="Filter value"
                    items={valueItems}
                    value={filter.value || ''}
                    isClearable={false}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value as string })}
                  />
                </div>
              )}
              {/* Remove */}
              <IconButton
                icon="trash-can-solid"
                aria-label="Remove filter"
                variant="outlined"
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

// ─── Mock Data & Helpers ──────────────────────────────────────────────────────
const mockSalaries: Record<number, number> = { 100: 320000, 5: 210000, 6: 195000, 7: 185000, 8: 175000, 9: 168000, 10: 143098, 11: 164857, 12: 112677, 13: 510195, 14: 432903, 15: 231754, 16: 210026, 17: 164857, 18: 163098, 19: 133098, 20: 145000, 21: 128000, 22: 118000, 23: 155000, 24: 142000, 25: 138000, 26: 125000, 27: 132000, 28: 148000, 29: 112000, 30: 139000 };
function getSalary(id: number): number { return mockSalaries[id] ?? 95000 + ((id * 13371) % 80000); }
function formatSalary(amount: number): string { return `$ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
const MOCK_GENDERS = ['Male', 'Female', 'Non-binary', 'Female', 'Male', 'Female', 'Male', 'Non-binary', 'Male', 'Female'];
const MOCK_ETHNICITIES = ['White', 'Asian', 'Hispanic or Latino', 'Black or African American', 'White', 'Asian', 'Two or More Races', 'White', 'Hispanic or Latino', 'Black or African American'];
const MOCK_EMP_TYPES = ['Full-Time', 'Full-Time', 'Full-Time', 'Full-Time', 'Full-Time', 'Full-Time', 'Full-Time', 'Part-Time', 'Part-Time', 'Contract'];
function getMockBirthDate(id: number): string { const year = 1965 + ((id * 7) % 33); const month = String(1 + ((id * 3) % 12)).padStart(2, '0'); const day = String(1 + ((id * 11) % 28)).padStart(2, '0'); return `${month}/${day}/${year}`; }
function getMockGender(id: number): string { return MOCK_GENDERS[id % MOCK_GENDERS.length]; }
function getMockEthnicity(id: number): string { return MOCK_ETHNICITIES[id % MOCK_ETHNICITIES.length]; }
function getMockEmploymentType(employee: Employee): string { if (employee.employmentType) return employee.employmentType; return MOCK_EMP_TYPES[employee.id % MOCK_EMP_TYPES.length]; }
function getReportsToName(reportsToId: number | null): string { if (reportsToId === null) return '—'; const manager = employees.find((e) => e.id === reportsToId); return manager?.name ?? '—'; }
const allEmployeeNames = employees.filter((e) => !e.isTBH).map((e) => e.name);
const allJobTitles = [...new Set(employees.filter((e) => !e.isTBH).map((e) => e.title))].sort();
const allDepartments = [...new Set(employees.filter((e) => !e.isTBH).map((e) => e.department))].sort();
const allLocations = [...new Set(employees.filter((e) => !e.isTBH).map((e) => e.location))].sort();
const allDivisions = [...new Set(employees.filter((e) => !e.isTBH).map((e) => e.division))].sort();
const FILTER_FIELD_VALUES: Record<string, string[]> = { 'Department': allDepartments, 'Location': allLocations, 'Division': allDivisions, 'Employment Type': ['Full-Time', 'Part-Time', 'Contract'], 'Employment Status': ['Active', 'Inactive', 'On Leave'], 'Job Title': allJobTitles, 'Gender': ['Male', 'Female', 'Non-binary', 'Prefer not to say'], 'Ethnicity': ['White', 'Asian', 'Hispanic or Latino', 'Black or African American', 'Two or More Races', 'Prefer not to say'] };
const DATE_COL_KEYS = new Set<ColKey>(['hireDate', 'effectiveDate', 'birthDate']);
const COL_OPTIONS: Partial<Record<ColKey, string[]>> = {
  title: allJobTitles,
  reportsTo: allEmployeeNames,
  department: allDepartments,
  location: allLocations,
  division: allDivisions,
  employmentType: ['Full-Time', 'Part-Time', 'Contract'],
  employmentStatus: ['Active', 'Inactive', 'On Leave'],
  gender: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  ethnicity: ['White', 'Asian', 'Hispanic or Latino', 'Black or African American', 'Two or More Races', 'Prefer not to say'],
};

type ColKey = 'name' | 'firstName' | 'lastName' | 'title' | 'department' | 'location' | 'division' | 'reportsTo' | 'hireDate' | 'salary' | 'employmentType' | 'employmentStatus' | 'employeeNumber' | 'birthDate' | 'gender' | 'ethnicity' | 'effectiveDate';

const COL_TO_FILTER_FIELD: Partial<Record<ColKey, string>> = { title: 'Job Title', hireDate: 'Hire Date', department: 'Department', location: 'Location', division: 'Division', employmentType: 'Employment Type' };
const FIELD_TO_COL: Partial<Record<string, { key: ColKey; label: string; align?: 'right' }>> = {
  'Name': { key: 'name', label: 'Name' }, 'Employee #': { key: 'employeeNumber', label: 'Employee #' }, 'Status': { key: 'employmentStatus', label: 'Status' },
  'First Name': { key: 'firstName', label: 'First Name' }, 'Middle Name': { key: 'firstName', label: 'First Name' }, 'Last Name': { key: 'lastName', label: 'Last Name' },
  'Preferred Name': { key: 'firstName', label: 'First Name' }, 'Birth Date': { key: 'birthDate', label: 'Birth Date' }, 'Gender': { key: 'gender', label: 'Gender' }, 'Ethnicity': { key: 'ethnicity', label: 'Ethnicity' },
  'Job Title': { key: 'title', label: 'Job Title' }, 'Department': { key: 'department', label: 'Department' }, 'Location': { key: 'location', label: 'Location' }, 'Hire Date': { key: 'hireDate', label: 'Hire Date' },
  'Manager': { key: 'reportsTo', label: 'Reports To' }, 'Pay Rate': { key: 'salary', label: 'Pay Rate', align: 'right' }, 'Employment Status': { key: 'employmentStatus', label: 'Status' },
  'Employment Type': { key: 'employmentType', label: 'Employment Type' }, 'Division': { key: 'division', label: 'Division' },
};
const DEFAULT_SELECTED_FIELDS: string[] = [];
const DEFAULT_ALL_COLUMNS: { key: ColKey; label: string; align?: 'right' }[] = [{ key: 'name', label: 'Name' }, { key: 'title', label: 'Job Title' }, { key: 'reportsTo', label: 'Reports To' }, { key: 'hireDate', label: 'Hire Date' }, { key: 'salary', label: 'Pay Rate', align: 'right' }];
const NEW_EDIT_COLUMNS: { key: ColKey; label: string; align?: 'right' }[] = [{ key: 'name', label: 'Name' }];

function syncFieldsToColOrder(newColOrder: ColKey[], fields: string[]): string[] {
  const result: string[] = []; const handled = new Set<string>();
  for (const key of newColOrder) { if (key === 'effectiveDate') continue; for (const field of fields) { if (!handled.has(field) && FIELD_TO_COL[field]?.key === key) { result.push(field); handled.add(field); } } }
  for (const field of fields) { if (!handled.has(field)) result.push(field); }
  return result;
}

function selectedFieldsToColumns(fields: string[], base: { key: ColKey; label: string; align?: 'right' }[] = DEFAULT_ALL_COLUMNS): { key: ColKey; label: string; align?: 'right' }[] {
  const seen = new Set<ColKey>(); const cols: { key: ColKey; label: string; align?: 'right' }[] = [];
  for (const col of base) { if (!seen.has(col.key)) { seen.add(col.key); cols.push(col); } }
  for (const f of fields) { const col = FIELD_TO_COL[f]; if (col && !seen.has(col.key)) { seen.add(col.key); cols.push(col); } }
  return cols;
}

function formatDateDisplay(dateStr: string): string { const d = new Date(dateStr + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function parseDisplayToISO(display: string): string { const d = new Date(display); if (isNaN(d.getTime())) return ''; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function parseMDYToISO(dateStr: string): string { const parts = dateStr.split('/'); if (parts.length === 3) { const [mm, dd, yyyy] = parts; return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`; } return parseDisplayToISO(dateStr); }
function parseISOToMDY(isoStr: string): string { const parts = isoStr.split('-'); if (parts.length === 3) { const [yyyy, mm, dd] = parts; return `${mm}/${dd}/${yyyy}`; } return isoStr; }
function formatEffectiveDateLabel(dateStr: string): string { const today = new Date().toISOString().split('T')[0]; if (dateStr === today) return 'Today'; const d = new Date(dateStr + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

function getOriginalValue(employee: Employee, col: ColKey, effectiveDateStr?: string): string {
  switch (col) {
    case 'name': return employee.name;
    case 'firstName': return employee.firstName ?? employee.name.split(' ')[0];
    case 'lastName': return employee.lastName ?? employee.name.split(' ').slice(-1)[0];
    case 'title': return employee.title;
    case 'department': return employee.department;
    case 'location': return employee.location;
    case 'division': return employee.division;
    case 'reportsTo': return getReportsToName(employee.reportsTo);
    case 'hireDate': return employee.hireDate ?? '—';
    case 'salary': return formatSalary(getSalary(employee.id));
    case 'employmentStatus': return employee.employmentStatus ?? 'Full-Time';
    case 'employmentType': return getMockEmploymentType(employee);
    case 'employeeNumber': return employee.employeeNumber ?? String(employee.id);
    case 'birthDate': return employee.birthDate ?? getMockBirthDate(employee.id);
    case 'gender': return employee.gender ?? getMockGender(employee.id);
    case 'ethnicity': return employee.ethnicity ?? getMockEthnicity(employee.id);
    case 'effectiveDate': return formatDateDisplay(effectiveDateStr ?? new Date().toISOString().split('T')[0]);
  }
}



// ─── Cell Select (auto-opens dropdown when mounted) ───────────────────────────
function CellSelect({ colLabel, value, items, onSelect, onClear, onClose }: {
  colLabel: string;
  value: string | undefined;
  items: { text: string; value: string }[];
  onSelect: (v: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      const btn = divRef.current?.querySelector<HTMLButtonElement>('button');
      if (btn) {
        btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        btn.click();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div ref={divRef} onClick={(e) => e.stopPropagation()}>
      <SelectField
        ariaLabel={colLabel}
        size="small"
        width={100}
        isClearable={true}
        showSearch="always"
        value={value}
        items={items}
        onSelect={(v) => onSelect(v as string)}
        onClear={onClear}
        onClose={onClose}
      />
    </div>
  );
}

// ─── Effective Date Panel ─────────────────────────────────────────────────────
function EffectiveDatePanel({ effectiveDate, onDateChange, useIndividualDates, onToggleIndividualDates, onClose }: { effectiveDate: string; onDateChange: (date: string) => void; useIndividualDates: boolean; onToggleIndividualDates: () => void; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return (
    <div ref={panelRef} style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, zIndex: 50, background: 'var(--surface-neutral-white)', borderRadius: 'var(--radius-small)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, width: 300, boxShadow: '3px 3px 10px 2px rgba(56,49,47,0.10), 1px 1px 0px 1px rgba(56,49,47,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BodyText size="large" weight="semibold" color="primary">Effective Date</BodyText>
        <IconButton icon="xmark-solid" aria-label="Close" variant="outlined" color="secondary" size="small" onClick={onClose} />
      </div>
      {!useIndividualDates && (
        <>
          <DatePicker
            label="Date"
            value={effectiveDate}
            onChange={({ value }) => { if (value) onDateChange(value); }}
            width={100}
          />
          <div style={{ height: 1, background: 'var(--border-neutral-x-weak)' }} />
        </>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <BodyText size="small" weight="medium">Use individual dates</BodyText>
          <BodyText size="extra-small" color="neutral-medium">Adds an Effective Date column to the table</BodyText>
        </div>
        <RoundedToggle
          ariaLabel="Use individual dates"
          isChecked={useIndividualDates}
          isControlled={true}
          onChange={onToggleIndividualDates}
        />
      </div>
    </div>
  );
}

// ─── Column Header Menu ───────────────────────────────────────────────────────
function ColumnHeaderMenu({ anchor, onSortAsc, onSortDesc, onAddFilter, onBulkEdit, onResetChanges, onRemove, onClose }: { anchor: DOMRect; onSortAsc: () => void; onSortDesc: () => void; onAddFilter: () => void; onBulkEdit: () => void; onResetChanges: () => void; onRemove: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  const menuWidth = 192;
  const items: ({ icon: string; label: string; action: () => void; danger?: boolean } | null)[] = [
    { icon: 'arrow-up-short-wide-regular', label: 'Sort Ascending', action: () => { onSortAsc(); onClose(); } },
    { icon: 'arrow-down-wide-short-regular', label: 'Sort Descending', action: () => { onSortDesc(); onClose(); } },
    null,
    { icon: 'sliders-regular', label: 'Edit Filter', action: () => { onAddFilter(); onClose(); } },
    { icon: 'pen-regular', label: 'Bulk Edit Column', action: () => { onBulkEdit(); onClose(); } },
    { icon: 'arrow-rotate-left-regular', label: 'Reset Changes', action: () => { onResetChanges(); onClose(); } },
    null,
    { icon: 'circle-xmark-regular', label: 'Remove', action: () => { onRemove(); onClose(); }, danger: true },
  ];
  return (
    <div ref={ref} style={{ position: 'fixed', zIndex: 100, background: 'var(--surface-neutral-white)', borderRadius: 8, border: '1px solid var(--border-neutral-weak)', padding: '4px 0', top: anchor.bottom + 4, left: anchor.right - menuWidth, minWidth: menuWidth, boxShadow: '3px 3px 10px 0px rgba(56,49,47,0.10)' }}>
      {items.map((item, i) =>
        item === null ? (
          <div key={i} style={{ height: 1, background: 'var(--border-neutral-x-weak)', margin: '4px 16px' }} />
        ) : (
          <button key={item.label} onClick={item.action}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface-neutral-xx-weak)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: 'none', cursor: 'pointer', background: 'transparent' }}>
            <span style={item.danger ? { color: 'var(--text-error-strong)' } : undefined}>
              <IconV2 name={item.icon as any} size={16} />
            </span>
            <span style={item.danger ? { color: 'var(--text-error-strong)' } : undefined}>
              <BodyText size="medium">{item.label}</BodyText>
            </span>
          </button>
        )
      )}
    </div>
  );
}

// ─── Bulk Edit Panel ──────────────────────────────────────────────────────────
function BulkEditPanel({ col, rowCount, onApply, onClose }: { col: { key: ColKey; label: string; anchor: DOMRect }; rowCount: number; onApply: (value: string) => void; onClose: () => void }) {
  const [value, setValue] = useState('');

  const isDate = DATE_COL_KEYS.has(col.key);
  const options = COL_OPTIONS[col.key];

  let fieldElement: JSX.Element;
  if (isDate) {
    fieldElement = (
      <DatePicker
        size="medium"
        value={value || undefined}
        onChange={({ value: v }) => setValue(v ?? '')}
      />
    );
  } else if (options) {
    fieldElement = (
      <SelectField
        ariaLabel={col.label}
        size="medium"
        isClearable={true}
        showSearch="always"
        value={value || undefined}
        items={options.map((o) => ({ text: o, value: o }))}
        onSelect={(v) => setValue(v as string)}
        onClear={() => setValue('')}
      />
    );
  } else {
    fieldElement = (
      <TextField
        size="medium"
        value={value}
        onChange={(e) => setValue((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onApply(value.trim()); if (e.key === 'Escape') onClose(); }}
      />
    );
  }

  return (
    <div style={{ position: 'fixed', zIndex: 50, background: 'var(--surface-neutral-white)', borderRadius: 'var(--radius-small)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, top: col.anchor.bottom + 4, left: col.anchor.left, width: 300, boxShadow: '3px 3px 10px 2px rgba(56,49,47,0.10), 1px 1px 0px 1px rgba(56,49,47,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BodyText size="large" weight="semibold" color="primary">{col.label}</BodyText>
        <IconButton icon="xmark-solid" aria-label="Close" variant="outlined" color="secondary" size="small" onClick={onClose} />
      </div>
      <p style={{ fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-neutral-medium)', margin: 0 }}>Set value for all {rowCount} rows</p>
      {fieldElement}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="outlined" color="secondary" size="small" onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" size="small" disabled={!value.trim()} onClick={() => value.trim() && onApply(value.trim())}>Apply to All</Button>
      </div>
    </div>
  );
}

// ─── Main PowerEdit Component ─────────────────────────────────────────────────
export function PowerEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedIds: number[] = location.state?.selectedIds ?? [];
  const hasSelection = selectedIds.length > 0;
  const displayEmployees = hasSelection ? employees.filter((e) => !e.isTBH && selectedIds.includes(e.id)) : [];
  const sessionName: string = location.state?.sessionName ?? '';
  const isReadonly: boolean = location.state?.readonly ?? false;
  const baseColumns = sessionName ? DEFAULT_ALL_COLUMNS : NEW_EDIT_COLUMNS;
  const [editTitle, setEditTitle] = useState(sessionName);
  const [titleEditing, setTitleEditing] = useState(!sessionName && !isReadonly);
  const [titleError, setTitleError] = useState(false);
  const [slidedown, setSlidedown] = useState<{ message: string; type: 'success' | 'error' | 'information' } | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [describeItOpen, setDescribeItOpen] = useState(false);
  const [describeItClosing, setDescribeItClosing] = useState(false);
  function closeDescribeIt() {
    setDescribeItClosing(true);
    setTimeout(() => { setDescribeItOpen(false); setDescribeItClosing(false); }, 280);
  }
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterRecord[]>([]);
  const [filterMatchAll, setFilterMatchAll] = useState(true);
  const filterNextId = useRef(1);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<string>(location.state?.datasetType ?? 'Employees');
  const [selectedFields, setSelectedFields] = useState<string[]>(sessionName ? ['Name', 'Job Title', 'Manager', 'Hire Date', 'Pay Rate'] : DEFAULT_SELECTED_FIELDS);
  const [editingCell, setEditingCell] = useState<{ id: number; col: ColKey } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [edits, setEdits] = useState<Record<string, { original: string; current: string }>>({});
  const [hoveredHeaderCol, setHoveredHeaderCol] = useState<ColKey | null>(null);
  const [bulkEditCol, setBulkEditCol] = useState<{ key: ColKey; label: string; anchor: DOMRect } | null>(null);
  const [effectivePanelOpen, setEffectivePanelOpen] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [useIndividualDates, setUseIndividualDates] = useState(false);
  const [dragColKey, setDragColKey] = useState<ColKey | null>(null);
  const [overColKey, setOverColKey] = useState<ColKey | null>(null);
  const [openHeaderMenuCol, setOpenHeaderMenuCol] = useState<{ key: ColKey; label: string; anchor: DOMRect } | null>(null);
  const [sortCol, setSortCol] = useState<ColKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [pendingFilterField, setPendingFilterField] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [footerElevated, setFooterElevated] = useState(false);

  function handleContentScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    setFooterElevated(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }

  useEffect(() => { if (!hasSelection) { const t = setTimeout(() => setDescribeItOpen(true), 1000); return () => clearTimeout(t); } }, []);
  useEffect(() => { return () => { localStorage.removeItem('bhr-describe-it-open'); }; }, []);

  function startEditing(id: number, col: ColKey, currentValue: string) { setEditingCell({ id, col }); setEditingValue(currentValue); }
  function commitEdit(overrideValue?: string) {
    if (!editingCell) return;
    const { id, col } = editingCell;
    const key = `${id}-${col}`;
    const employee = displayEmployees.find((e) => e.id === id)!;
    const original = getOriginalValue(employee, col, effectiveDate);
    const newValue = (overrideValue ?? editingValue).trim();
    if (newValue && newValue !== original) setEdits((prev) => ({ ...prev, [key]: { original, current: newValue } }));
    setEditingCell(null);
  }
  function getCellDisplayValue(employee: (typeof displayEmployees)[0], col: ColKey): string { const key = `${employee.id}-${col}`; return edits[key]?.current ?? getOriginalValue(employee, col, effectiveDate); }
  function applyBulkEdit(col: ColKey, value: string) {
    setEdits((prev) => { const next = { ...prev }; for (const emp of displayEmployees) { const key = `${emp.id}-${col}`; const original = prev[key]?.original ?? getOriginalValue(emp, col, effectiveDate); next[key] = { original, current: value }; } return next; });
    setBulkEditCol(null);
  }
  function applyEditCell(employeeId: number, col: ColKey, value: string) {
    setEdits((prev) => { const key = `${employeeId}-${col}`; const emp = displayEmployees.find((e) => e.id === employeeId); if (!emp) return prev; const original = prev[key]?.original ?? getOriginalValue(emp, col, effectiveDate); return { ...prev, [key]: { original, current: value } }; });
  }
  function handleAssistantAction(action: PowerEditAction) {
    switch (action.type) {
      case 'bulk_edit_column': applyBulkEdit(action.col as ColKey, action.value); break;
      case 'sort_column': setSortCol(action.col as ColKey); setSortDir(action.direction); break;
      case 'add_field': { const all = Object.values(fieldsByCategory).flat().map((f) => f.name); if (all.includes(action.fieldName) && !selectedFields.includes(action.fieldName)) setSelectedFields((prev) => [...prev, action.fieldName]); break; }
      case 'remove_column': setSelectedFields((prev) => prev.filter((f) => FIELD_TO_COL[f]?.key !== (action.col as ColKey))); break;
      case 'reset_column': { const colKey = action.col as ColKey; setEdits((prev) => { const next = { ...prev }; for (const key of Object.keys(next)) { if (key.endsWith(`-${colKey}`)) delete next[key]; } return next; }); break; }
      case 'edit_cell': applyEditCell(action.employeeId, action.col as ColKey, action.value); break;
    }
  }

  const activeColsForContext = [...selectedFieldsToColumns(selectedFields, baseColumns), ...(useIndividualDates ? [{ key: 'effectiveDate' as ColKey, label: 'Effective Date' }] : [])];
  const tableContext: TableContext = { columns: activeColsForContext, employees: displayEmployees.map((e) => ({ id: e.id, data: Object.fromEntries(activeColsForContext.map((col) => [col.label, edits[`${e.id}-${col.key}`]?.current ?? getOriginalValue(e, col.key, effectiveDate)])) })) };
  const sortedEmployees = sortCol ? [...displayEmployees].sort((a, b) => {
    if (sortCol === 'salary') { const diff = getSalary(a.id) - getSalary(b.id); return sortDir === 'asc' ? diff : -diff; }
    let av = getOriginalValue(a, sortCol, effectiveDate); let bv = getOriginalValue(b, sortCol, effectiveDate);
    if (sortCol === 'hireDate') { av = parseMDYToISO(av); bv = parseMDYToISO(bv); }
    const cmp = av.localeCompare(bv); return sortDir === 'asc' ? cmp : -cmp;
  }) : displayEmployees;


  return (
    <div style={{ display: 'flex', flex: 1, minWidth: 0, gap: '12px' }}>
      {/* Main content column — white rounded card matching PageCapsule visual */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: 'var(--surface-neutral-white)', borderRadius: 20, margin: '0 0 24px 0' }}>
      <div ref={scrollContainerRef} onScroll={handleContentScroll} style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 32px 32px', background: 'var(--surface-neutral-xx-weak)' }}>
        {/* Back */}
        <div style={{ marginBottom: 12 }}>
          <TextButton size="small" color="secondary" onClick={() => navigate('/people/power-edit')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconV2 name="chevron-left-solid" size={14} />
              Back
            </span>
          </TextButton>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          {titleEditing ? (
            <div style={{ flex: 1, maxWidth: 640 }}>
              <TextField
                autoFocus
                value={editTitle}
                onChange={(e) => { setEditTitle((e.target as HTMLInputElement).value); if ((e.target as HTMLInputElement).value.trim()) setTitleError(false); }}
                placeholder="Name your edit..."
                status={titleError ? 'error' : undefined}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                onBlur={() => { if (editTitle.trim()) setTitleEditing(false); }}
                width={100}
              />
            </div>
          ) : (
            <h1 onClick={() => { if (!isReadonly) setTitleEditing(true); }} style={{ fontFamily: 'Fields, system-ui, sans-serif', fontSize: 40, fontWeight: 700, lineHeight: '48px', color: editTitle ? 'var(--color-primary-strong)' : 'var(--text-neutral-weak)', cursor: isReadonly ? 'default' : 'text', margin: 0 }}>
              {editTitle || 'Name your edit...'}
            </h1>
          )}
          <Pill muted type={isReadonly ? PillType.Success : PillType.Neutral}>
            {isReadonly ? 'Published' : 'Draft'}
          </Pill>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Power Edit Assistant — AI outlined button */}
          <Button
            variant="outlined"
            color="ai"
            size="medium"
            startIcon={<IconV2 name="sparkles-regular" size={16} />}
            onClick={() => { setDescribeItClosing(false); setDescribeItOpen(true); localStorage.setItem('bhr-describe-it-open', 'true'); }}
          >
            Power Edit Assistant
          </Button>

          {/* Employees / Fields */}
          <ButtonGroup variant="outlined" color="secondary" size="medium">
            <Dropdown
              type="button"
              ButtonProps={{
                variant: 'outlined',
                color: 'secondary',
                size: 'medium',
                startIcon: <IconV2 name={(EMPLOYEE_OPTIONS.find(o => o.label === selectedEmployeeType) ?? EMPLOYEE_OPTIONS[1]).icon as any} size={16} />,
              }}
              items={EMPLOYEE_OPTIONS.map(({ label }) => ({ text: label, value: label }))}
              renderOptionContent={(item) => {
                const opt = EMPLOYEE_OPTIONS.find(o => o.label === item.text);
                return (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconV2 name={(opt?.icon ?? 'user-group-regular') as any} size={16} />
                    {item.text}
                  </span>
                );
              }}
              onSelect={(value) => setSelectedEmployeeType(value as string)}
            >
              {selectedEmployeeType}
            </Dropdown>
            <div style={{ position: 'relative' }}>
              <Button
                variant="outlined"
                color="secondary"
                size="medium"
                startIcon={<IconV2 name="table-columns-regular" size={16} />}
                endIcon={<IconV2 name="caret-down-solid" size={10} />}
                onClick={() => setFieldsOpen((v) => !v)}
              >
                {selectedFields.length > 0 ? `Fields (${selectedFields.length})` : 'Fields'}
              </Button>
              {fieldsOpen && <FieldsPanel onClose={() => setFieldsOpen(false)} selectedFields={selectedFields} onSelectedFieldsChange={setSelectedFields} />}
            </div>
          </ButtonGroup>

          {/* Filters — dropdown button */}
          <div style={{ position: 'relative' }}>
            <Button
              variant="outlined"
              color="secondary"
              size="medium"
              startIcon={<IconV2 name="sliders-regular" size={16} />}
              endIcon={<IconV2 name="caret-down-solid" size={10} />}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              {filters.length > 0 ? `Filters (${filters.length})` : 'Filters'}
            </Button>
            {filtersOpen && <FiltersPanel onClose={() => { setFiltersOpen(false); setPendingFilterField(null); }} initialFilterField={pendingFilterField} filters={filters} onFiltersChange={setFilters} matchAll={filterMatchAll} onMatchAllChange={setFilterMatchAll} nextIdRef={filterNextId} />}
          </div>

          {/* Effective Date — dropdown button, turns primary when custom dates are active */}
          <div style={{ position: 'relative' }}>
            <Button
              variant="outlined"
              color={useIndividualDates ? 'primary' : 'secondary'}
              size="medium"
              startIcon={<IconV2 name="calendar-regular" size={16} />}
              endIcon={<IconV2 name="caret-down-solid" size={10} />}
              onClick={() => setEffectivePanelOpen((v) => !v)}
            >
              Effective Date ({useIndividualDates ? 'Custom' : formatEffectiveDateLabel(effectiveDate)})
            </Button>
            {effectivePanelOpen && <EffectiveDatePanel effectiveDate={effectiveDate} onDateChange={setEffectiveDate} useIndividualDates={useIndividualDates} onToggleIndividualDates={() => setUseIndividualDates((v) => !v)} onClose={() => setEffectivePanelOpen(false)} />}
          </div>
          </div>{/* end left toolbar group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {(['arrow-down-to-line-regular', 'user-plus-regular'] as const).map((iconName) => (
              <IconButton key={iconName} icon={iconName} aria-label={iconName} variant="outlined" color="secondary" size="medium" />
            ))}
          </div>
        </div>

        {/* Table or blank state */}
        {sortedEmployees.length === 0 ? (
          <Section ariaLabel="Edit table">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 8 }}>
              <BodyText size="large" weight="semibold" color="neutral-medium">Nothing in the works yet...</BodyText>
              <BodyText size="medium" color="neutral-medium">Use the assistant to get started, or add employees using the toolbar above.</BodyText>
            </div>
          </Section>
        ) : (
          <Section ariaLabel="Edit table" paddingTop="20px">
            {(() => {
              const activeCols = [...selectedFieldsToColumns(selectedFields, baseColumns), ...(useIndividualDates ? [{ key: 'effectiveDate' as ColKey, label: 'Effective Date' }] : [])];
              const lastColKey = activeCols[activeCols.length - 1]?.key;
              return (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-neutral-xx-weak)' }}>
                      {activeCols.map((col) => {
                        const isBeingDragged = dragColKey === col.key;
                        const isDropTarget = overColKey === col.key && dragColKey !== null && dragColKey !== col.key;
                        const isHovered = hoveredHeaderCol === col.key;
                        return (
                          <th key={col.key} draggable
                            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragColKey(col.key); }}
                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverColKey(col.key); }}
                            onDrop={(e) => { e.preventDefault(); if (!dragColKey || dragColKey === col.key) return; const keys = activeCols.map((c) => c.key); const from = keys.indexOf(dragColKey); const to = keys.indexOf(col.key); if (from === -1 || to === -1) return; const newKeys = [...keys]; const [moved] = newKeys.splice(from, 1); newKeys.splice(to, 0, moved); setSelectedFields(syncFieldsToColOrder(newKeys, selectedFields)); setDragColKey(null); setOverColKey(null); }}
                            onDragEnd={() => { setDragColKey(null); setOverColKey(null); }}
                            onMouseEnter={() => setHoveredHeaderCol(col.key)}
                            onMouseLeave={() => setHoveredHeaderCol(null)}
                            style={{
                              padding: '10px 24px',
                              borderBottom: '1px solid var(--border-neutral-x-weak)',
                              textAlign: col.align ?? 'left',
                              userSelect: 'none',
                              cursor: 'grab',
                              position: 'relative',
                              borderRadius: col.key === activeCols[0]?.key ? '6px 0 0 0' : col.key === lastColKey ? '0 6px 0 0' : undefined,
                              opacity: isBeingDragged ? 0.4 : 1,
                              borderLeft: isDropTarget ? '2px solid var(--color-primary-strong)' : undefined,
                              background: isHovered ? 'var(--surface-neutral-x-weak)' : undefined,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <BodyText size="small" weight="semibold">{col.label}</BodyText>
                            <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none', transition: 'opacity 0.15s' }}>
                              <IconButton
                                icon="ellipsis-vertical-solid"
                                aria-label={`${col.label} column options`}
                                variant="text"
                                color="secondary"
                                size="small"
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpenHeaderMenuCol({ key: col.key, label: col.label, anchor: (e.currentTarget as HTMLElement).getBoundingClientRect() }); }}
                              />
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEmployees.map((employee, index) => (
                      <tr key={employee.id} style={{ borderBottom: index < sortedEmployees.length - 1 ? '1px solid var(--border-neutral-x-weak)' : undefined }}>
                        {activeCols.map((col) => {
                          const cellKey = `${employee.id}-${col.key}`;
                          const isEditing = editingCell?.id === employee.id && editingCell?.col === col.key;
                          const edit = edits[cellKey];
                          const displayValue = getCellDisplayValue(employee, col.key);
                          const isNameCol = col.key === 'name';
                          return (
                            <td key={col.key} style={{ padding: isEditing ? 8 : 16, cursor: 'text', textAlign: col.align ?? 'left' }}
                              onClick={() => {
                                if (!isEditing) startEditing(employee.id, col.key, displayValue);
                              }}>
                              {isEditing && COL_OPTIONS[col.key] ? (
                                <CellSelect
                                  colLabel={col.label}
                                  value={editingValue || undefined}
                                  items={(COL_OPTIONS[col.key] ?? []).map((o) => ({ text: o, value: o }))}
                                  onSelect={(v) => {
                                    if (!editingCell) return;
                                    const key = `${editingCell.id}-${editingCell.col}`;
                                    const emp = displayEmployees.find((e) => e.id === editingCell.id)!;
                                    const original = getOriginalValue(emp, editingCell.col, effectiveDate);
                                    const newVal = v.trim();
                                    if (newVal && newVal !== original) setEdits((prev) => ({ ...prev, [key]: { original, current: newVal } }));
                                    setEditingCell(null);
                                  }}
                                  onClear={() => {
                                    if (!editingCell) return;
                                    const key = `${editingCell.id}-${editingCell.col}`;
                                    setEdits((prev) => { const next = { ...prev }; delete next[key]; return next; });
                                    setEditingValue('');
                                  }}
                                  onClose={() => setEditingCell(null)}
                                />
                              ) : isEditing && DATE_COL_KEYS.has(col.key) ? (
                                <div style={{ width: 140 }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') setEditingCell(null); }}>
                                  <DatePicker
                                    open={true}
                                    value={col.key === 'hireDate' || col.key === 'birthDate' ? parseMDYToISO(editingValue) : parseDisplayToISO(editingValue)}
                                    onChange={({ value }) => {
                                      if (value) commitEdit(col.key === 'hireDate' || col.key === 'birthDate' ? parseISOToMDY(value) : formatDateDisplay(value));
                                    }}
                                    onClose={() => setEditingCell(null)}
                                    size="small"
                                    width={100}
                                  />
                                </div>
                              ) : isEditing ? (
                                <TextField
                                  autoFocus
                                  size="small"
                                  width={100}
                                  value={editingValue}
                                  onChange={(e) => setEditingValue((e.target as HTMLInputElement).value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
                                  onBlur={() => commitEdit()}
                                  InputProps={editingValue ? {
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton
                                          icon="xmark-regular"
                                          aria-label="Clear"
                                          size="small"
                                          noBoundingBox
                                          onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); setEditingValue(''); }}
                                        />
                                      </InputAdornment>
                                    ),
                                  } : undefined}
                                />
                              ) : edit ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <span style={{ textDecoration: 'line-through' }}>
                                    <BodyText size="small" color="neutral-weak">{edit.original}</BodyText>
                                  </span>
                                  <BodyText size="medium" weight="medium" color="primary">{edit.current}</BodyText>
                                </div>
                              ) : (
                                <span style={isNameCol ? { color: '#0b4fd1' } : undefined}>
                                  <BodyText size="medium" weight={isNameCol ? 'medium' : 'regular'}>{displayValue}</BodyText>
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </Section>
        )}
      </div>

      {openHeaderMenuCol && (
        <ColumnHeaderMenu anchor={openHeaderMenuCol.anchor}
          onSortAsc={() => { setSortCol(openHeaderMenuCol.key); setSortDir('asc'); }}
          onSortDesc={() => { setSortCol(openHeaderMenuCol.key); setSortDir('desc'); }}
          onAddFilter={() => { const ff = COL_TO_FILTER_FIELD[openHeaderMenuCol.key] ?? FILTER_FIELD_OPTIONS[0]; setPendingFilterField(ff); setFiltersOpen(true); }}
          onBulkEdit={() => setBulkEditCol({ key: openHeaderMenuCol.key, label: openHeaderMenuCol.label, anchor: openHeaderMenuCol.anchor })}
          onResetChanges={() => { const colKey = openHeaderMenuCol.key; setEdits((prev) => { const next = { ...prev }; for (const key of Object.keys(next)) { if (key.endsWith(`-${colKey}`)) delete next[key]; } return next; }); }}
          onRemove={() => { const colKey = openHeaderMenuCol.key; setSelectedFields((prev) => prev.filter((f) => FIELD_TO_COL[f]?.key !== colKey)); }}
          onClose={() => setOpenHeaderMenuCol(null)} />
      )}


      {bulkEditCol && <BulkEditPanel col={bulkEditCol} rowCount={displayEmployees.length} onApply={(value) => applyBulkEdit(bulkEditCol.key, value)} onClose={() => setBulkEditCol(null)} />}

      {/* Footer */}
      {isReadonly ? (
        <div style={{ position: 'sticky', bottom: 0 }} className="pe-action-footer">
          <ActionFooter
            actions={[
              <Button key="back" variant="outlined" color="secondary" size="medium" onClick={() => navigate('/people/power-edit')}>Back to Power Edit</Button>,
            ]}
          />
        </div>
      ) : (
        <div style={{ position: 'sticky', bottom: 0 }} className="pe-action-footer">
          <ActionFooter
            actions={[
              <Button key="publish" variant="contained" color="primary" size="medium"
                onClick={() => { if (!editTitle.trim()) { setTitleError(true); setTitleEditing(true); setSlidedown({ message: 'Give your edit a name before publishing.', type: 'error' }); return; } navigate('/people/power-edit', { state: { toast: 'published', sessionName: editTitle, activeTab: 'completed' } }); }}>
                Publish Changes
              </Button>,
              <Button key="save" variant="outlined" color="secondary" size="medium"
                onClick={() => { if (!editTitle.trim()) { setTitleError(true); setTitleEditing(true); setSlidedown({ message: 'Give your edit a name before saving.', type: 'error' }); return; } navigate('/people/power-edit', { state: { toast: 'draft', sessionName: editTitle, activeTab: 'draft' } }); }}>
                Save &amp; Finish Later
              </Button>,
              <TextButton key="cancel" size="medium" onClick={() => setCancelConfirmOpen(true)}>Cancel</TextButton>,
            ]}
          />
        </div>
      )}

      {/* Cancel confirmation modal */}
      <StandardModal isOpen={cancelConfirmOpen} onRequestClose={() => setCancelConfirmOpen(false)}>
        <StandardModal.HeroHeadline icon="pen-to-square-solid" text="Save before leaving?" />
        <StandardModal.Body
          renderFooter={
            <StandardModal.Footer
              actions={[
                <TextButton key="delete" color="secondary" onClick={() => navigate('/people/power-edit')}>Delete these edits</TextButton>,
                <Button key="save" variant="contained" color="primary"
                  onClick={() => { if (!editTitle.trim()) { setCancelConfirmOpen(false); setTitleError(true); setTitleEditing(true); setSlidedown({ message: 'Give your edit a name before saving.', type: 'error' }); return; } navigate('/people/power-edit', { state: { toast: 'draft', sessionName: editTitle, activeTab: 'draft' } }); }}>
                  Save &amp; Finish Later
                </Button>,
              ]}
            />
          }
        >
          <StandardModal.UpperContent>
            <BodyText size="medium" color="neutral-medium">
              You have unsaved changes. Save as a draft to continue editing later, or discard them entirely.
            </BodyText>
          </StandardModal.UpperContent>
        </StandardModal.Body>
      </StandardModal>

      {/* Slidedown notification */}
      {slidedown && (
        <SimpleSlidedown
          show
          showDismiss
          onDismiss={() => setSlidedown(null)}
          message={slidedown.message}
          type={slidedown.type}
        />
      )}
      </div>{/* end main content column */}

      {/* Assistant panel — sits outside the page capsule, pushes content left */}
      <style>{`
        @keyframes pe-panel-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes pe-panel-out {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(110%); opacity: 0; }
        }
      `}</style>
      {describeItOpen && (
        <div style={{ width: 376, flexShrink: 0, padding: '0 0 24px 16px', display: 'flex', animation: `${describeItClosing ? 'pe-panel-out' : 'pe-panel-in'} 280ms cubic-bezier(0.4,0,0.2,1) both` }}>
          <DescribeItPanel
            onClose={closeDescribeIt}
            onAction={handleAssistantAction}
            tableContext={tableContext}
          />
        </div>
      )}
    </div>
  );
}

export default PowerEdit;
