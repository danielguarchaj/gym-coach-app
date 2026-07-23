import { api } from './index'

export interface InviteResult {
  token: string
  inviteUrl: string
  expiresAt: number
}

export interface ValidateResult {
  valid: boolean
  coachName: string
  coachId: string
}

export const invitesApi = {
  create: () => api.post<InviteResult>('/v1/invites', {}),
  validate: (token: string) => api.get<ValidateResult>(`/v1/invites/${token}/validate`),
}
