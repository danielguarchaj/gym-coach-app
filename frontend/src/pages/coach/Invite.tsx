import { useState } from 'react'
import { motion } from 'framer-motion'
import { invitesApi } from '../../api/invites'
import { useTranslation } from '../../i18n'

export default function CoachInvite() {
  const { t } = useTranslation()
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await invitesApi.create()
      setInviteUrl(res.inviteUrl)
      setExpiresAt(res.expiresAt)
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  async function share() {
    if (!inviteUrl) return
    if (navigator.share) {
      await navigator.share({
        title: 'GymCoach — Únete a mi equipo',
        text: t('invite.subtitle'),
        url: inviteUrl,
      })
    } else {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const expiryDate = expiresAt ? new Date(expiresAt * 1000).toLocaleDateString('es') : null

  return (
    <div style={styles.page}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={styles.icon}>🔗</div>
        <h1 style={styles.title}>{t('coach.invite.title')}</h1>
        <p style={styles.subtitle}>{t('coach.invite.expiry')}</p>

        {error && <p style={styles.error}>{error}</p>}

        {!inviteUrl ? (
          <motion.button
            style={styles.primaryBtn}
            onClick={generate}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? t('common.loading') : t('coach.invite.generate')}
          </motion.button>
        ) : (
          <>
            <div style={styles.linkBox}>
              <p style={styles.linkText}>{inviteUrl}</p>
            </div>

            {expiryDate && (
              <p style={styles.expiry}>Válido hasta el {expiryDate}</p>
            )}

            <motion.button
              style={styles.primaryBtn}
              onClick={share}
              whileTap={{ scale: 0.97 }}
            >
              {copied ? '✓ ' + t('coach.invite.copy') : '↗ ' + t('coach.invite.share')}
            </motion.button>

            <motion.button
              style={styles.secondaryBtn}
              onClick={() => { setInviteUrl(null); setExpiresAt(null) }}
              whileTap={{ scale: 0.97 }}
            >
              {t('coach.invite.generate')}
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px', background: 'var(--color-background)',
  },
  card: {
    width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(16px)', borderRadius: 'var(--radius-xl)',
    padding: '40px 28px', boxShadow: 'var(--shadow-lg)',
    border: '1px solid rgba(108,60,225,0.1)', textAlign: 'center',
  },
  icon: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'var(--color-muted)', marginBottom: 28 },
  linkBox: {
    background: 'var(--color-background)', borderRadius: 'var(--radius-md)',
    padding: '12px 14px', marginBottom: 12, border: '1px solid rgba(108,60,225,0.15)',
  },
  linkText: { fontSize: 12, color: 'var(--color-muted)', wordBreak: 'break-all', lineHeight: 1.5 },
  expiry: { fontSize: 12, color: 'var(--color-muted)', marginBottom: 16 },
  primaryBtn: {
    width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
    background: 'var(--color-primary)', color: '#fff', fontWeight: 600,
    fontSize: 16, marginBottom: 10, cursor: 'pointer',
  },
  secondaryBtn: {
    width: '100%', padding: '13px', borderRadius: 'var(--radius-md)',
    background: 'none', border: '1.5px solid rgba(108,60,225,0.3)',
    color: 'var(--color-primary)', fontWeight: 600, fontSize: 15, cursor: 'pointer',
  },
  error: { color: 'var(--color-error)', fontSize: 13, marginBottom: 16 },
}
