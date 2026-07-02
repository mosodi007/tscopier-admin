import { useState, useCallback } from 'react';

type FilterState = Record<string, string>;

interface UseTableFiltersResult {
  filters: FilterState;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}

export function useTableFilters(initial: FilterState = {}): UseTableFiltersResult {
  const [filters, setFilters] = useState<FilterState>(initial);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters(initial), [initial]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return { filters, setFilter, clearFilters, activeFilterCount };
}
