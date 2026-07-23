import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { invitesApi, type ValidateResult } from '../api/invites'
import { useTranslation } from '../i18n'

export default function InviteLanding() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [info, setInfo] = useState<ValidateResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setError(t('invite.invalid')); setLoading(false); return }
    invitesApi.validate(token).then((res) => {
      setInfo(res)
      setLoading(false)
    }).catch(() => {
      setError(t('invite.invalid'))
      setLoading(false)
    })
  }, [token])

  function join() {
    navigate('/register', { state: { inviteToken: token, coachName: info?.coachName } })
  }

  return (
    <div style={styles.page}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {loading ? (
          <p style={styles.muted}>{t('common.loading')}</p>
        ) : error ? (
          <>
            <span style={styles.icon}>❌</span>
            <p style={styles.error}>{error}</p>
          </>
        ) : (
          <>
            <span style={styles.icon}>💪</span>
            <p style={styles.join}>
              {t('invite.join')} <strong style={{ color: 'var(--color-primary)' }}>{info?.coachName}</strong>
            </p>
            <p style={styles.subtitle}>{t('invite.subtitle')}</p>
            <motion.button style={styles.btn} onClick={join} whileTap={{ scale: 0.97 }}>
              {t('invite.cta')}
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '24px 16px', background: 'var(--color-background)',
  },
  card: {
    width: '100%', maxWidth: 360, background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(16px)', borderRadius: 'var(--radius-xl)',
    padding: '48px 28px', textAlign: 'center', boxShadow: 'var(--shadow-lg)',
    border: '1px solid rgba(108,60,225,0.1)',
  },
  icon: { fontSize: 56, display: 'block', marginBottom: 20 },
  join: { fontSize: 20, fontWeight: 600, color: 'var(--color-text)', marginBottom: 10 },
  subtitle: { fontSize: 14, color: 'var(--color-muted)', marginBottom: 32 },
  btn: {
    width: '100%', padding: '15px', borderRadius: 'var(--radius-md)',
    background: 'var(--color-primary)', color: '#fff', fontWeight: 700,
    fontSize: 16, cursor: 'pointer',
  },
  muted: { color: 'var(--color-muted)' },
  error: { color: 'var(--color-error)', fontWeight: 500 },
}
