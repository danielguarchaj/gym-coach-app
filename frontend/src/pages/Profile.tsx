import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'
import { useWeightUnit } from '../hooks/useWeightUnit'

export default function Profile() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { unit, setUnit } = useWeightUnit()

  const roleLabel = user?.role === 'COACH' ? t('auth.role_coach') : t('auth.role_trainee')
  const roleColor = user?.role === 'COACH' ? '#6C3CE1' : '#F97316'

  return (
    <div style={styles.page}>
      <motion.div
        style={styles.avatarSection}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</div>
        <h1 style={styles.name}>{user?.name}</h1>
        <p style={styles.email}>{user?.email}</p>
        <span style={{ ...styles.roleBadge, background: `${roleColor}18`, color: roleColor }}>
          {roleLabel}
        </span>
      </motion.div>

      <motion.div
        style={styles.section}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 style={styles.sectionTitle}>{t('profile.weight_unit')}</h2>
        <div style={styles.unitRow}>
          {(['kg', 'lb'] as const).map((u) => (
            <motion.button
              key={u}
              style={{ ...styles.unitBtn, ...(unit === u ? styles.unitBtnActive : {}) }}
              onClick={() => setUnit(u)}
              whileTap={{ scale: 0.97 }}
            >
              {u === 'kg' ? t('profile.kg') : t('profile.lb')}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.button
        style={styles.logoutBtn}
        onClick={() => logout()}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {t('profile.logout')}
      </motion.button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px 16px 120px', maxWidth: 480, margin: '0 auto' },
  avatarSection: { textAlign: 'center', marginBottom: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary)',
    color: '#fff', fontSize: 34, fontWeight: 700, display: 'flex',
    alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
    boxShadow: '0 8px 24px rgba(108,60,225,0.3)',
  },
  name: { fontSize: 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 },
  email: { fontSize: 14, color: 'var(--color-muted)', marginBottom: 12 },
  roleBadge: { display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  section: {
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16,
    boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(108,60,225,0.08)',
  },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' },
  unitRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  unitBtn: { padding: '12px', borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(108,60,225,0.15)', background: 'none', fontSize: 14, fontWeight: 500, color: 'var(--color-muted)', cursor: 'pointer' },
  unitBtnActive: { border: '1.5px solid var(--color-primary)', background: 'rgba(108,60,225,0.08)', color: 'var(--color-primary)', fontWeight: 700 },
  logoutBtn: {
    width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    color: 'var(--color-error)', fontWeight: 600, fontSize: 15, cursor: 'pointer',
  },
}
