import { api } from './index'
import type { WorkoutSession } from './sessions'

export interface TraineeSummary {
  userId: string
  name: string
  email: string
  lastSession: string | null
  totalSessions: number
}

export interface ProgressDataPoint {
  date: string
  maxWeightKg: number
  totalVolume: number
  reps: number
}

export const traineesApi = {
  list: () => api.get<{ trainees: TraineeSummary[] }>('/v1/trainees'),

  get: (id: string) => api.get<TraineeSummary>(`/v1/trainees/${id}`),

  sessions: (id: string, cursor?: string) =>
    api.get<{ sessions: WorkoutSession[]; nextCursor: string | null }>(
      `/v1/trainees/${id}/sessions${cursor ? `?cursor=${cursor}` : ''}`,
    ),

  progress: (id: string, exerciseId: string, range?: { from: string; to: string }) => {
    const base = `/v1/trainees/${id}/progress?exerciseId=${exerciseId}`
    const q = range ? `&from=${range.from}&to=${range.to}` : ''
    return api.get<{ exerciseId: string; dataPoints: ProgressDataPoint[] }>(base + q)
  },
}
