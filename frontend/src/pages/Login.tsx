import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'

export default function Login() {
  const { login } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
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

        <h2 style={styles.title}>{t('auth.login')}</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
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
              autoComplete="current-password"
              style={styles.input}
              placeholder="••••••••"
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <motion.button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? t('common.loading') : t('auth.login')}
          </motion.button>
        </form>

        <p style={styles.footer}>
          {t('auth.no_account')}{' '}
          <Link to="/register" style={styles.link}>{t('auth.register_cta')}</Link>
        </p>
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
    marginBottom: 28,
    justifyContent: 'center',
  },
  logoIcon: { fontSize: 32 },
  appName: {
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--color-primary)',
    letterSpacing: '-0.5px',
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 24,
    textAlign: 'center',
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
    transition: 'border-color 0.15s',
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
    transition: 'background 0.15s',
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
