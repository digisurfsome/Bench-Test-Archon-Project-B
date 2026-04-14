import { useState } from 'react'
import type { TeamMember } from '../../lib/types'
import { useAuth } from '../../context/AuthContext'
import { useRemoveTeamMember } from '../../hooks/useTeams'

interface Props {
  members: TeamMember[]
  teamId: string
  isOwner: boolean
}

export default function MemberList({ members, teamId, isOwner }: Props) {
  const { user } = useAuth()
  const removeMember = useRemoveTeamMember()
  const [error, setError] = useState('')

  return (
    <div className="space-y-2">
      {error && <p className="text-red-600 text-xs mb-1">{error}</p>}
      {members.map(member => (
        <div key={member.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
          <div>
            <span className="text-sm font-medium text-gray-900">{member.user?.name}</span>
            <span className="ml-2 text-xs text-gray-500">{member.user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${member.role === 'OWNER' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              {member.role}
            </span>
            {isOwner && member.userId !== user?.id && (
              <button
                onClick={() => removeMember.mutate(
                  { teamId, memberId: member.id },
                  { onError: (err) => setError(err instanceof Error ? err.message : 'Remove failed') }
                )}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
