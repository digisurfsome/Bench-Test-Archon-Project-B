import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTeams, useCreateTeam } from '../hooks/useTeams'

export default function TeamsPage() {
  const { data: teams, isLoading } = useTeams()
  const createTeam = useCreateTeam()
  const [newTeamName, setNewTeamName] = useState('')
  const [error, setError] = useState('')

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await createTeam.mutateAsync(newTeamName)
      setNewTeamName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    }
  }

  if (isLoading) return <div className="text-gray-500 text-sm">Loading teams...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Teams</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Create New Team</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="Team name"
            required
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={createTeam.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {teams?.map(team => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition"
          >
            <div className="font-medium text-gray-900">{team.name}</div>
            <div className="text-sm text-gray-500 mt-1">
              {team.members?.length ?? 0} member{(team.members?.length ?? 0) !== 1 ? 's' : ''}
            </div>
          </Link>
        ))}
        {teams?.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">No teams yet. Create one above.</div>
        )}
      </div>
    </div>
  )
}
