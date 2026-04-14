import type { TaskFilters } from '../../lib/types'

interface Props {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
}

export default function TaskSort({ filters, onChange }: Props) {
  function updateSort(sortBy: string) {
    if (filters.sortBy === sortBy) {
      onChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      onChange({ ...filters, sortBy, sortOrder: 'desc' })
    }
  }

  const sortFields = [
    { key: 'createdAt', label: 'Created' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'priority', label: 'Priority' },
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Sort by:</span>
      {sortFields.map(f => (
        <button
          key={f.key}
          onClick={() => updateSort(f.key)}
          className={`text-sm px-2 py-1 rounded ${filters.sortBy === f.key ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          {f.label}
          {filters.sortBy === f.key && (filters.sortOrder === 'asc' ? ' \u2191' : ' \u2193')}
        </button>
      ))}
    </div>
  )
}
