import { useProject } from '../../hooks/useProjectContext'
import { useAuthContext } from '../auth/AuthContext'
import { useDashboard } from './useDashboard'
import BudgetVsPaid from './BudgetVsPaid'
import RemesaGrid from './RemesaGrid'
import Card, { CardBody } from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatCurrency, formatPercent } from '../../lib/formatters'
import { LayoutDashboard, DollarSign, TrendingUp, Clock } from 'lucide-react'

export default function DashboardPage() {
  const { currentProject } = useProject()
  const { isAdmin } = useAuthContext()
  const { categories, remesas, totalBudget, totalPaid, totalPending, loading } = useDashboard(currentProject?.id)

  if (!currentProject) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Selecciona un proyecto"
        description="Elige un proyecto en el menú superior para ver su dashboard"
      />
    )
  }

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  const progress = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-sm'} gap-4 mb-8`}>
        {isAdmin && (
          <SummaryCard
            icon={DollarSign}
            label="Presupuesto Total"
            value={formatCurrency(totalBudget)}
            color="primary"
          />
        )}
        <SummaryCard
          icon={TrendingUp}
          label="Total Pagado"
          value={formatCurrency(totalPaid)}
          subtitle={isAdmin ? formatPercent(progress) : undefined}
          color="success"
        />
        {isAdmin && (
          <SummaryCard
            icon={Clock}
            label="Pendiente"
            value={formatCurrency(totalPending)}
            subtitle={formatPercent(100 - progress)}
            color="warning"
          />
        )}
      </div>

      {/* Budget vs Paid table - admin sees full, residente sees only paid */}
      {categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isAdmin ? 'Presupuesto vs Pagado' : 'Pagado por Categoría'}
          </h2>
          <BudgetVsPaid categories={categories} totalBudget={totalBudget} totalPaid={totalPaid} isAdmin={isAdmin} />
        </div>
      )}

      {/* Remesas grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Remesas</h2>
        <RemesaGrid remesas={remesas} />
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, subtitle, color }) {
  const bgColors = {
    primary: 'bg-primary-light',
    success: 'bg-success-light',
    warning: 'bg-warning-light',
  }
  const iconColors = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${bgColors[color]}`}>
            <Icon size={20} className={iconColors[color]} />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
