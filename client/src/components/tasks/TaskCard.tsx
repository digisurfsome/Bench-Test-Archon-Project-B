import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Task } from '../../lib/types'
import StatusBadge from './StatusBadge'
import { useDeleteTask } from '../../hooks/useTasks'

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600',
}

interface Props {
  task: Task
}

export default function TaskCard({ task }: Props) {
  const deleteTask = useDeleteTask()
  const [error, setError] = useState('')

  const isOverdue = task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/tasks/${task.id}/edit`}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Edit
          </Link>
          <button
            onClick={() => deleteTask.mutate(task.id, {
              onError: (err) => setError(err instanceof Error ? err.message : 'Delete failed')
            })}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <StatusBadge task={task} />
        <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        {task.assignee && (
          <span className="text-xs text-gray-500">{task.assignee.name}</span>
        )}
        {task.dueDate && (
          <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            Due: {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue && ' (overdue)'}
          </span>
        )}
      </div>
    </div>
  )
}
