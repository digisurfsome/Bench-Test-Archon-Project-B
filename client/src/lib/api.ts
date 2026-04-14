import type { User, Task, Team, TeamMember, DashboardStats, CreateTaskInput, TaskFilters } from './types'

const API_BASE = ''

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  })
  if (!response.ok) {
    let errorBody: { error?: string }
    try {
      errorBody = await response.json()
    } catch (parseErr) {
      throw new Error(`HTTP ${response.status}: response body unparseable`)
    }
    throw new Error(errorBody.error || `HTTP ${response.status}`)
  }
  return response.json()
}

// Auth
export async function register(data: { email: string; name: string; password: string }): Promise<{ user: User; token: string }> {
  return fetchJSON('/auth/register', { method: 'POST', body: JSON.stringify(data) })
}

export async function login(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
  return fetchJSON('/auth/login', { method: 'POST', body: JSON.stringify(data) })
}

export async function getMe(): Promise<User> {
  return fetchJSON('/auth/me')
}

// Tasks
export async function createTask(data: CreateTaskInput): Promise<Task> {
  return fetchJSON('/api/tasks', { method: 'POST', body: JSON.stringify(data) })
}

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.priority) params.set('priority', filters.priority)
  if (filters?.assigneeId) params.set('assigneeId', filters.assigneeId)
  if (filters?.dueDate) params.set('dueDate', filters.dueDate)
  if (filters?.sortBy) params.set('sortBy', filters.sortBy)
  if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder)
  const query = params.toString()
  return fetchJSON(`/api/tasks${query ? `?${query}` : ''}`)
}

export async function getTask(id: string): Promise<Task> {
  return fetchJSON(`/api/tasks/${id}`)
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  return fetchJSON(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteTask(id: string): Promise<void> {
  return fetchJSON(`/api/tasks/${id}`, { method: 'DELETE' })
}

// Teams
export async function createTeam(name: string): Promise<Team> {
  return fetchJSON('/api/teams', { method: 'POST', body: JSON.stringify({ name }) })
}

export async function getTeams(): Promise<Team[]> {
  return fetchJSON('/api/teams')
}

export async function getTeam(id: string): Promise<Team> {
  return fetchJSON(`/api/teams/${id}`)
}

export async function addTeamMember(teamId: string, userId: string): Promise<TeamMember> {
  return fetchJSON(`/api/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify({ userId }) })
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<void> {
  return fetchJSON(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE' })
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchJSON('/api/dashboard')
}
