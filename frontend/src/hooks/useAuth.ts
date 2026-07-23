import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  createElement,
} from 'react'
import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth'
import { api } from '../api/index'
import '../lib/amplify'

export type Role = 'COACH' | 'TRAINEE'

export interface AuthUser {
  userId: string
  email: string
  name: string
  role: Role
  coachId?: string
}

interface RegisterParams {
  name: string
  email: string
  password: string
  role: Role
  inviteToken?: string
}

interface ConfirmParams {
  email: string
  code: string
  password: string
  name: string
  role: Role
  inviteToken?: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (params: RegisterParams) => Promise<{ needsConfirmation: boolean }>
  confirmRegistration: (params: ConfirmParams) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function resolveUser(): Promise<AuthUser | null> {
  try {
    const cognitoUser = await getCurrentUser()
    const attrs = await fetchUserAttributes()
    const session = await fetchAuthSession()
    const token = session.tokens?.idToken?.toString() ?? ''
    localStorage.setItem('accessToken', token)

    return {
      userId: cognitoUser.userId,
      email: attrs.email ?? '',
      name: attrs.name ?? '',
      role: (attrs['custom:role'] as Role) ?? 'TRAINEE',
      coachId: attrs['custom:coachId'],
    }
  } catch {
    localStorage.removeItem('accessToken')
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resolveUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  async function login(email: string, password: string) {
    await signIn({ username: email, password })
    const u = await resolveUser()
    setUser(u)
  }

  async function register({ name, email, password, role, inviteToken }: RegisterParams): Promise<{ needsConfirmation: boolean }> {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: { name, email, 'custom:role': role },
      },
    })

    if (!result.isSignUpComplete) {
      return { needsConfirmation: true }
    }

    // Auto-confirmed (e.g. admin-created user) — complete immediately
    await signIn({ username: email, password })
    await resolveUser() // populates localStorage with the access token before the API call
    await api.post('/v1/auth/register', { name, role, inviteToken })
    const u = await resolveUser()
    setUser(u)
    return { needsConfirmation: false }
  }

  async function confirmRegistration({ email, code, password, name, role, inviteToken }: ConfirmParams) {
    await confirmSignUp({ username: email, confirmationCode: code })
    await signIn({ username: email, password })
    await resolveUser() // populates localStorage with the access token before the API call
    await api.post('/v1/auth/register', { name, role, inviteToken })
    const u = await resolveUser()
    setUser(u)
  }

  async function logout() {
    await signOut()
    localStorage.removeItem('accessToken')
    setUser(null)
  }

  return createElement(
    AuthContext.Provider,
    { value: { user, loading, login, register, confirmRegistration, logout } },
    children,
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
