import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { traineesApi, type TraineeSummary } from '../../api/trainees'
import { useTranslation } from '../../i18n'

function avatar(name: string, index: number) {
  const colors = ['#6C3CE1', '#F97316', '#10B981', '#3B82F6', '#EC4899']
  return { initials: name.charAt(0).toUpperCase(), bg: colors[index % colors.length] }
}

function relativeDate(iso: string | null, t: (k: string) => string): string {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return t('common.today')
  if (days === 1) return t('common.yesterday')
  return t('common.ago_days').replace('{{n}}', String(days))
}

export default function CoachTrainees() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [trainees, setTrainees] = useState<TraineeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await traineesApi.list()
      setTrainees(res.trainees)
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>{t('coach.trainees.title')}</h1>

      {loading && (
        <div style={styles.skeletons}>
          {[1, 2, 3].map((i) => <div key={i} style={styles.skeleton} />)}
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <p>{error}</p>
          <button style={styles.retryBtn} onClick={load}>{t('common.retry')}</button>
        </div>
      )}

      {!loading && !error && trainees.length === 0 && (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>👥</span>
          <p>{t('coach.trainees.empty')}</p>
        </div>
      )}

      <div style={styles.list}>
        {trainees.map((trainee, i) => {
          const { initials, bg } = avatar(trainee.name, i)
          return (
            <motion.div
              key={trainee.userId}
              style={styles.card}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/coach/trainees/${trainee.userId}`)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div style={{ ...styles.avatar, background: bg }}>{initials}</div>
              <div style={styles.info}>
                <div style={styles.name}>{trainee.name}</div>
                <div style={styles.meta}>
                  {t('coach.trainees.last_workout')}: {relativeDate(trainee.lastSession, t)}
                </div>
              </div>
              <div style={styles.badge}>{trainee.totalSessions} {t('coach.trainees.total_sessions')}</div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 16px 100px', maxWidth: 480, margin: '0 auto' },
  title: { fontSize: 26, fontWeight: 700, color: 'var(--color-text)', marginBottom: 24, letterSpacing: '-0.5px' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
    border: '1px solid rgba(108,60,225,0.08)', cursor: 'pointer',
  },
  avatar: {
    width: 48, height: 48, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 20, flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 },
  meta: { fontSize: 13, color: 'var(--color-muted)' },
  badge: {
    fontSize: 12, fontWeight: 600, color: 'var(--color-primary)',
    background: 'rgba(108,60,225,0.1)', padding: '4px 10px', borderRadius: 12, flexShrink: 0,
  },
  skeletons: { display: 'flex', flexDirection: 'column', gap: 12 },
  skeleton: { height: 80, borderRadius: 'var(--radius-lg)', background: 'rgba(108,60,225,0.06)', animation: 'pulse 1.5s ease-in-out infinite' },
  empty: { textAlign: 'center', padding: '48px 0', color: 'var(--color-muted)' },
  emptyIcon: { fontSize: 48, display: 'block', marginBottom: 12 },
  errorBox: { textAlign: 'center', padding: 24, color: 'var(--color-error)' },
  retryBtn: { marginTop: 12, padding: '8px 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' },
}
