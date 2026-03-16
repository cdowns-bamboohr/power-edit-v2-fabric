import { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconV2,
  Headline,
  Button,
  Link,
  Section,
  Tabs,
  Tab,
  TextField,
  SelectField,
} from '@bamboohr/fabric';
import { EmployeeCard } from '../../components/EmployeeCard';
import { PeopleListView } from '../../components/PeopleListView';
import { OrgChartView } from '../../components/OrgChart/OrgChartView';
import { employees } from '../../data/employees';
import './People.css';

type GroupBy = 'name' | 'department' | 'location' | 'division';
type ViewMode = 'list' | 'directory' | 'orgChart';

interface PeopleProps {
  defaultTab?: ViewMode;
}

export function People({ defaultTab = 'list' }: PeopleProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('name');
  const [filterDepartment, setFilterDepartment] = useState('all');

  // Sync viewMode with defaultTab when navigating via GlobalNav
  useEffect(() => {
    setViewMode(defaultTab);
  }, [defaultTab]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const unique = Array.from(new Set(employees.map((e) => e.department)));
    return [{ value: 'all', label: 'All Employees' }].concat(
      unique.map((dept) => ({ value: dept, label: dept }))
    );
  }, []);

  // Filter employees by search and department
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [searchQuery, filterDepartment]);

  // Group employees
  const groupedEmployees = useMemo(() => {
    if (groupBy === 'name') {
      const groups: Record<string, typeof filteredEmployees> = {};
      filteredEmployees.forEach((employee) => {
        const key = employee.name.charAt(0).toUpperCase();
        if (!groups[key]) groups[key] = [];
        groups[key].push(employee);
      });
      Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => a.name.localeCompare(b.name));
      });
      return groups;
    }

    const groups: Record<string, typeof filteredEmployees> = {};
    filteredEmployees.forEach((employee) => {
      const key = employee[groupBy];
      if (!groups[key]) groups[key] = [];
      groups[key].push(employee);
    });
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });
    return groups;
  }, [filteredEmployees, groupBy]);

  return (
    <div className="people-page">
      {/* Page Header */}
      <div className="people-header">
        <Headline size="large" color="primary">People</Headline>
        <Link href="#" onClick={(e: React.MouseEvent) => e.preventDefault()}>
          <span className="people-header-link">
            Quick Access to the Directory
          </span>
        </Link>
      </div>

      {/* Actions Bar with Tabs */}
      <div className="people-actions-bar">
        <div className="people-new-button">
          <Button
            variant="outlined"
            color="primary"
            size="medium"
            startIcon={<IconV2 name="circle-plus-solid" size={16} />}
            onClick={() => navigate('/people/new')}
          >
            New Employee
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="medium"
            startIcon={<IconV2 name="bolt-solid" size={16} />}
            onClick={() => navigate('/people/power-edit')}
          >
            Power Edit
          </Button>
        </div>

        {/* View Tabs */}
        <div className="people-tabs">
          <Tabs
            value={viewMode}
            onChange={(value: unknown, _event: ChangeEvent<Element>) => setViewMode(value as ViewMode)}
            mode="line"
          >
            <Tab label="List" value="list" icon={<IconV2 name="file-lines-solid" size={16} />} />
            <Tab label="Directory" value="directory" icon={<IconV2 name="user-group-solid" size={16} />} />
            <Tab label="Org Chart" value="orgChart" icon={<IconV2 name="sitemap-solid" size={16} />} />
          </Tabs>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <PeopleListView employees={employees} />
      )}

      {/* Directory View */}
      {viewMode === 'directory' && (
        <>
          <div className="people-directory-filters">
            {/* Search */}
            <div className="people-directory-search">
              <TextField
                label=""
                placeholder="Search Directory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<IconV2 name="magnifying-glass-solid" size={16} />}
                size="medium"
              />
            </div>

            {/* Group By */}
            <div className="people-directory-filter-group">
              <SelectField
                label="Group by"
                labelPlacement="inline"
                size="small"
                variant="single"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              >
                <option value="name">Name</option>
                <option value="department">Department</option>
                <option value="location">Location</option>
                <option value="division">Division</option>
              </SelectField>
            </div>

            {/* Filter By */}
            <div className="people-directory-filter-group">
              <SelectField
                label="Filter by"
                labelPlacement="inline"
                size="small"
                variant="single"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                {departments.map((dept) => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </SelectField>
            </div>
          </div>

          {/* Employee Groups */}
          <div className="people-groups">
            {Object.entries(groupedEmployees).map(([groupName, groupEmployees]) => (
              <Section key={groupName}>
                <div className="people-group-header">
                  <Headline size="small" color="primary">{groupName}</Headline>
                </div>
                <div className="people-group-list">
                  {groupEmployees.map((employee) => (
                    <EmployeeCard key={employee.id} employee={employee} />
                  ))}
                </div>
              </Section>
            ))}

            {filteredEmployees.length === 0 && (
              <div className="people-empty">
                <Headline size="small" color="neutral-weak">No employees found</Headline>
              </div>
            )}
          </div>
        </>
      )}

      {/* Org Chart View */}
      {viewMode === 'orgChart' && (
        <div className="people-org-chart">
          <OrgChartView employees={employees} />
        </div>
      )}
    </div>
  );
}

export default People;
