import { useState } from 'react'
import { useBudget } from './useBudget'
import { useProject } from '../../hooks/useProjectContext'
import BudgetTable from './BudgetTable'
import BudgetImport from './BudgetImport'
import Card, { CardHeader, CardBody } from '../../components/Card'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatCurrency } from '../../lib/formatters'
import { Upload, FileSpreadsheet } from 'lucide-react'

export default function BudgetPage() {
  const { currentProject } = useProject()
  const { items, grouped, grandTotal, loading, refresh } = useBudget(currentProject?.id)
  const [showImport, setShowImport] = useState(false)

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuesto</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentProject.name} — {items.length} líneas — Total: {formatCurrency(grandTotal)}
          </p>
        </div>
        <Button onClick={() => setShowImport(true)}>
          <Upload size={16} /> Importar Excel
        </Button>
      </div>

      <Card>
        {items.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={FileSpreadsheet}
              title="Sin presupuesto"
              description="Importa un archivo Excel (BD PPTO) para cargar el presupuesto"
              action={
                <Button onClick={() => setShowImport(true)}>
                  <Upload size={16} /> Importar Excel
                </Button>
              }
            />
          </CardBody>
        ) : (
          <BudgetTable grouped={grouped} grandTotal={grandTotal} />
        )}
      </Card>

      {showImport && (
        <BudgetImport
          onClose={() => setShowImport(false)}
          onImported={(count) => { refresh(); }}
        />
      )}
    </div>
  )
}
