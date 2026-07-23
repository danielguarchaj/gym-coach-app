import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { exercisesApi, type Exercise } from '../api/exercises'
import { useTranslation } from '../i18n'

const BODY_PARTS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Cardio']
const BODY_PART_KEYS: Record<string, string> = {
  Chest: 'exercises.chest', Back: 'exercises.back', Shoulders: 'exercises.shoulders',
  Biceps: 'exercises.biceps', Triceps: 'exercises.triceps', Legs: 'exercises.legs',
  Glutes: 'exercises.glutes', Core: 'exercises.core', Cardio: 'exercises.cardio',
}

interface Props {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
}

export default function ExercisePicker({ onSelect, onClose }: Props) {
  const { t } = useTranslation()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null)

  useEffect(() => {
    exercisesApi.list(activeBodyPart ?? undefined).then((res) => {
      setExercises(res.exercises)
      setLoading(false)
    })
  }, [activeBodyPart])

  const filtered = search
    ? exercises.filter((ex) => ex.name.es.toLowerCase().includes(search.toLowerCase()))
    : exercises

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.sheet}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={styles.handle} />

        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>{t('exercises.search')}</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <input
          style={styles.search}
          placeholder={t('exercises.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        {/* Body part filter chips */}
        <div style={styles.chips}>
          <motion.button
            style={{ ...styles.chip, ...(activeBodyPart === null ? styles.chipActive : {}) }}
            onClick={() => setActiveBodyPart(null)}
            whileTap={{ scale: 0.95 }}
          >
            {t('exercises.all')}
          </motion.button>
          {BODY_PARTS.map((bp) => (
            <motion.button
              key={bp}
              style={{ ...styles.chip, ...(activeBodyPart === bp ? styles.chipActive : {}) }}
              onClick={() => setActiveBodyPart(bp)}
              whileTap={{ scale: 0.95 }}
            >
              {t(BODY_PART_KEYS[bp])}
            </motion.button>
          ))}
        </div>

        {/* Exercise list */}
        <div style={styles.list}>
          {loading ? (
            <p style={styles.empty}>{t('common.loading')}</p>
          ) : filtered.length === 0 ? (
            <p style={styles.empty}>{t('common.error')}</p>
          ) : (
            filtered.map((ex) => (
              <motion.button
                key={ex.exerciseId}
                style={styles.exerciseItem}
                onClick={() => { onSelect(ex); onClose() }}
                whileTap={{ scale: 0.98 }}
              >
                <div>
                  <div style={styles.exerciseName}>{ex.name.es}</div>
                  <div style={styles.exerciseMeta}>{ex.primaryMuscle} · {ex.equipment}</div>
                </div>
                <span style={{ ...styles.categoryBadge, ...categoryColor(ex.category) }}>
                  {ex.category}
                </span>
              </motion.button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function categoryColor(cat: string): React.CSSProperties {
  if (cat === 'compound') return { background: 'rgba(108,60,225,0.1)', color: 'var(--color-primary)' }
  if (cat === 'cardio') return { background: 'rgba(249,115,22,0.1)', color: 'var(--color-secondary)' }
  return { background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(26,26,46,0.5)',
    zIndex: 100, display: 'flex', alignItems: 'flex-end',
  },
  sheet: {
    width: '100%', background: 'var(--color-surface)', borderRadius: '24px 24px 0 0',
    maxHeight: '85dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
  },
  handle: {
    width: 40, height: 4, background: 'rgba(139,143,168,0.4)',
    borderRadius: 2, margin: '12px auto 0',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 8px' },
  title: { fontSize: 18, fontWeight: 600, color: 'var(--color-text)' },
  closeBtn: { background: 'none', fontSize: 18, color: 'var(--color-muted)', padding: 4, cursor: 'pointer' },
  search: {
    margin: '0 16px 12px', padding: '12px 14px', borderRadius: 'var(--radius-md)',
    border: '1.5px solid rgba(108,60,225,0.2)', background: 'var(--color-background)',
    fontSize: 15, outline: 'none',
  },
  chips: { display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', flexShrink: 0 },
  chip: {
    padding: '6px 14px', borderRadius: 20, border: '1.5px solid rgba(108,60,225,0.2)',
    background: 'none', fontSize: 13, fontWeight: 500, color: 'var(--color-muted)',
    whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
  },
  chipActive: {
    border: '1.5px solid var(--color-primary)', background: 'rgba(108,60,225,0.08)',
    color: 'var(--color-primary)', fontWeight: 600,
  },
  list: { overflowY: 'auto', flex: 1, padding: '0 0 24px' },
  empty: { textAlign: 'center', color: 'var(--color-muted)', padding: 32 },
  exerciseItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', padding: '14px 20px', background: 'none', border: 'none',
    borderBottom: '1px solid rgba(108,60,225,0.06)', textAlign: 'left', cursor: 'pointer',
  },
  exerciseName: { fontSize: 15, fontWeight: 500, color: 'var(--color-text)', marginBottom: 2 },
  exerciseMeta: { fontSize: 13, color: 'var(--color-muted)' },
  categoryBadge: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 12, flexShrink: 0 },
}
