import { useState, FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useTeam, useAddTeamMember } from '../hooks/useTeams'
import MemberList from '../components/teams/MemberList'
import { useAuth } from '../context/AuthContext'

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: team, isLoading, error } = useTeam(id!)
  const addMember = useAddTeamMember()
  const [newMemberUserId, setNewMemberUserId] = useState('')
  const [addError, setAddError] = useState('')

  const isOwner = team?.members?.some(m => m.userId === user?.id && m.role === 'OWNER') ?? false

  async function handleAddMember(e: FormEvent) {
    e.preventDefault()
    setAddError('')
    try {
      await addMember.mutateAsync({ teamId: id!, userId: newMemberUserId })
      setNewMemberUserId('')
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add member')
    }
  }

  if (isLoading) return <div className="text-gray-500 text-sm">Loading team...</div>
  if (error || !team) return <div className="text-red-600 text-sm">Failed to load team</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>

      {isOwner && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Member by User ID</h2>
          {addError && <p className="text-red-600 text-sm mb-3">{addError}</p>}
          <form onSubmit={handleAddMember} className="flex gap-2">
            <input
              type="text"
              value={newMemberUserId}
              onChange={e => setNewMemberUserId(e.target.value)}
              placeholder="User ID"
              required
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addMember.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Members</h2>
        <MemberList members={team.members ?? []} teamId={team.id} isOwner={isOwner} />
      </div>
    </div>
  )
}
