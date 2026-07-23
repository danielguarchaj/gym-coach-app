import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { sessionsApi, type WorkoutSession } from '../../api/sessions'
import { useTranslation } from '../../i18n'
import { useWeightUnit } from '../../hooks/useWeightUnit'

export default function TraineeHistory() {
  const { t } = useTranslation()
  const { unit, toDisplay } = useWeightUnit()
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    sessionsApi.list().then((res) => {
      setSessions(res.sessions)
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={styles.page}><p style={styles.muted}>{t('common.loading')}</p></div>

  if (sessions.length === 0) return (
    <div style={styles.page}>
      <h1 style={styles.title}>{t('trainee.history.title')}</h1>
      <div style={styles.empty}>
        <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📋</span>
        <p>{t('trainee.history.empty')}</p>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>{t('trainee.history.title')}</h1>
      {sessions.map((s, i) => (
        <motion.div
          key={s.sessionId}
          style={styles.card}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <button style={styles.cardHeader} onClick={() => setExpanded(expanded === s.sessionId ? null : s.sessionId)}>
            <div>
              <div style={styles.date}>{new Date(s.date).toLocaleDateString('es')}</div>
              <div style={styles.summary}>{s.exercises.length} ejercicios · {s.exercises.reduce((n, ex) => n + ex.sets.length, 0)} {t('trainee.history.sets')}</div>
            </div>
            <span style={{ color: 'var(--color-primary)', fontSize: 18 }}>{expanded === s.sessionId ? '▲' : '▼'}</span>
          </button>

          {expanded === s.sessionId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ paddingTop: 12 }}
            >
              {s.exercises.map((ex, ei) => (
                <div key={ei} style={styles.exRow}>
                  <div style={styles.exName}>{ex.name}</div>
                  <div style={styles.sets}>
                    {ex.sets.map((set, si) => (
                      <span key={si} style={styles.setTag}>
                        {set.reps}×{toDisplay(set.weightKg)}{unit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 16px 100px', maxWidth: 480, margin: '0 auto' },
  title: { fontSize: 26, fontWeight: 700, color: 'var(--color-text)', marginBottom: 20, letterSpacing: '-0.5px' },
  muted: { color: 'var(--color-muted)', textAlign: 'center', paddingTop: 40 },
  empty: { textAlign: 'center', color: 'var(--color-muted)', paddingTop: 40 },
  card: {
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: 'var(--radius-lg)',
    marginBottom: 12, boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(108,60,225,0.08)',
    overflow: 'hidden', padding: '0 16px',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', background: 'none', padding: '14px 0', cursor: 'pointer', border: 'none',
  },
  date: { fontSize: 16, fontWeight: 600, color: 'var(--color-text)' },
  summary: { fontSize: 13, color: 'var(--color-muted)', marginTop: 2 },
  exRow: { paddingBottom: 10, borderBottom: '1px solid rgba(108,60,225,0.06)', marginBottom: 10 },
  exName: { fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 },
  sets: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  setTag: {
    fontSize: 12, padding: '3px 10px', borderRadius: 12, fontWeight: 500,
    background: 'rgba(108,60,225,0.08)', color: 'var(--color-primary)',
  },
}
