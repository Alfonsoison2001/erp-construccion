import { useState } from 'react'
import Card from '../../components/Card'
import ProgressBar from '../../components/ProgressBar'
import { formatCurrency, formatPercent } from '../../lib/formatters'
import { ChevronDown, ChevronRight } from 'lucide-react'

export default function BudgetVsPaid({ categories, totalBudget, totalPaid }) {
  const [expanded, setExpanded] = useState({})

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Presupuesto</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pagado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pendiente</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase w-48">Avance</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const pending = cat.budget_total - cat.paid_total
              const pct = cat.budget_total > 0 ? (cat.paid_total / cat.budget_total) * 100 : 0
              const isExpanded = expanded[cat.category_id]

              return (
                <CategoryRow
                  key={cat.category_id}
                  cat={cat}
                  pending={pending}
                  pct={pct}
                  isExpanded={isExpanded}
                  onToggle={() => setExpanded(prev => ({ ...prev, [cat.category_id]: !prev[cat.category_id] }))}
                />
              )
            })}
            <tr className="bg-gray-50 font-semibold border-t-2">
              <td></td>
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right">{formatCurrency(totalBudget)}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(totalPaid)}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(totalBudget - totalPaid)}</td>
              <td className="px-4 py-3">
                <ProgressBar value={totalPaid} max={totalBudget} color="primary" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function CategoryRow({ cat, pending, pct, isExpanded, onToggle }) {
  return (
    <>
      <tr
        className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-2.5">
          {cat.concepts.length > 0 && (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </td>
        <td className="px-4 py-2.5 font-medium text-sm">{cat.category_name}</td>
        <td className="px-4 py-2.5 text-right text-sm">{formatCurrency(cat.budget_total)}</td>
        <td className="px-4 py-2.5 text-right text-sm">{formatCurrency(cat.paid_total)}</td>
        <td className="px-4 py-2.5 text-right text-sm">{formatCurrency(pending)}</td>
        <td className="px-4 py-2.5">
          <ProgressBar
            value={cat.paid_total}
            max={cat.budget_total}
            color={pct > 100 ? 'danger' : pct > 75 ? 'warning' : 'success'}
          />
        </td>
      </tr>
      {isExpanded && cat.concepts.map(con => {
        const conPending = con.budget_total - con.paid_total
        return (
          <tr key={con.concept_id} className="border-b border-gray-50 bg-gray-50/50">
            <td></td>
            <td className="px-4 py-2 pl-10 text-sm text-gray-600">{con.concept_name}</td>
            <td className="px-4 py-2 text-right text-sm text-gray-600">{formatCurrency(con.budget_total)}</td>
            <td className="px-4 py-2 text-right text-sm text-gray-600">{formatCurrency(con.paid_total)}</td>
            <td className="px-4 py-2 text-right text-sm text-gray-600">{formatCurrency(conPending)}</td>
            <td className="px-4 py-2">
              <ProgressBar value={con.paid_total} max={con.budget_total} color="success" />
            </td>
          </tr>
        )
      })}
    </>
  )
}
