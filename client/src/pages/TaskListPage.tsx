import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import TaskCard from '../components/tasks/TaskCard'
import TaskFiltersComponent from '../components/tasks/TaskFilters'
import TaskSort from '../components/tasks/TaskSort'
import type { TaskFilters } from '../lib/types'

export default function TaskListPage() {
  const [filters, setFilters] = useState<TaskFilters>({})
  const { data: tasks, isLoading, error } = useTasks(filters)

  if (isLoading) return <div className="text-gray-500 text-sm">Loading tasks...</div>
  if (error) return <div className="text-red-600 text-sm">Failed to load tasks</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Link
          to="/tasks/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          New Task
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <TaskFiltersComponent filters={filters} onChange={setFilters} />
        <TaskSort filters={filters} onChange={setFilters} />
      </div>

      {tasks && tasks.length === 0 && (
        <div className="text-gray-500 text-sm text-center py-8">
          No tasks found. <Link to="/tasks/new" className="text-blue-600 hover:underline">Create one</Link>.
        </div>
      )}

      <div className="space-y-3">
        {tasks?.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
