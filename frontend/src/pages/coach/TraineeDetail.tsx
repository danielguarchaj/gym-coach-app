import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot,
} from 'recharts'
import { traineesApi, type TraineeSummary, type ProgressDataPoint } from '../../api/trainees'
import type { WorkoutSession } from '../../api/sessions'
import { exercisesApi, type Exercise } from '../../api/exercises'
import { useTranslation } from '../../i18n'
import { useWeightUnit } from '../../hooks/useWeightUnit'

type Tab = 'history' | 'progress'
type Range = '30' | '90' | 'all'

function dateRange(r: Range): { from?: string; to?: string } {
  if (r === 'all') return {}
  const to = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - parseInt(r) * 86400000).toISOString().split('T')[0]
  return { from, to }
}

export default function CoachTraineeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { unit, toDisplay } = useWeightUnit()

  const [tab, setTab] = useState<Tab>('history')
  const [trainee, setTrainee] = useState<TraineeSummary | null>(null)
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [range, setRange] = useState<Range>('30')
  const [dataPoints, setDataPoints] = useState<ProgressDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      traineesApi.get(id),
      traineesApi.sessions(id),
      exercisesApi.list(),
    ]).then(([tr, ses, exs]) => {
      setTrainee(tr)
      setSessions(ses.sessions)
      // Only show exercises this trainee has actually logged
      const loggedIds = new Set(ses.sessions.flatMap((s) => s.exercises.map((e) => e.catalogId)))
      setExercises(exs.exercises.filter((e) => loggedIds.has(e.exerciseId)))
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!id || !selectedExercise) return
    setChartLoading(true)
    const r = dateRange(range)
    traineesApi.progress(id, selectedExercise, r.from ? r as { from: string; to: string } : undefined)
      .then((res) => { setDataPoints(res.dataPoints); setChartLoading(false) })
  }, [id, selectedExercise, range])

  if (loading) return <div style={styles.page}><p style={styles.muted}>{t('common.loading')}</p></div>

  const maxWeight = dataPoints.length > 0 ? Math.max(...dataPoints.map((d) => d.maxWeightKg)) : 0

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/coach/trainees')}>← {t('common.back')}</button>
        <h1 style={styles.name}>{trainee?.name}</h1>
        <p style={styles.meta}>{trainee?.totalSessions} sesiones</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['history', 'progress'] as Tab[]).map((t_) => (
          <button
            key={t_}
            style={{ ...styles.tab, ...(tab === t_ ? styles.tabActive : {}) }}
            onClick={() => setTab(t_)}
          >
            {t_ === 'history' ? 'Historial' : t('coach.progress.title')}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        <div>
          {sessions.length === 0 && <p style={styles.muted}>Sin sesiones registradas</p>}
          {sessions.map((s, i) => (
            <motion.div key={s.sessionId} style={styles.card} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <button style={styles.cardHeader} onClick={() => setExpanded(expanded === s.sessionId ? null : s.sessionId)}>
                <div>
                  <div style={styles.date}>{new Date(s.date).toLocaleDateString('es')}</div>
                  <div style={styles.cardMeta}>{s.exercises.length} ejercicios</div>
                </div>
                <span style={{ color: 'var(--color-primary)' }}>{expanded === s.sessionId ? '▲' : '▼'}</span>
              </button>
              {expanded === s.sessionId && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ paddingTop: 10 }}>
                  {s.exercises.map((ex, ei) => (
                    <div key={ei} style={styles.exRow}>
                      <div style={styles.exName}>{ex.name}</div>
                      <div style={styles.sets}>{ex.sets.map((set, si) => <span key={si} style={styles.setTag}>{set.reps}×{toDisplay(set.weightKg)}{unit}</span>)}</div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'progress' && (
        <div style={styles.chartSection}>
          {/* Exercise selector */}
          <select
            style={styles.select}
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
          >
            <option value="">{t('coach.progress.select_exercise')}</option>
            {exercises.map((ex) => <option key={ex.exerciseId} value={ex.exerciseId}>{ex.name.es}</option>)}
          </select>

          {/* Range selector */}
          <div style={styles.rangeRow}>
            {(['30', '90', 'all'] as Range[]).map((r) => (
              <button
                key={r}
                style={{ ...styles.rangeBtn, ...(range === r ? styles.rangeBtnActive : {}) }}
                onClick={() => setRange(r)}
              >
                {r === '30' ? t('coach.progress.range_30') : r === '90' ? t('coach.progress.range_90') : t('coach.progress.range_all')}
              </button>
            ))}
          </div>

          {selectedExercise && !chartLoading && dataPoints.length > 0 && (
            <div style={styles.chartWrap}>
              <div style={styles.prBadge}>
                PR: <strong>{toDisplay(maxWeight)}{unit}</strong>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dataPoints.map((d) => ({ ...d, displayWeight: toDisplay(d.maxWeightKg) }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,60,225,0.1)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B8FA8' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#8B8FA8' }} unit={unit} />
                  <Tooltip
                    formatter={(v: unknown) => [`${v}${unit}`, t('coach.progress.weight')]}
                    labelFormatter={(l: unknown) => new Date(String(l)).toLocaleDateString('es')}
                    contentStyle={{ borderRadius: 12, border: '1px solid rgba(108,60,225,0.2)', fontSize: 13 }}
                  />
                  <Line
                    type="monotone" dataKey="displayWeight" stroke="#6C3CE1" strokeWidth={2.5}
                    dot={(props) => {
                      const isMax = (props.payload as { maxWeightKg: number }).maxWeightKg === maxWeight
                      const { points: _p, ...dotProps } = props
                      return <Dot {...dotProps} r={isMax ? 6 : 4} fill={isMax ? '#10B981' : '#6C3CE1'} stroke={isMax ? '#10B981' : '#6C3CE1'} />
                    }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {selectedExercise && !chartLoading && dataPoints.length === 0 && (
            <p style={styles.muted}>{t('coach.progress.no_data')}</p>
          )}

          {chartLoading && <p style={styles.muted}>{t('common.loading')}</p>}
          {!selectedExercise && <p style={styles.muted}>{t('coach.progress.select_exercise')}</p>}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' },
  header: { marginBottom: 24 },
  backBtn: { background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 8, padding: 0 },
  name: { fontSize: 26, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.5px' },
  meta: { fontSize: 13, color: 'var(--color-muted)', marginTop: 2 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(108,60,225,0.2)', background: 'none', fontSize: 14, fontWeight: 500, color: 'var(--color-muted)', cursor: 'pointer' },
  tabActive: { border: '1.5px solid var(--color-primary)', background: 'rgba(108,60,225,0.08)', color: 'var(--color-primary)', fontWeight: 700 },
  card: { background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: 'var(--radius-lg)', marginBottom: 10, boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(108,60,225,0.08)', overflow: 'hidden', padding: '0 16px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', padding: '14px 0', cursor: 'pointer', border: 'none' },
  date: { fontSize: 15, fontWeight: 600, color: 'var(--color-text)' },
  cardMeta: { fontSize: 12, color: 'var(--color-muted)', marginTop: 2 },
  exRow: { paddingBottom: 8, borderBottom: '1px solid rgba(108,60,225,0.06)', marginBottom: 8 },
  exName: { fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 },
  sets: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  setTag: { fontSize: 12, padding: '3px 10px', borderRadius: 12, fontWeight: 500, background: 'rgba(108,60,225,0.08)', color: 'var(--color-primary)' },
  muted: { color: 'var(--color-muted)', textAlign: 'center', padding: '32px 0' },
  chartSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  select: { width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(108,60,225,0.2)', background: 'var(--color-background)', fontSize: 15, color: 'var(--color-text)', outline: 'none' },
  rangeRow: { display: 'flex', gap: 8 },
  rangeBtn: { flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: '1.5px solid rgba(108,60,225,0.15)', background: 'none', fontSize: 12, fontWeight: 500, color: 'var(--color-muted)', cursor: 'pointer' },
  rangeBtnActive: { border: '1.5px solid var(--color-primary)', background: 'rgba(108,60,225,0.08)', color: 'var(--color-primary)', fontWeight: 700 },
  chartWrap: { background: 'rgba(255,255,255,0.85)', borderRadius: 'var(--radius-lg)', padding: '20px 12px 16px', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(108,60,225,0.08)' },
  prBadge: { fontSize: 13, color: 'var(--color-success)', fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 },
}
