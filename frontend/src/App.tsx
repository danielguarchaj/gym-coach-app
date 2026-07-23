import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { I18nProvider } from './i18n'
import { AuthProvider, useAuth } from './hooks/useAuth'

import Login from './pages/Login'
import Register from './pages/Register'
import InviteLanding from './pages/InviteLanding'
import Profile from './pages/Profile'

import CoachLayout from './layouts/CoachLayout'
import CoachTrainees from './pages/coach/Trainees'
import CoachTraineeDetail from './pages/coach/TraineeDetail'
import CoachInvite from './pages/coach/Invite'

import TraineeLayout from './layouts/TraineeLayout'
import TraineeLog from './pages/trainee/Log'
import TraineeHistory from './pages/trainee/History'
import TraineeProgress from './pages/trainee/Progress'

function RoleGuard({ role, children }: { role: 'COACH' | 'TRAINEE'; children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'COACH'
    ? <Navigate to="/coach/trainees" replace />
    : <Navigate to="/trainee/log" replace />
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invite/:token" element={<InviteLanding />} />

            {/* Coach — nested under CoachLayout for shared BottomNav */}
            <Route element={<RoleGuard role="COACH"><CoachLayout /></RoleGuard>}>
              <Route path="/coach/trainees" element={<CoachTrainees />} />
              <Route path="/coach/trainees/:id" element={<CoachTraineeDetail />} />
              <Route path="/coach/invite" element={<CoachInvite />} />
              <Route path="/coach/profile" element={<Profile />} />
            </Route>

            {/* Trainee — nested under TraineeLayout for shared BottomNav */}
            <Route element={<RoleGuard role="TRAINEE"><TraineeLayout /></RoleGuard>}>
              <Route path="/trainee/log" element={<TraineeLog />} />
              <Route path="/trainee/history" element={<TraineeHistory />} />
              <Route path="/trainee/progress" element={<TraineeProgress />} />
              <Route path="/trainee/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </I18nProvider>
  )
}
