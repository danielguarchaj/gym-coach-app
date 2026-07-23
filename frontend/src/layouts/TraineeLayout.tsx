import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from '../components/BottomNav'
import PageTransition from '../components/PageTransition'
import { useTranslation } from '../i18n'

export default function TraineeLayout() {
  const { t } = useTranslation()
  const location = useLocation()

  const items = [
    { label: t('nav.log'), icon: '➕', path: '/trainee/log' },
    { label: t('nav.history'), icon: '📋', path: '/trainee/history' },
    { label: t('nav.profile'), icon: '👤', path: '/trainee/profile' },
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
