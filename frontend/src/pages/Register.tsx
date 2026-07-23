import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'
import type { Role } from '../hooks/useAuth'

export default function Register() {
  const { register, confirmRegistration } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const inviteToken = (location.state as { inviteToken?: string } | null)?.inviteToken
  const coachName = (location.state as { coachName?: string } | null)?.coachName

  const [step, setStep] = useState<'form' | 'confirm'>('form')

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(inviteToken ? 'TRAINEE' : 'COACH')

  // Confirmation step
  const [code, setCode] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { needsConfirmation } = await register({ name, email, password, role, inviteToken })
      if (needsConfirmation) {
        setStep('confirm')
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await confirmRegistration({ email, code, password, name, role, inviteToken })
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div style={styles.logo}>
          <span style={styles.logoIcon}>💪</span>
          <h1 style={styles.appName}>GymCoach</h1>
        </div>

        {step === 'form' ? (
          <>
            {coachName && (
              <div style={styles.inviteBanner}>
                <span>🏋️</span>
                <span>{t('invite.join')} <strong>{coachName}</strong></span>
              </div>
            )}

            <h2 style={styles.title}>{t('auth.register')}</h2>

            <form onSubmit={handleRegister} style={styles.form}>
              <label style={styles.label}>
                {t('auth.name')}
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  style={styles.input}
                  placeholder="Tu nombre"
                />
              </label>

              <label style={styles.label}>
                {t('auth.email')}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={styles.input}
                  placeholder="tu@email.com"
                />
              </label>

              <label style={styles.label}>
                {t('auth.password')}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                />
              </label>

              {!inviteToken && (
                <div style={styles.label}>
                  {t('auth.role')}
                  <div style={styles.roleRow}>
                    {(['COACH', 'TRAINEE'] as Role[]).map((r) => (
                      <motion.button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          ...styles.roleBtn,
                          ...(role === r ? styles.roleBtnActive : {}),
                        }}
                      >
                        {r === 'COACH' ? `🏅 ${t('auth.role_coach')}` : `🏋️ ${t('auth.role_trainee')}`}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p style={styles.error}>{error}</p>}

              <motion.button
                type="submit"
                disabled={loading}
                style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? t('common.loading') : t('auth.register')}
              </motion.button>
            </form>

            <p style={styles.footer}>
              {t('auth.have_account')}{' '}
              <Link to="/login" style={styles.link}>{t('auth.login_cta')}</Link>
            </p>
          </>
        ) : (
          <>
            <h2 style={styles.title}>Verifica tu email</h2>
            <p style={styles.confirmSubtitle}>
              Te enviamos un código de verificación a <strong>{email}</strong>. Revisa tu bandeja de entrada.
            </p>

            <form onSubmit={handleConfirm} style={styles.form}>
              <label style={styles.label}>
                Código de verificación
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  style={styles.input}
                  placeholder="123456"
                  maxLength={6}
                />
              </label>

              {error && <p style={styles.error}>{error}</p>}

              <motion.button
                type="submit"
                disabled={loading}
                style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? t('common.loading') : 'Verificar y entrar'}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => { setStep('form'); setError('') }}
                style={styles.backBtn}
                whileTap={{ scale: 0.97 }}
              >
                ← Volver
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'var(--color-background)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 'var(--radius-xl)',
    padding: '40px 32px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid rgba(108,60,225,0.1)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  logoIcon: { fontSize: 32 },
  appName: {
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--color-primary)',
    letterSpacing: '-0.5px',
  },
  inviteBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(108,60,225,0.08)',
    border: '1px solid rgba(108,60,225,0.15)',
    fontSize: 14,
    color: 'var(--color-primary)',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 14,
    color: 'var(--color-muted)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-text)',
  },
  input: {
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid rgba(108,60,225,0.2)',
    background: 'var(--color-background)',
    fontSize: 15,
    color: 'var(--color-text)',
    outline: 'none',
  },
  roleRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginTop: 2,
  },
  roleBtn: {
    padding: '12px 8px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid rgba(108,60,225,0.2)',
    background: 'var(--color-background)',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  roleBtnActive: {
    border: '1.5px solid var(--color-primary)',
    background: 'rgba(108,60,225,0.08)',
    color: 'var(--color-primary)',
    fontWeight: 600,
  },
  error: {
    fontSize: 13,
    color: 'var(--color-error)',
    textAlign: 'center',
    padding: '8px 12px',
    background: 'rgba(239,68,68,0.08)',
    borderRadius: 'var(--radius-sm)',
  },
  button: {
    marginTop: 8,
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-primary)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
  },
  backBtn: {
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    background: 'none',
    border: '1.5px solid rgba(108,60,225,0.2)',
    color: 'var(--color-muted)',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 14,
    color: 'var(--color-muted)',
  },
  link: {
    color: 'var(--color-primary)',
    fontWeight: 600,
  },
}
