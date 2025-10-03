# Data Table Accessibility Guide

This guide explains the accessibility features implemented in the table components and how to use them effectively.

## Overview

Our table components are built to meet WCAG 2.1 AA standards with comprehensive support for:

- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- Sortable columns with ARIA announcements
- Live region updates for dynamic content
- Semantic HTML structure

## Components

### Base Table Components

Located in `src/components/ui/table.tsx`:

- **Table**: Main table container with role and ARIA attributes
- **TableHeader**: Semantic `<thead>` element
- **TableBody**: Semantic `<tbody>` element
- **TableHead**: Column headers with `scope="col"` by default
- **TableCell**: Standard table cells
- **TableCaption**: Accessible table descriptions (can be visually hidden)

### SortableTableHead

Located in `src/components/ui/sortable-table-head.tsx`:

Provides accessible sortable column headers with:
- Visual sort indicators (up/down arrows)
- ARIA sort state announcements
- Keyboard support (Enter and Space)
- Focus indicators

### useTableSort Hook

Located in `src/hooks/useTableSort.ts`:

A reusable hook for managing table sort state with accessibility features built-in.

## Usage Examples

### Basic Accessible Table

\`\`\`tsx
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from '@/components/ui/table';

function BasicTable() {
  return (
    <Table aria-label="User list">
      <TableCaption className="sr-only">
        List of users with name, email, and role
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>John Doe</TableCell>
          <TableCell>john@example.com</TableCell>
          <TableCell>Admin</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
\`\`\`

### Sortable Table with Full Accessibility

\`\`\`tsx
import { Table, TableHeader, TableBody, TableRow, TableCell, TableCaption } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableSort } from '@/hooks/useTableSort';

interface DataRow {
  id: string;
  name: string;
  age: number;
  email: string;
}

function SortableTable({ data }: { data: DataRow[] }) {
  const { sortedData, sortState, getSortProps } = useTableSort<DataRow, keyof DataRow>({
    data,
    initialSortColumn: 'name',
    initialSortDirection: 'asc'
  });

  return (
    <Table
      aria-label="Sortable user data"
      aria-rowcount={sortedData.length}
    >
      <TableCaption className="sr-only">
        User data table. Click column headers to sort.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <SortableTableHead
            sortDirection={sortState.column === 'name' ? sortState.direction : 'none'}
            {...getSortProps('name')}
          >
            Name
          </SortableTableHead>
          <SortableTableHead
            sortDirection={sortState.column === 'age' ? sortState.direction : 'none'}
            {...getSortProps('age')}
          >
            Age
          </SortableTableHead>
          <SortableTableHead
            sortDirection={sortState.column === 'email' ? sortState.direction : 'none'}
            {...getSortProps('email')}
          >
            Email
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((row, index) => (
          <TableRow key={row.id} aria-rowindex={index + 2}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.age}</TableCell>
            <TableCell>{row.email}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
\`\`\`

### Table with Search/Filter and Live Announcements

\`\`\`tsx
import { useRef, useEffect } from 'react';

function FilterableTable() {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = \`Showing \${filteredData.length} results\`;
    }
  }, [filteredData]);

  return (
    <>
      {/* Screen reader announcements */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Search input */}
      <input
        id="table-search"
        type="text"
        placeholder="Search..."
        aria-label="Search table data"
        aria-controls="data-table"
      />

      {/* Table */}
      <Table id="data-table" aria-label="Filterable data">
        {/* Table content */}
      </Table>
    </>
  );
}
\`\`\`

## Accessibility Features Explained

### 1. Semantic HTML

- Uses proper `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` elements
- Column headers use `scope="col"` attribute
- Row headers use `scope="row"` when appropriate

### 2. ARIA Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `role="table"` | Explicitly defines table role | `<table role="table">` |
| `aria-label` | Provides accessible name | `<table aria-label="User list">` |
| `aria-describedby` | Links to description element | `<table aria-describedby="table-desc">` |
| `aria-sort` | Announces sort state | `aria-sort="ascending"` |
| `aria-rowcount` | Total row count | `aria-rowcount={100}` |
| `aria-rowindex` | Individual row position | `aria-rowindex={5}` |
| `aria-live` | Dynamic content updates | `aria-live="polite"` |

### 3. Keyboard Navigation

- **Tab**: Navigate between interactive elements (column headers, rows)
- **Enter/Space**: Activate sort on column headers
- **Shift + Tab**: Navigate backwards

Focus indicators are visible via CSS:
\`\`\`css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
\`\`\`

### 4. Screen Reader Support

#### Visual Hiding with Screen Reader Access

Use the `sr-only` class to hide content visually while keeping it accessible:

\`\`\`tsx
<TableCaption className="sr-only">
  Detailed description for screen readers only
</TableCaption>
\`\`\`

#### Live Announcements

For dynamic content updates:

\`\`\`tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  Showing 25 of 100 results
</div>
\`\`\`

### 5. Sort Functionality

The `useTableSort` hook provides:

- Three-state sorting: none → ascending → descending → none
- ARIA announcements for sort state changes
- Visual indicators (arrows)
- Keyboard activation

## Testing Checklist

Use this checklist to verify table accessibility:

### Keyboard Navigation
- [ ] Can tab to all interactive elements
- [ ] Column headers are keyboard-activatable
- [ ] Focus indicators are clearly visible
- [ ] Tab order is logical

### Screen Reader
- [ ] Table structure is announced correctly
- [ ] Column headers are associated with cells
- [ ] Sort state changes are announced
- [ ] Dynamic updates are announced via live regions
- [ ] Empty states are announced

### Visual
- [ ] Focus indicators meet contrast requirements
- [ ] Sort direction is visually clear
- [ ] Text meets WCAG AA contrast ratio (4.5:1)
- [ ] Touch targets are at least 44x44 pixels

### Functionality
- [ ] Sort works correctly for all column types
- [ ] Search/filter updates announce results
- [ ] Empty states are accessible
- [ ] Loading states have proper ARIA attributes

## Browser & Screen Reader Compatibility

Tested and working with:

- **NVDA** + Firefox/Chrome (Windows)
- **JAWS** + Chrome/Edge (Windows)
- **VoiceOver** + Safari (macOS/iOS)
- **TalkBack** + Chrome (Android)

## Performance Considerations

- Use `useMemo` for computed/filtered data
- Implement virtual scrolling for tables with 100+ rows
- Debounce search/filter inputs
- Keep live region updates minimal

## Common Issues & Solutions

### Issue: Sort announcements not working

**Solution**: Ensure `aria-sort` is set correctly and changes are within a component that re-renders.

### Issue: Table headers not associated with cells

**Solution**: Always use `scope="col"` on `<th>` elements in the header row.

### Issue: Live region not announcing updates

**Solution**: Check that:
- `aria-live="polite"` is set
- Content actually changes (not just re-renders with same content)
- Updates aren't happening too frequently

## Resources

- [WCAG 2.1 Table Guidelines](https://www.w3.org/WAI/tutorials/tables/)
- [ARIA Table Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/)
- [MDN ARIA: table role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/table_role)
