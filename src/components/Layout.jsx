import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../features/auth/AuthContext'
import { useProject } from '../hooks/useProjectContext'
import {
  LayoutDashboard,
  FolderKanban,
  FileSpreadsheet,
  Receipt,
  CheckCircle,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

const DEMO_PROJECTS = [
  { id: 'demo-p1', name: 'Bosques de Olmos #13' },
  { id: 'demo-p2', name: 'Residencial Las Águilas' },
]

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/proyectos', icon: FolderKanban, label: 'Proyectos' },
  { to: '/presupuesto', icon: FileSpreadsheet, label: 'Presupuesto', adminOnly: true },
  { to: '/remesas', icon: Receipt, label: 'Remesas' },
  { to: '/aprobacion', icon: CheckCircle, label: 'Aprobación', adminOnly: true },
  { to: '/configuracion', icon: Settings, label: 'Configuración', adminOnly: true },
]

export default function Layout({ children }) {
  const { profile, signOut, isAdmin } = useAuthContext()
  const { currentProject, setCurrentProject } = useProject()
  const [projects, setProjects] = useState([])
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    if (DEMO_MODE) {
      setProjects(DEMO_PROJECTS)
      if (!currentProject && DEMO_PROJECTS.length > 0) {
        setCurrentProject(DEMO_PROJECTS[0])
      }
      return
    }

    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .order('name')
    if (data) {
      setProjects(data)
      if (!currentProject && data.length > 0) {
        setCurrentProject(data[0])
      }
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-green-900/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">ERP Construcción</h1>
              <p className="text-xs text-gray-400">Presupuestos & Remesas</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-green-900/30">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-sidebar-hover transition-colors w-full"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              <FolderKanban size={16} className="text-gray-400" />
              <span className="font-medium">
                {currentProject?.name || 'Seleccionar proyecto'}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {showProjectMenu && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentProject(p)
                      setShowProjectMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      currentProject?.id === p.id ? 'text-primary font-medium' : 'text-gray-700'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
                {projects.length === 0 && (
                  <p className="px-4 py-2 text-sm text-gray-500">Sin proyectos</p>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
