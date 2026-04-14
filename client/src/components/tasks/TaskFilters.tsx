import type { TaskFilters } from '../../lib/types'

interface Props {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
}

export default function TaskFiltersComponent({ filters, onChange }: Props) {
  function update(key: keyof TaskFilters, value: string) {
    onChange({ ...filters, [key]: value || undefined })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={filters.status || ''}
        onChange={e => update('status', e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1"
      >
        <option value="">All Statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="REVIEW">Review</option>
        <option value="DONE">Done</option>
      </select>
      <select
        value={filters.priority || ''}
        onChange={e => update('priority', e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1"
      >
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent</option>
      </select>
      <input
        type="date"
        value={filters.dueDate || ''}
        onChange={e => update('dueDate', e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1"
        placeholder="Due before"
      />
    </div>
  )
}
