import { useQuery } from '@tanstack/react-query'
import * as api from '../lib/api'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboardStats,
  })
}
