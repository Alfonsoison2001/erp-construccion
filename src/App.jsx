import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { ProjectProvider } from './hooks/useProjectContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './features/auth/LoginPage'
import DashboardPage from './features/dashboard/DashboardPage'
import ProjectsPage from './features/projects/ProjectsPage'
import BudgetPage from './features/budget/BudgetPage'
import RemesasPage from './features/remesas/RemesasPage'
import RemesaForm from './features/remesas/RemesaForm'
import RemesaDetail from './features/remesas/RemesaDetail'
import ApprovalPage from './features/approval/ApprovalPage'
import SettingsPage from './features/settings/SettingsPage'

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <ProjectProvider>
        <Layout>{children}</Layout>
      </ProjectProvider>
    </ProtectedRoute>
  )
}

function AdminRoute({ children }) {
  return (
    <ProtectedRoute adminOnly>
      <ProjectProvider>
        <Layout>{children}</Layout>
      </ProjectProvider>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
          <Route path="/proyectos" element={<AppLayout><ProjectsPage /></AppLayout>} />
          <Route path="/presupuesto" element={<AdminRoute><BudgetPage /></AdminRoute>} />
          <Route path="/remesas" element={<AppLayout><RemesasPage /></AppLayout>} />
          <Route path="/remesas/nueva" element={<AppLayout><RemesaForm /></AppLayout>} />
          <Route path="/remesas/:id" element={<AppLayout><RemesaDetail /></AppLayout>} />
          <Route path="/remesas/:id/editar" element={<AppLayout><RemesaForm /></AppLayout>} />
          <Route path="/aprobacion" element={<AdminRoute><ApprovalPage /></AdminRoute>} />
          <Route path="/configuracion" element={<AdminRoute><SettingsPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
