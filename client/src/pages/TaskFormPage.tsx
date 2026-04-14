import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import { useTeams } from '../hooks/useTeams'
import * as api from '../lib/api'
import type { Task } from '../lib/types'

export default function TaskFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { data: teams } = useTeams()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [teamId, setTeamId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit && id) {
      api.getTask(id).then(task => {
        setTitle(task.title)
        setDescription(task.description || '')
        setPriority(task.priority)
        setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
        setTeamId(task.teamId)
      }).catch((err) => {
        console.error('[TaskFormPage] getTask failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load task')
      })
    }
  }, [id, isEdit])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (isEdit && id) {
        await updateTask.mutateAsync({
          id,
          data: {
            title,
            description: description || undefined,
            priority,
            dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          }
        })
      } else {
        await createTask.mutateAsync({
          title,
          description: description || undefined,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          teamId,
        })
      }
      navigate('/tasks')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Task' : 'New Task'}</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as Task['priority'])}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select a team</option>
              {teams?.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            {isEdit ? 'Save Changes' : 'Create Task'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="border border-gray-300 px-4 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
