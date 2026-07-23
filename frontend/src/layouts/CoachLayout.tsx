import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from '../components/BottomNav'
import PageTransition from '../components/PageTransition'
import { useTranslation } from '../i18n'

export default function CoachLayout() {
  const { t } = useTranslation()
  const location = useLocation()

  const items = [
    { label: t('nav.trainees'), icon: '👥', path: '/coach/trainees' },
    { label: t('nav.invite'), icon: '🔗', path: '/coach/invite' },
    { label: t('nav.profile'), icon: '👤', path: '/coach/profile' },
  ]

  return (
    <>
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </AnimatePresence>
      <BottomNav items={items} />
    </>
  )
}
