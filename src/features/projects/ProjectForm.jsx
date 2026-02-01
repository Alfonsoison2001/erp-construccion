import { useState } from 'react'
import { useProjects, useOperators } from './useProjects'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { UserPlus, X } from 'lucide-react'

export default function ProjectForm({ project, onClose }) {
  const { createProject, updateProject, assignOperator, removeOperator } = useProjects()
  const operators = useOperators()
  const [form, setForm] = useState({
    name: project?.name || '',
    owner_name: project?.owner_name || '',
    address: project?.address || '',
    start_date: project?.start_date || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const assignedOperators = project?.project_operators?.map(po => po.profiles) || []
  const availableOperators = operators.filter(op => !assignedOperators.find(ao => ao?.id === op.id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (project) {
        await updateProject(project.id, form)
      } else {
        await createProject(form)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async (operatorId) => {
    if (!project) return
    try {
      await assignOperator(project.id, operatorId)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemove = async (operatorId) => {
    if (!project) return
    try {
      await removeOperator(project.id, operatorId)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <Input
          label="Nombre del proyecto"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Propietario"
          value={form.owner_name}
          onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
        />
        <Input
          label="Dirección"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <Input
          label="Fecha de inicio"
          type="date"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
        />

        {project && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operadores asignados
            </label>
            <div className="space-y-2 mb-3">
              {assignedOperators.map(op => op && (
                <div key={op.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-sm">{op.full_name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(op.id)}
                    className="text-gray-400 hover:text-danger"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {assignedOperators.length === 0 && (
                <p className="text-sm text-gray-500">Sin operadores asignados</p>
              )}
            </div>

            {availableOperators.length > 0 && (
              <div className="flex gap-2">
                <select
                  id="operatorSelect"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Seleccionar operador...</option>
                  {availableOperators.map(op => (
                    <option key={op.id} value={op.id}>{op.full_name}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const select = document.getElementById('operatorSelect')
                    if (select.value) handleAssign(select.value)
                  }}
                >
                  <UserPlus size={14} /> Asignar
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : project ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
