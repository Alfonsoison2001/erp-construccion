import { useState } from 'react'
import { useProjects } from './useProjects'
import { useAuthContext } from '../auth/AuthContext'
import ProjectForm from './ProjectForm'
import Card, { CardHeader, CardBody } from '../../components/Card'
import Table from '../../components/Table'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatDateShort } from '../../lib/formatters'
import { Plus, FolderKanban, Pencil, Trash2 } from 'lucide-react'

export default function ProjectsPage() {
  const { projects, loading, deleteProject } = useProjects()
  const { isAdmin } = useAuthContext()
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  const columns = [
    { key: 'name', label: 'Nombre', render: (row) => (
      <span className="font-medium text-gray-900">{row.name}</span>
    )},
    { key: 'owner_name', label: 'Propietario' },
    { key: 'address', label: 'Dirección' },
    { key: 'start_date', label: 'Inicio', render: (row) => formatDateShort(row.start_date) },
    { key: 'operators', label: 'Operadores', render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.project_operators?.map(po => (
          <span key={po.operator_id} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
            {po.profiles?.full_name}
          </span>
        ))}
      </div>
    )},
    ...(isAdmin ? [{
      key: 'actions', label: '', className: 'w-24', render: (row) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingProject(row); setShowForm(true) }}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <Pencil size={14} className="text-gray-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <Trash2 size={14} className="text-gray-500" />
          </button>
        </div>
      )
    }] : []),
  ]

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este proyecto? Se borrarán todos sus datos.')) {
      await deleteProject(id)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} proyecto(s)</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingProject(null); setShowForm(true) }}>
            <Plus size={16} /> Nuevo Proyecto
          </Button>
        )}
      </div>

      <Card>
        {projects.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={FolderKanban}
              title="Sin proyectos"
              description={isAdmin ? 'Crea tu primer proyecto para comenzar' : 'No tienes proyectos asignados'}
              action={isAdmin && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus size={16} /> Crear Proyecto
                </Button>
              )}
            />
          </CardBody>
        ) : (
          <Table columns={columns} data={projects} />
        )}
      </Card>

      {showForm && (
        <ProjectForm
          project={editingProject}
          onClose={() => { setShowForm(false); setEditingProject(null) }}
        />
      )}
    </div>
  )
}
