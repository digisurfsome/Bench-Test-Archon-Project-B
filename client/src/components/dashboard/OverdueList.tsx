import type { Task } from '../../lib/types'

interface Props {
  tasks: Task[]
}

function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

export default function OverdueList({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg p-4">
        No overdue tasks.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-red-700">Overdue Tasks ({tasks.length})</h2>
      {tasks.map(task => (
        <div key={task.id} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-900">{task.title}</span>
            {task.assignee && (
              <span className="ml-2 text-xs text-gray-500">&mdash; {task.assignee.name}</span>
            )}
          </div>
          <div className="text-xs text-red-600 font-medium">
            {task.dueDate ? `${daysOverdue(task.dueDate)} days overdue` : ''}
          </div>
        </div>
      ))}
    </div>
  )
}
