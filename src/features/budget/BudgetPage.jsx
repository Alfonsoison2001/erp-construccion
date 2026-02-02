import { useState } from 'react'
import { useBudget } from './useBudget'
import { useProject } from '../../hooks/useProjectContext'
import BudgetTable from './BudgetTable'
import BudgetImport from './BudgetImport'
import BudgetItemForm from './BudgetItemForm'
import Card, { CardHeader, CardBody } from '../../components/Card'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatCurrency } from '../../lib/formatters'
import { Upload, FileSpreadsheet, Plus } from 'lucide-react'

export default function BudgetPage() {
  const { currentProject } = useProject()
  const {
    items, grouped, grandTotal, loading, refresh,
    importBatch, addItem, updateItem, deleteItem,
    addCategory, addConcept, updateCategory, updateConcept,
  } = useBudget(currentProject?.id)

  const [showImport, setShowImport] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [itemToEdit, setItemToEdit] = useState(null)
  const [preSelectedCategoryId, setPreSelectedCategoryId] = useState(null)
  const [preSelectedConceptId, setPreSelectedConceptId] = useState(null)

  if (!currentProject) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="Selecciona un proyecto"
        description="Elige un proyecto en el menú superior para ver su presupuesto"
      />
    )
  }

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  const openNewItem = (categoryId = null, conceptId = null) => {
    setItemToEdit(null)
    setPreSelectedCategoryId(categoryId)
    setPreSelectedConceptId(conceptId)
    setShowItemForm(true)
  }

  const handleEditItem = (item) => {
    setItemToEdit(item)
    setPreSelectedCategoryId(null)
    setPreSelectedConceptId(null)
    setShowItemForm(true)
  }

  const handleDeleteItem = (id) => {
    if (confirm('¿Eliminar este item del presupuesto?')) {
      deleteItem(id)
    }
  }

  const handleSaveItem = async (payload, existingId) => {
    if (existingId) {
      const { category_name, concept_name, ...updates } = payload
      await updateItem(existingId, updates)
    } else {
      await addItem(payload)
    }
  }

  const handleAddCategory = () => {
    const name = prompt('Nombre de la nueva categoría:')
    if (name?.trim()) {
      addCategory(name.trim())
    }
  }

  const handleEditCategory = (id, currentName) => {
    const name = prompt('Nuevo nombre para la categoría:', currentName)
    if (name?.trim() && name.trim() !== currentName) {
      updateCategory(id, name.trim())
    }
  }

  const handleAddConcept = (categoryId, categoryName) => {
    const name = prompt(`Nuevo concepto para "${categoryName}":`)
    if (name?.trim()) {
      addConcept(categoryId, categoryName, name.trim())
    }
  }

  const handleEditConcept = (id, currentName) => {
    const name = prompt('Nuevo nombre para el concepto:', currentName)
    if (name?.trim() && name.trim() !== currentName) {
      updateConcept(id, name.trim())
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuesto</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentProject.name} — {items.length} líneas — Total: {formatCurrency(grandTotal)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleAddCategory}>
            <Plus size={16} /> Categoría
          </Button>
          <Button variant="secondary" onClick={() => openNewItem()}>
            <Plus size={16} /> Item
          </Button>
          <Button onClick={() => setShowImport(true)}>
            <Upload size={16} /> Importar Excel
          </Button>
        </div>
      </div>

      <Card>
        {items.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={FileSpreadsheet}
              title="Sin presupuesto"
              description="Importa un archivo Excel o agrega items manualmente"
              action={
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => openNewItem()}>
                    <Plus size={16} /> Agregar Item
                  </Button>
                  <Button onClick={() => setShowImport(true)}>
                    <Upload size={16} /> Importar Excel
                  </Button>
                </div>
              }
            />
          </CardBody>
        ) : (
          <BudgetTable
            grouped={grouped}
            grandTotal={grandTotal}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={openNewItem}
            onAddConcept={handleAddConcept}
            onEditCategory={handleEditCategory}
            onEditConcept={handleEditConcept}
          />
        )}
      </Card>

      {showImport && (
        <BudgetImport
          onClose={() => setShowImport(false)}
          onImported={(count) => { refresh(); }}
        />
      )}

      {showItemForm && (
        <BudgetItemForm
          item={itemToEdit}
          grouped={grouped}
          preSelectedCategoryId={preSelectedCategoryId}
          preSelectedConceptId={preSelectedConceptId}
          onClose={() => setShowItemForm(false)}
          onSave={handleSaveItem}
          onAddCategory={addCategory}
          onAddConcept={addConcept}
        />
      )}
    </div>
  )
}
