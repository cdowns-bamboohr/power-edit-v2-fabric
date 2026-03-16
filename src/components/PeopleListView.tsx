import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconV2,
  BodyText,
  Section,
  IconButton,
  Button,
  Link,
  Avatar,
} from '@bamboohr/fabric';
import { Pagination } from './Pagination';
import type { Employee } from '../data/employees';
import './PeopleListView.css';

interface PeopleListViewProps {
  employees: Employee[];
}

export function PeopleListView({ employees }: PeopleListViewProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showingFilter, setShowingFilter] = useState('active');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isShowingOpen, setIsShowingOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const showingRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 50;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (showingRef.current && !showingRef.current.contains(event.target as Node)) {
        setIsShowingOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusOptions = [
    { value: 'all', label: 'All Employees' },
    { value: 'Full-Time', label: 'Full-Time' },
    { value: 'Part-Time', label: 'Part-Time' },
    { value: 'Contractor', label: 'Contractor' },
  ];

  const showingOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'all', label: 'All' },
  ];

  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (filterStatus !== 'all') {
      result = result.filter((emp) => emp.employmentStatus === filterStatus);
    }
    if (showingFilter === 'active') {
      result = result.filter((emp) => emp.employmentStatus !== 'Inactive');
    } else if (showingFilter === 'inactive') {
      result = result.filter((emp) => emp.employmentStatus === 'Inactive');
    }
    return result;
  }, [employees, filterStatus, showingFilter]);

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedCount = selectedIds.size;
  const allOnPageSelected = currentEmployees.length > 0 && currentEmployees.every((e) => selectedIds.has(e.id));
  const someOnPageSelected = currentEmployees.some((e) => selectedIds.has(e.id));

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
        {/* Left: filter icon + status pill + count */}
        <div className="people-list-filter-left">
          <IconButton
            icon="sliders-solid"
            aria-label="Filter"
            variant="outlined"
            color="secondary"
            size="medium"
          />

          <div className="pill-dropdown" ref={filterRef}>
            <button
              className="pill-dropdown__trigger"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <span>{statusOptions.find(o => o.value === filterStatus)?.label ?? 'All Employees'}</span>
              <IconV2 name={isFilterOpen ? 'chevron-up-solid' : 'chevron-down-solid'} size={12} color="neutral-strong" />
            </button>
            {isFilterOpen && (
              <div className="pill-dropdown__menu">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`pill-dropdown__item${filterStatus === opt.value ? ' pill-dropdown__item--selected' : ''}`}
                    onClick={() => { setFilterStatus(opt.value); setIsFilterOpen(false); setCurrentPage(1); }}
                  >
                    <BodyText size="medium">{opt.label}</BodyText>
                  </button>
                ))}
              </div>
            )}
          </div>

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
              onClick={() => navigate('/people/power-edit/edit', { state: { selectedIds: Array.from(selectedIds) } })}
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
            <div className="pill-dropdown" ref={showingRef}>
              <button
                className="pill-dropdown__trigger pill-dropdown__trigger--labeled"
                onClick={() => setIsShowingOpen(!isShowingOpen)}
              >
                <BodyText size="small" weight="medium">Showing</BodyText>
                <span>{showingOptions.find(o => o.value === showingFilter)?.label ?? 'Active'}</span>
                <IconV2 name={isShowingOpen ? 'chevron-up-solid' : 'chevron-down-solid'} size={12} color="neutral-strong" />
              </button>
              {isShowingOpen && (
                <div className="pill-dropdown__menu pill-dropdown__menu--right">
                  {showingOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`pill-dropdown__item${showingFilter === opt.value ? ' pill-dropdown__item--selected' : ''}`}
                      onClick={() => { setShowingFilter(opt.value); setIsShowingOpen(false); setCurrentPage(1); }}
                    >
                      <BodyText size="medium">{opt.label}</BodyText>
                    </button>
                  ))}
                </div>
              )}
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
                  <button
                    className="people-list-menu-item"
                    onClick={() => { setIsMenuOpen(false); navigate('/people/power-edit'); }}
                  >
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
                <th>Employee Photo</th>
                <th>Employee #</th>
                <th>Last Name, First Name</th>
                <th>Job Title</th>
                <th>Location</th>
                <th>Employment Status</th>
                <th>Hire Date</th>
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
                  <td><Avatar src={employee.avatar} alt={employee.name} size={64} /></td>
                  <td><BodyText size="medium">{employee.employeeNumber}</BodyText></td>
                  <td>
                    <Link href={`/employees/${employee.id}`}>
                      {employee.lastName}, {employee.firstName}
                    </Link>
                  </td>
                  <td><BodyText size="medium" color="neutral-medium">{employee.jobTitle}</BodyText></td>
                  <td><BodyText size="medium" color="neutral-medium">{employee.location}</BodyText></td>
                  <td><BodyText size="medium" color="neutral-medium">{employee.employmentStatus}</BodyText></td>
                  <td><BodyText size="medium" color="neutral-medium">{employee.hireDate}</BodyText></td>
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
