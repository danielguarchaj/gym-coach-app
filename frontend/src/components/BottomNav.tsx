import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

interface NavItem {
  label: string
  icon: string
  path: string
}

interface Props {
  items: NavItem[]
}

export default function BottomNav({ items }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={styles.nav}>
      {items.map((item) => {
        const active = pathname.startsWith(item.path)
        return (
          <motion.button
            key={item.path}
            style={{ ...styles.item, ...(active ? styles.activeItem : {}) }}
            onClick={() => navigate(item.path)}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span
              style={styles.icon}
              animate={{ scale: active ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {item.icon}
            </motion.span>
            <span style={{ ...styles.label, ...(active ? styles.activeLabel : {}) }}>
              {item.label}
            </span>
            {active && (
              <motion.div
                style={styles.indicator}
                layoutId="nav-indicator"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(108,60,225,0.1)',
    display: 'flex', justifyContent: 'space-around',
    padding: '10px 0 max(10px, env(safe-area-inset-bottom))',
    zIndex: 50,
    boxShadow: '0 -4px 24px rgba(108,60,225,0.08)',
  },
  item: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 16px',
    position: 'relative', minWidth: 64,
  },
  activeItem: {},
  icon: { fontSize: 24, lineHeight: 1 },
  label: { fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', letterSpacing: '0.2px' },
  activeLabel: { color: 'var(--color-primary)', fontWeight: 700 },
  indicator: {
    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
    width: 4, height: 4, borderRadius: '50%', background: 'var(--color-primary)',
  },
}
