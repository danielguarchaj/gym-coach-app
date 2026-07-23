import { api } from './index'

export interface Exercise {
  exerciseId: string
  name: { es: string; en: string }
  bodyPart: string
  category: 'compound' | 'isolation' | 'cardio'
  primaryMuscle: string
  secondaryMuscles: string[]
  equipment: string
}

export const exercisesApi = {
  list: (bodyPart?: string) =>
    api.get<{ exercises: Exercise[] }>(`/v1/exercises${bodyPart ? `?bodyPart=${encodeURIComponent(bodyPart)}` : ''}`),

  get: (id: string) => api.get<Exercise>(`/v1/exercises/${id}`),
}
