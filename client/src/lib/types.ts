export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  members?: TeamMember[]
}

export interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: 'OWNER' | 'MEMBER'
  user?: User
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: string | null
  assigneeId: string | null
  teamId: string
  createdAt: string
  updatedAt: string
  assignee?: User | null
  team?: Team
}

export interface DashboardStats {
  statusCounts: {
    TODO: number
    IN_PROGRESS: number
    REVIEW: number
    DONE: number
  }
  overdueTasks: Task[]
}

export type CreateTaskInput = {
  title: string
  description?: string
  priority: Task['priority']
  dueDate?: string | null
  assigneeId?: string | null
  teamId: string
}

export interface TaskFilters {
  status?: string
  priority?: string
  assigneeId?: string
  dueDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
