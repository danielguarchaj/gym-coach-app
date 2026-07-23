import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot,
} from 'recharts'
import { traineesApi, type ProgressDataPoint } from '../../api/trainees'
import { sessionsApi } from '../../api/sessions'
import { exercisesApi, type Exercise } from '../../api/exercises'
import { useTranslation } from '../../i18n'
import { useWeightUnit } from '../../hooks/useWeightUnit'

type Range = '30' | '90' | 'all'

function dateRange(r: Range): { from?: string; to?: string } {
  if (r === 'all') return {}
  const to = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - parseInt(r) * 86400000).toISOString().split('T')[0]
  return { from, to }
}

export default function TraineeProgress() {
  const { t } = useTranslation()
  const { unit, toDisplay } = useWeightUnit()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [range, setRange] = useState<Range>('30')
  const [dataPoints, setDataPoints] = useState<ProgressDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    Promise.all([sessionsApi.list(), exercisesApi.list()]).then(([ses, exs]) => {
      const loggedIds = new Set(ses.sessions.flatMap((s) => s.exercises.map((e) => e.catalogId)))
      setExercises(exs.exercises.filter((e) => loggedIds.has(e.exerciseId)))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedExercise) return
    setChartLoading(true)
    const r = dateRange(range)
    traineesApi.ownProgress(selectedExercise, r.from ? r as { from: string; to: string } : undefined)
      .then((res) => { setDataPoints(res.dataPoints); setChartLoading(false) })
  }, [selectedExercise, range])

  const maxWeight = dataPoints.length > 0 ? Math.max(...dataPoints.map((d) => d.maxWeightKg)) : 0

  return (
    <div style={styles.page}>
      <motion.h1 style={styles.title} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        {t('trainee.progress.title')}
      </motion.h1>

      {loading ? (
        <p style={styles.muted}>{t('common.loading')}</p>
      ) : exercises.length === 0 ? (
        <p style={styles.muted}>{t('trainee.history.empty')}</p>
      ) : (
        <div style={styles.chartSection}>
          <select
            style={styles.select}
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
          >
            <option value="">{t('coach.progress.select_exercise')}</option>
            {exercises.map((ex) => (
              <option key={ex.exerciseId} value={ex.exerciseId}>{ex.name.es}</option>
            ))}
          </select>

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

          {!selectedExercise && <p style={styles.muted}>{t('coach.progress.select_exercise')}</p>}

          {chartLoading && <p style={styles.muted}>{t('common.loading')}</p>}

          {selectedExercise && !chartLoading && dataPoints.length === 0 && (
            <p style={styles.muted}>{t('coach.progress.no_data')}</p>
          )}

          {selectedExercise && !chartLoading && dataPoints.length > 0 && (
            <motion.div style={styles.chartWrap} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={styles.prBadge}>
                PR: <strong>{toDisplay(maxWeight)}{unit}</strong>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={dataPoints.map((d) => ({ ...d, displayWeight: toDisplay(d.maxWeightKg) }))}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,60,225,0.1)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B8FA8' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#8B8FA8' }} unit={unit} />
                  <Tooltip
                    formatter={(v: unknown) => [`${v}${unit}`, t('coach.progress.weight')]}
                    labelFormatter={(l: unknown) => new Date(String(l)).toLocaleDateString('es')}
                    contentStyle={{ borderRadius: 12, border: '1px solid rgba(108,60,225,0.2)', fontSize: 13 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="displayWeight"
                    stroke="#6C3CE1"
                    strokeWidth={2.5}
                    dot={(props) => {
                      const isMax = (props.payload as { maxWeightKg: number }).maxWeightKg === maxWeight
                      const { points: _p, ...dotProps } = props
                      return <Dot {...dotProps} r={isMax ? 6 : 4} fill={isMax ? '#10B981' : '#6C3CE1'} stroke={isMax ? '#10B981' : '#6C3CE1'} />
                    }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' },
  title: { fontSize: 26, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.5px', marginBottom: 24 },
  muted: { color: 'var(--color-muted)', textAlign: 'center', padding: '32px 0' },
  chartSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  select: { width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(108,60,225,0.2)', background: 'var(--color-background)', fontSize: 15, color: 'var(--color-text)', outline: 'none' },
  rangeRow: { display: 'flex', gap: 8 },
  rangeBtn: { flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: '1.5px solid rgba(108,60,225,0.15)', background: 'none', fontSize: 12, fontWeight: 500, color: 'var(--color-muted)', cursor: 'pointer' },
  rangeBtnActive: { border: '1.5px solid var(--color-primary)', background: 'rgba(108,60,225,0.08)', color: 'var(--color-primary)', fontWeight: 700 },
  chartWrap: { background: 'rgba(255,255,255,0.85)', borderRadius: 'var(--radius-lg)', padding: '20px 12px 16px', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(108,60,225,0.08)' },
  prBadge: { fontSize: 13, color: 'var(--color-success)', fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 },
}
