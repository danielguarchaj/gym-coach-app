import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sessionsApi, type SessionExercise, type SetRecord } from '../../api/sessions'
import { useTranslation } from '../../i18n'
import { useWeightUnit } from '../../hooks/useWeightUnit'
import ExercisePicker from '../../components/ExercisePicker'
import type { Exercise } from '../../api/exercises'

interface ExerciseEntry {
  catalogId: string
  name: string
  bodyPart: string
  sets: { reps: string; weight: string; restSeconds: string }[]
}

function emptySet() { return { reps: '', weight: '', restSeconds: '90' } }

export default function TraineeLog() {
  const { t } = useTranslation()
  const { unit, toStorage } = useWeightUnit()
  const [exercises, setExercises] = useState<ExerciseEntry[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function addExercise(ex: Exercise) {
    setExercises((prev) => [
      ...prev,
      { catalogId: ex.exerciseId, name: ex.name.es, bodyPart: ex.bodyPart, sets: [emptySet()] },
    ])
  }

  function updateSet(ei: number, si: number, field: keyof ReturnType<typeof emptySet>, value: string) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => j !== si ? s : { ...s, [field]: value }) },
      ),
    )
  }

  function addSet(ei: number) {
    setExercises((prev) =>
      prev.map((ex, i) => i !== ei ? ex : { ...ex, sets: [...ex.sets, emptySet()] }),
    )
  }

  function removeExercise(ei: number) {
    setExercises((prev) => prev.filter((_, i) => i !== ei))
  }

  async function submit() {
    if (exercises.length === 0) return
    setSubmitting(true)
    setError('')
    try {
      const payload: SessionExercise[] = exercises.map((ex) => ({
        catalogId: ex.catalogId,
        name: ex.name,
        bodyPart: ex.bodyPart,
        sets: ex.sets
          .filter((s) => s.reps && s.weight)
          .map((s): SetRecord => ({
            reps: parseInt(s.reps, 10),
            weightKg: toStorage(parseFloat(s.weight)),
            restSeconds: parseInt(s.restSeconds, 10) || 0,
          })),
      }))
      await sessionsApi.create({ exercises: payload })
      setExercises([])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError(t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>{t('trainee.log.title')}</h1>

      {success && (
        <motion.div style={styles.successBanner} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          ✓ Sesión guardada
        </motion.div>
      )}

      {exercises.map((ex, ei) => (
        <motion.div
          key={`${ex.catalogId}-${ei}`}
          style={styles.exerciseCard}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={styles.exerciseHeader}>
            <div>
              <div style={styles.exerciseName}>{ex.name}</div>
              <div style={styles.exerciseMeta}>{ex.bodyPart}</div>
            </div>
            <button style={styles.removeBtn} onClick={() => removeExercise(ei)}>✕</button>
          </div>

          <div style={styles.setHeader}>
            <span>Set</span><span>{t('trainee.log.reps')}</span>
            <span>{t('trainee.log.weight')} ({unit})</span>
            <span>{t('trainee.log.rest')}</span>
          </div>

          {ex.sets.map((s, si) => (
            <div key={si} style={styles.setRow}>
              <span style={styles.setNum}>{si + 1}</span>
              <input
                style={styles.setInput} type="number" inputMode="numeric"
                placeholder="10" value={s.reps}
                onChange={(e) => updateSet(ei, si, 'reps', e.target.value)}
              />
              <input
                style={styles.setInput} type="number" inputMode="decimal"
                placeholder="20" value={s.weight}
                onChange={(e) => updateSet(ei, si, 'weight', e.target.value)}
              />
              <input
                style={styles.setInput} type="number" inputMode="numeric"
                placeholder="90" value={s.restSeconds}
                onChange={(e) => updateSet(ei, si, 'restSeconds', e.target.value)}
              />
            </div>
          ))}

          <motion.button style={styles.addSetBtn} onClick={() => addSet(ei)} whileTap={{ scale: 0.97 }}>
            + {t('trainee.log.add_set')}
          </motion.button>
        </motion.div>
      ))}

      <motion.button style={styles.addExBtn} onClick={() => setShowPicker(true)} whileTap={{ scale: 0.97 }}>
        + {t('trainee.log.add_exercise')}
      </motion.button>

      {error && <p style={styles.error}>{error}</p>}

      {exercises.length > 0 && (
        <motion.button
          style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
          onClick={submit}
          disabled={submitting}
          whileTap={{ scale: 0.97 }}
        >
          {submitting ? t('trainee.log.submitting') : t('trainee.log.submit')}
        </motion.button>
      )}

      <AnimatePresence>
        {showPicker && (
          <ExercisePicker onSelect={addExercise} onClose={() => setShowPicker(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 16px 120px', maxWidth: 480, margin: '0 auto' },
  title: { fontSize: 26, fontWeight: 700, color: 'var(--color-text)', marginBottom: 20, letterSpacing: '-0.5px' },
  successBanner: {
    background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: 16, fontWeight: 600,
  },
  exerciseCard: {
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 12,
    boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(108,60,225,0.08)',
  },
  exerciseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  exerciseName: { fontSize: 16, fontWeight: 600, color: 'var(--color-text)' },
  exerciseMeta: { fontSize: 12, color: 'var(--color-muted)', marginTop: 2 },
  removeBtn: { background: 'none', fontSize: 16, color: 'var(--color-muted)', cursor: 'pointer', padding: 4 },
  setHeader: {
    display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr', gap: 8,
    fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase',
    letterSpacing: '0.5px', marginBottom: 6, paddingLeft: 2,
  },
  setRow: { display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr', gap: 8, marginBottom: 6, alignItems: 'center' },
  setNum: { fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textAlign: 'center' },
  setInput: {
    padding: '9px 8px', borderRadius: 'var(--radius-sm)', border: '1.5px solid rgba(108,60,225,0.15)',
    background: 'var(--color-background)', fontSize: 15, textAlign: 'center', outline: 'none', width: '100%',
  },
  addSetBtn: {
    marginTop: 8, width: '100%', padding: '9px', borderRadius: 'var(--radius-sm)',
    background: 'none', border: '1.5px dashed rgba(108,60,225,0.25)',
    color: 'var(--color-primary)', fontWeight: 500, fontSize: 14, cursor: 'pointer',
  },
  addExBtn: {
    width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
    background: 'none', border: '1.5px dashed rgba(108,60,225,0.3)',
    color: 'var(--color-primary)', fontWeight: 600, fontSize: 15,
    cursor: 'pointer', marginBottom: 16,
  },
  submitBtn: {
    width: '100%', padding: '15px', borderRadius: 'var(--radius-md)',
    background: 'var(--color-primary)', color: '#fff', fontWeight: 700,
    fontSize: 16, cursor: 'pointer', marginBottom: 16,
  },
  error: { color: 'var(--color-error)', fontSize: 13, textAlign: 'center', marginBottom: 12 },
}
