import { useState, useEffect, useRef } from 'react';
import { InputAdornment } from '@mui/material';
import {
  IconV2,
  IconButton,
  BodyText,
  TextField,
  Checkbox,
} from '@bamboohr/fabric';

// ─── Types & Constants ────────────────────────────────────────────────────────

export const fieldCategories = [
  'Personal', 'Job', 'Time Off', 'Benefits', 'Training',
  'Performance', 'Assets', 'Notes', 'Emergency', 'Tasks', 'Calculated',
];

export type FieldType = 'text' | 'date' | 'number' | 'list';
export type FieldDef = { name: string; type: FieldType };

export const fieldsByCategory: Record<string, FieldDef[]> = {
  Personal: [
    { name: 'Name', type: 'text' }, { name: 'Employee #', type: 'number' },
    { name: 'Status', type: 'list' }, { name: 'First Name', type: 'text' },
    { name: 'Middle Name', type: 'text' }, { name: 'Last Name', type: 'text' },
    { name: 'Preferred Name', type: 'text' }, { name: 'Birth Date', type: 'date' },
    { name: 'Gender', type: 'list' }, { name: 'Gender Identity', type: 'list' },
    { name: 'Pronouns', type: 'text' }, { name: 'Ethnicity', type: 'list' },
    { name: 'Marital Status', type: 'list' }, { name: 'SSN', type: 'text' },
    { name: 'Tax File Number', type: 'text' },
  ],
  Job: [
    { name: 'Job Title', type: 'text' }, { name: 'Department', type: 'list' },
    { name: 'Location', type: 'list' }, { name: 'Hire Date', type: 'date' },
    { name: 'Manager', type: 'text' }, { name: 'Pay Rate', type: 'number' },
    { name: 'Employment Status', type: 'list' }, { name: 'Employment Type', type: 'list' },
    { name: 'Division', type: 'list' }, { name: 'Cost Center', type: 'text' },
  ],
  'Time Off': [
    { name: 'Available Balance', type: 'number' }, { name: 'Used YTD', type: 'number' },
    { name: 'Policy', type: 'list' }, { name: 'Next Accrual Date', type: 'date' },
  ],
  Benefits: [
    { name: 'Plan Name', type: 'text' }, { name: 'Coverage Level', type: 'list' },
    { name: 'Benefit Effective Date', type: 'date' }, { name: 'Annual Cost', type: 'number' },
  ],
  Training: [
    { name: 'Course Name', type: 'text' }, { name: 'Completion Date', type: 'date' },
    { name: 'Training Status', type: 'list' }, { name: 'Score', type: 'number' },
  ],
  Performance: [
    { name: 'Review Date', type: 'date' }, { name: 'Rating', type: 'number' },
    { name: 'Reviewer', type: 'text' }, { name: 'Goal Status', type: 'list' },
  ],
  Assets: [
    { name: 'Asset Name', type: 'text' }, { name: 'Serial Number', type: 'text' },
    { name: 'Assigned Date', type: 'date' }, { name: 'Asset Category', type: 'list' },
  ],
  Notes: [
    { name: 'Note', type: 'text' }, { name: 'Date Added', type: 'date' },
    { name: 'Note Type', type: 'list' },
  ],
  Emergency: [
    { name: 'Contact Name', type: 'text' }, { name: 'Relationship', type: 'list' },
    { name: 'Phone', type: 'text' }, { name: 'Email', type: 'text' },
  ],
  Tasks: [
    { name: 'Task Name', type: 'text' }, { name: 'Due Date', type: 'date' },
    { name: 'Task Status', type: 'list' }, { name: 'Assignee', type: 'text' },
  ],
  Calculated: [
    { name: 'Tenure (Years)', type: 'number' }, { name: 'Age', type: 'number' },
    { name: 'Days Since Hire', type: 'number' },
  ],
};

// ─── FieldTypeIcon ────────────────────────────────────────────────────────────

export function FieldTypeIcon({ type }: { type: FieldType }) {
  if (type === 'date') return <IconV2 name="calendar-solid" size={12} />;
  const label = type === 'number' ? '#' : type === 'list' ? '≡' : 'T';
  return (
    <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1, width: 13, textAlign: 'center', color: 'var(--icon-neutral-medium)', flexShrink: 0 }}>
      {label}
    </span>
  );
}

// ─── FieldsPanel Component ────────────────────────────────────────────────────

export function FieldsPanel({
  onClose,
  selectedFields,
  onSelectedFieldsChange,
  anchor,
}: {
  onClose: () => void;
  selectedFields: string[];
  onSelectedFieldsChange: (fields: string[]) => void;
  anchor: DOMRect;
}) {
  const [activeCategory, setActiveCategory] = useState('Personal');
  const [search, setSearch] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const categoryFields = fieldsByCategory[activeCategory] ?? [];
  const filtered = search
    ? Object.values(fieldsByCategory).flat().filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : categoryFields;
  const sectionHeading = search ? 'Search results' : activeCategory;

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
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: 760,
        height: 520,
        boxShadow: '3px 3px 10px 2px rgba(56,49,47,0.10), 1px 1px 0px 1px rgba(56,49,47,0.04)',
      }}
    >
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
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setSearch(''); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-primary-strong)' : 'transparent',
                  }}
                >
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
                      onSelectedFieldsChange(
                        c ? [...selectedFields, field.name] : selectedFields.filter((f) => f !== field.name)
                      );
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

        {/* Right: selected fields (draggable) */}
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
                <div
                  key={name}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragIdx(idx); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverIdx(idx); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIdx === null || dragIdx === idx) return;
                    const next = [...selectedFields];
                    const [moved] = next.splice(dragIdx, 1);
                    next.splice(idx, 0, moved);
                    onSelectedFieldsChange(next);
                    setDragIdx(null);
                    setOverIdx(null);
                  }}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${isOver ? 'var(--color-primary-strong)' : 'var(--border-neutral-weak)'}`,
                    background: 'var(--surface-neutral-white)',
                    userSelect: 'none',
                    cursor: 'grab',
                    opacity: isDragging ? 0.4 : 1,
                    boxShadow: isOver ? '0 0 0 1px var(--color-primary-strong)' : undefined,
                  }}
                >
                  <span style={{ color: 'var(--icon-neutral-weak)', fontSize: 14, flexShrink: 0 }}>⠿</span>
                  {fieldDef && <FieldTypeIcon type={fieldDef.type} />}
                  <BodyText size="extra-small" color="neutral-strong">
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 110 }}>
                      {name}
                    </span>
                  </BodyText>
                  <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <IconButton
                      icon="circle-xmark-regular"
                      aria-label={`Remove ${name}`}
                      noBoundingBox
                      color="secondary"
                      size="small"
                      onMouseDown={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onSelectedFieldsChange(selectedFields.filter((f) => f !== name));
                      }}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
