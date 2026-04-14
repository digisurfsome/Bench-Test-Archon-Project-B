import { useDashboard } from '../hooks/useDashboard'
import StatusCard from '../components/dashboard/StatusCard'
import OverdueList from '../components/dashboard/OverdueList'

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard()

  if (isLoading) return <div className="text-gray-500 text-sm">Loading dashboard...</div>
  if (error || !data) return <div className="text-red-600 text-sm">Failed to load dashboard</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(data.statusCounts).map(([status, count]) => (
          <StatusCard key={status} status={status} count={count} />
        ))}
      </div>

      <OverdueList tasks={data.overdueTasks} />
    </div>
  )
}
