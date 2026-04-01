import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  IconV2,
  BodyText,
  Section,
  IconButton,
  Button,
  SelectField,
  Link,
  Avatar,
} from '@bamboohr/fabric';
import { Pagination } from './Pagination';
import { FiltersPanel, FilterRecord, applyFilters } from './FiltersPanel';
import { FieldsPanel } from './FieldsPanel';
import type { Employee } from '../data/employees';
import './PeopleListView.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type ColKey = 'avatar' | 'employeeNumber' | 'name' | 'title' | 'department' | 'location' | 'division' | 'employmentType' | 'employmentStatus' | 'hireDate' | 'reportsTo';

type ColDef = { key: ColKey; label: string };

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef[] = [
  { key: 'avatar', label: 'Photo' },
  { key: 'employeeNumber', label: 'Employee #' },
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Job Title' },
  { key: 'department', label: 'Department' },
  { key: 'location', label: 'Location' },
  { key: 'division', label: 'Division' },
  { key: 'employmentType', label: 'Employment Type' },
  { key: 'employmentStatus', label: 'Employment Status' },
  { key: 'hireDate', label: 'Hire Date' },
  { key: 'reportsTo', label: 'Manager' },
];

// Map from FieldsPanel field names → ColKey
const FIELD_NAME_TO_COL: Record<string, ColKey> = {
  'Employee #': 'employeeNumber',
  'Name': 'name',
  'Job Title': 'title',
  'Department': 'department',
  'Location': 'location',
  'Division': 'division',
  'Employment Type': 'employmentType',
  'Employment Status': 'employmentStatus',
  'Hire Date': 'hireDate',
  'Manager': 'reportsTo',
};

// Default selected fields (matches original default visible cols minus avatar which is always shown)
const DEFAULT_SELECTED_FIELDS = ['Employee #', 'Name', 'Job Title', 'Location', 'Employment Status', 'Hire Date'];

// ─── Cell renderer ────────────────────────────────────────────────────────────

function renderCell(col: ColKey, employee: Employee) {
  switch (col) {
    case 'avatar': return <Avatar src={employee.avatar} alt={employee.name} size={40} />;
    case 'employeeNumber': return <BodyText size="medium">{employee.employeeNumber}</BodyText>;
    case 'name': return <Link href={`/employees/${employee.id}`}>{employee.lastName}, {employee.firstName}</Link>;
    case 'title': return <BodyText size="medium" color="neutral-medium">{employee.title}</BodyText>;
    case 'department': return <BodyText size="medium" color="neutral-medium">{employee.department}</BodyText>;
    case 'location': return <BodyText size="medium" color="neutral-medium">{employee.location}</BodyText>;
    case 'division': return <BodyText size="medium" color="neutral-medium">{employee.division}</BodyText>;
    case 'employmentType': return <BodyText size="medium" color="neutral-medium">{employee.employmentType}</BodyText>;
    case 'employmentStatus': return <BodyText size="medium" color="neutral-medium">{employee.employmentStatus}</BodyText>;
    case 'hireDate': return <BodyText size="medium" color="neutral-medium">{employee.hireDate}</BodyText>;
    case 'reportsTo': return <BodyText size="medium" color="neutral-medium">{employee.reportsTo ?? '—'}</BodyText>;
    default: return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface PeopleListViewProps {
  employees: Employee[];
}

export function PeopleListView({ employees }: PeopleListViewProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [showingFilter, setShowingFilter] = useState('active');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filters
  const [filters, setFilters] = useState<FilterRecord[]>([]);
  const [filterMatchAll, setFilterMatchAll] = useState(true);
  const filterNextIdRef = useRef(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersAnchor, setFiltersAnchor] = useState<DOMRect | null>(null);

  // Fields (visible columns via shared FieldsPanel)
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_SELECTED_FIELDS);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [fieldsAnchor, setFieldsAnchor] = useState<DOMRect | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 50;

  // Compute filter field values from employee data
  const filterFieldValues = useMemo<Record<string, string[]>>(() => ({
    'Department': [...new Set(employees.map((e) => e.department))].sort(),
    'Location': [...new Set(employees.map((e) => e.location))].sort(),
    'Division': [...new Set(employees.map((e) => e.division))].sort(),
    'Employment Type': [...new Set(employees.map((e) => e.employmentType))].sort(),
    'Employment Status': [...new Set(employees.map((e) => e.employmentStatus))].sort(),
    'Job Title': [...new Set(employees.map((e) => e.title))].sort(),
    'Gender': [...new Set(employees.map((e) => e.gender))].sort(),
    'Ethnicity': [...new Set(employees.map((e) => e.ethnicity))].sort(),
    'Hire Date': [],
    'Birth Date': [],
  }), [employees]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showingOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'all', label: 'All' },
  ];

  // Apply showing filter first, then active filters
  const baseEmployees = useMemo(() => {
    if (showingFilter === 'active') return employees.filter((e) => e.employmentStatus !== 'Inactive');
    if (showingFilter === 'inactive') return employees.filter((e) => e.employmentStatus === 'Inactive');
    return employees;
  }, [employees, showingFilter]);

  const activeFilters = useMemo(
    () => filters.filter((f) => Array.isArray(f.value) ? f.value.length > 0 : f.value),
    [filters]
  );

  const filteredEmployees = useMemo(
    () => applyFilters(baseEmployees, filters, filterMatchAll),
    [baseEmployees, filters, filterMatchAll]
  );

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedCount = selectedIds.size;
  const allOnPageSelected = currentEmployees.length > 0 && currentEmployees.every((e) => selectedIds.has(e.id));
  const someOnPageSelected = currentEmployees.some((e) => selectedIds.has(e.id));

  // Compute visible column defs from selectedFields (avatar always first)
  const visibleColDefs = useMemo(() => {
    const cols: ColDef[] = [{ key: 'avatar', label: 'Photo' }];
    for (const name of selectedFields) {
      const key = FIELD_NAME_TO_COL[name];
      if (key) {
        const def = ALL_COLS.find((c) => c.key === key);
        if (def) cols.push(def);
      }
    }
    return cols;
  }, [selectedFields]);

  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const closeFields = useCallback(() => setFieldsOpen(false), []);

  function toggleRow(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allOnPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentEmployees.forEach((e) => next.delete(e.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentEmployees.forEach((e) => next.add(e.id));
        return next;
      });
    }
  }

  return (
    <div className="people-list-view">
      {/* Filter Bar */}
      <div className="people-list-filter-bar">
        {/* Left: Filters + Fields + count */}
        <div className="people-list-filter-left">
          <Button
            variant="outlined"
            color="secondary"
            size="medium"
            startIcon={<IconV2 name="sliders-regular" size={16} />}
            endIcon={<IconV2 name="caret-down-solid" size={10} />}
            onClick={(e: React.MouseEvent) => {
              if (filtersOpen) { setFiltersOpen(false); return; }
              setFieldsOpen(false);
              setFiltersAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
              setFiltersOpen(true);
            }}
          >
            {activeFilters.length > 0 ? `Filters (${activeFilters.length})` : 'Filters'}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            size="medium"
            startIcon={<IconV2 name="table-columns-regular" size={16} />}
            endIcon={<IconV2 name="caret-down-solid" size={10} />}
            onClick={(e: React.MouseEvent) => {
              if (fieldsOpen) { setFieldsOpen(false); return; }
              setFiltersOpen(false);
              setFieldsAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
              setFieldsOpen(true);
            }}
          >
            Fields
          </Button>

          <div className="people-list-count">
            <IconV2 name="users-solid" size={16} color="neutral-medium" />
            <BodyText size="small" color="neutral-weak">{totalItems}</BodyText>
          </div>
        </div>

        {/* Right: selection actions OR default controls */}
        {selectedCount > 0 ? (
          <div className="people-list-filter-right">
            <BodyText size="small" weight="medium">{selectedCount} Selected</BodyText>
            <Button
              variant="outlined"
              color="secondary"
              size="medium"
              startIcon={<IconV2 name="arrow-down-to-line-solid" size={16} />}
            >
              Download Forms
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="medium"
              startIcon={<IconV2 name="bolt-solid" size={16} />}
              onClick={() => navigate('/people/power-edit/edit', { state: { selectedIds: Array.from(selectedIds), filters, selectedFields } })}
            >
              Power Edit
            </Button>
            <IconButton
              icon="xmark-solid"
              aria-label="Clear selection"
              variant="outlined"
              color="secondary"
              size="medium"
              onClick={() => setSelectedIds(new Set())}
            />
          </div>
        ) : (
          <div className="people-list-filter-right">
            <div className="people-list-select-showing">
              <SelectField
                label="Showing"
                labelPlacement="inline"
                size="medium"
                variant="single"
                value={showingFilter}
                onChange={(e) => { setShowingFilter(e.target.value as string); setCurrentPage(1); }}
              >
                {showingOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </SelectField>
            </div>

            <div className="people-list-menu-wrapper" ref={menuRef}>
              <IconButton
                icon="ellipsis-solid"
                aria-label="More options"
                variant="outlined"
                color="secondary"
                size="medium"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
              {isMenuOpen && (
                <div className="people-list-menu">
                  <button className="people-list-menu-item" onClick={() => { setIsMenuOpen(false); navigate('/people/power-edit/edit'); }}>
                    <BodyText size="medium">Power Edit Employees</BodyText>
                  </button>
                  <button className="people-list-menu-item" onClick={() => setIsMenuOpen(false)}>
                    <BodyText size="medium">Download Forms</BodyText>
                  </button>
                  <button className="people-list-menu-item" onClick={() => setIsMenuOpen(false)}>
                    <BodyText size="medium">Customize View</BodyText>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Panels */}
      {filtersOpen && filtersAnchor && createPortal(
        <FiltersPanel
          anchor={filtersAnchor}
          filters={filters}
          onFiltersChange={setFilters}
          matchAll={filterMatchAll}
          onMatchAllChange={setFilterMatchAll}
          nextIdRef={filterNextIdRef}
          onClose={closeFilters}
          filterFieldValues={filterFieldValues}
        />,
        document.body
      )}
      {fieldsOpen && fieldsAnchor && createPortal(
        <FieldsPanel
          anchor={fieldsAnchor}
          selectedFields={selectedFields}
          onSelectedFieldsChange={setSelectedFields}
          onClose={closeFields}
        />,
        document.body
      )}

      {/* Table */}
      <Section>
        <div className="people-list-table-container">
          <table className="people-list-table">
            <thead>
              <tr>
                <th className="people-list-table__checkbox-col">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={(el) => { if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected; }}
                    onChange={toggleAll}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-primary-strong)' }}
                  />
                </th>
                {visibleColDefs.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className={selectedIds.has(employee.id) ? 'people-list-table__row--selected' : ''}
                >
                  <td className="people-list-table__checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(employee.id)}
                      onChange={() => toggleRow(employee.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-primary-strong)' }}
                    />
                  </td>
                  {visibleColDefs.map((col) => (
                    <td key={col.key}>{renderCell(col.key, employee)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="people-list-pagination">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Section>
    </div>
  );
}

export default PeopleListView;
