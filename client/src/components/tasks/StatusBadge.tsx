import { useState } from 'react'
import type { Task } from '../../lib/types'
import { useUpdateTask } from '../../hooks/useTasks'

const VALID_TRANSITIONS: Record<Task['status'], Task['status'] | null> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'REVIEW',
  REVIEW: 'DONE',
  DONE: null,
}

const STATUS_COLORS: Record<Task['status'], string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<Task['status'], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
}

interface Props {
  task: Task
}

export default function StatusBadge({ task }: Props) {
  const updateTask = useUpdateTask()
  const [error, setError] = useState('')
  const nextStatus = VALID_TRANSITIONS[task.status]

  function handleAdvance() {
    if (!nextStatus) return
    setError('')
    updateTask.mutate(
      { id: task.id, data: { status: nextStatus } },
      { onError: (err) => setError(err instanceof Error ? err.message : 'Status update failed') }
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}>
        {STATUS_LABELS[task.status]}
      </span>
      {nextStatus && (
        <button
          onClick={handleAdvance}
          disabled={updateTask.isPending}
          className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
        >
          &rarr; {STATUS_LABELS[nextStatus]}
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
