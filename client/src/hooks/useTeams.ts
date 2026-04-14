import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../lib/api'

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  })
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => api.getTeam(id),
    enabled: !!id,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.createTeam(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useAddTeamMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.addTeamMember(teamId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId] })
    },
  })
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      api.removeTeamMember(teamId, memberId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId] })
    },
  })
}
