import { useState, useMemo } from 'react'
import { useProject } from '../../hooks/useProjectContext'
import { useProveedores } from './useProveedores'
import { formatCurrency, formatDateShort, formatRemesaNumber } from '../../lib/formatters'
import Card, { CardHeader, CardBody } from '../../components/Card'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Search, ChevronDown, ChevronRight, Users } from 'lucide-react'

export default function ProveedoresPage() {
  const { currentProject } = useProject()
  const { proveedores, loading } = useProveedores(currentProject?.id)
  const [search, setSearch] = useState('')
  const [expandedRows, setExpandedRows] = useState({})

  const filtered = useMemo(() => {
    if (!search.trim()) return proveedores
    const term = search.toLowerCase()
    return proveedores.filter(p => p.contractor_name.toLowerCase().includes(term))
  }, [proveedores, search])

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, p) => ({
        amount: acc.amount + p.amount,
        vat_amount: acc.vat_amount + p.vat_amount,
        total: acc.total + p.total,
        count: acc.count + p.count,
      }),
      { amount: 0, vat_amount: 0, total: 0, count: 0 }
    )
  }, [filtered])

  const toggleRow = (name) => {
    setExpandedRows(prev => ({ ...prev, [name]: !prev[name] }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pagos aprobados por proveedor — {currentProject?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors text-sm"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No se encontraron proveedores</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"># Pagos</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pagado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => {
                    const isExpanded = expandedRows[p.contractor_name]
                    return (
                      <ProveedorRow
                        key={p.contractor_name}
                        proveedor={p}
                        isExpanded={isExpanded}
                        onToggle={() => toggleRow(p.contractor_name)}
                      />
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-sm">Total ({filtered.length} proveedores)</td>
                    <td className="px-4 py-3 text-sm text-right">{totals.count}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(totals.amount)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(totals.vat_amount)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(totals.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function ProveedorRow({ proveedor, isExpanded, onToggle }) {
  const { contractor_name, count, amount, vat_amount, total, items } = proveedor

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <td className="px-4 py-3 text-sm text-gray-400">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">{contractor_name}</td>
        <td className="px-4 py-3 text-sm text-right text-gray-600">{count}</td>
        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(amount)}</td>
        <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(vat_amount)}</td>
        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(total)}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-0 py-0">
            <div className="bg-gray-50 border-y border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase">Descripción</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Remesa</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Fecha</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Monto</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">IVA</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="px-6 py-2 text-sm text-gray-600">{item.description}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {item.remesa_number != null
                          ? formatRemesaNumber(item.remesa_number, item.remesa_suffix)
                          : '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {item.remesa_date ? formatDateShort(item.remesa_date) : item.approved_at ? formatDateShort(item.approved_at) : '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-600">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-600">{formatCurrency(item.vat_amount || item.iva_amount)}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-600">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
