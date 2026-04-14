const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  TODO: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'To Do' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Review' },
  DONE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
}

interface Props {
  status: string
  count: number
}

export default function StatusCard({ status, count }: Props) {
  const style = STATUS_STYLES[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
  return (
    <div className={`${style.bg} rounded-lg p-4 text-center`}>
      <div className={`text-3xl font-bold ${style.text}`}>{count}</div>
      <div className={`text-sm font-medium mt-1 ${style.text}`}>{style.label}</div>
    </div>
  )
}
