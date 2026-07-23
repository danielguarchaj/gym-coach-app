import { api } from './index'

export interface SetRecord {
  reps: number
  weightKg: number
  restSeconds: number
}

export interface SessionExercise {
  catalogId: string
  name: string
  bodyPart: string
  sets: SetRecord[]
}

export interface WorkoutSession {
  sessionId: string
  traineeId: string
  date: string
  durationMin?: number
  notes?: string
  exercises: SessionExercise[]
  createdAt: string
}

export interface CreateSessionInput {
  date?: string
  durationMin?: number
  notes?: string
  exercises: SessionExercise[]
}

export const sessionsApi = {
  create: (input: CreateSessionInput) => api.post<WorkoutSession>('/v1/sessions', input),
  list: (cursor?: string) =>
    api.get<{ sessions: WorkoutSession[]; nextCursor: string | null }>(
      `/v1/sessions${cursor ? `?cursor=${cursor}` : ''}`,
    ),
  get: (id: string) => api.get<WorkoutSession>(`/v1/sessions/${id}`),
}
