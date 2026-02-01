import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRemesaDetail, useRemesas } from './useRemesas'
import { useProject } from '../../hooks/useProjectContext'
import RemesaExport from './RemesaExport'
import Card, { CardHeader, CardBody } from '../../components/Card'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatCurrency, formatDate, formatRemesaNumber } from '../../lib/formatters'
import { Pencil, ArrowLeft, CheckCircle, Trash2 } from 'lucide-react'

export default function RemesaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentProject } = useProject()
  const { remesa, items, loading } = useRemesaDetail(id)
  const { deleteRemesa } = useRemesas(currentProject?.id)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  if (!remesa) {
    return <div className="text-center py-12 text-gray-500">Remesa no encontrada</div>
  }

  const sectionA = items.filter(i => i.section === 'A' || i.section === 1)
  const sectionB = items.filter(i => i.section === 'B' || i.section === 2)
  const totalA = sectionA.reduce((sum, i) => sum + (Number(i.total) || 0), 0)
  const totalB = sectionB.reduce((sum, i) => sum + (Number(i.total) || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/remesas')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {formatRemesaNumber(remesa.remesa_number, remesa.remesa_suffix)}
              </h1>
              <Badge status={remesa.status} />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(remesa.date)} {remesa.week_description && `— ${remesa.week_description}`}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <RemesaExport remesa={remesa} items={items} />
          <Button variant="secondary" onClick={() => navigate(`/remesas/${id}/editar`)}>
            <Pencil size={16} /> Editar
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={16} /> Borrar
          </Button>
        </div>
      </div>

      {/* Section A */}
      <SectionCard title="A. Transferencias Bancarias" items={sectionA} total={totalA} section="A" />

      {/* Section B */}
      <SectionCard title="B. Cheques / Efectivo" items={sectionB} total={totalB} section="B" />

      {/* Total */}
      <Card className="mt-6">
        <CardBody>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total General</span>
            <span className="text-2xl font-bold">{formatCurrency(remesa.total_amount)}</span>
          </div>
        </CardBody>
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Borrar Remesa"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas borrar la remesa{' '}
            <span className="font-semibold">
              {formatRemesaNumber(remesa.remesa_number, remesa.remesa_suffix)}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={async () => {
                await deleteRemesa(remesa.id)
                navigate('/remesas')
              }}
            >
              <Trash2 size={16} /> Borrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SectionCard({ title, items, total, section }) {
  if (items.length === 0) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <h3 className="font-semibold">{title}</h3>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-2 text-left w-16">#</th>
              <th className="px-4 py-2 text-left">Categoría</th>
              <th className="px-4 py-2 text-left">Concepto</th>
              <th className="px-4 py-2 text-left">Contratista</th>
              <th className="px-4 py-2 text-left">Partida</th>
              <th className="px-4 py-2 text-right">Importe</th>
              <th className="px-4 py-2 text-right">IVA</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-left">Banco</th>
              <th className="px-4 py-2 text-center w-16">Pagada</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-400">
                  {section}.{String(idx + 1).padStart(2, '0')}
                </td>
                <td className="px-4 py-2">{item.category_name || '—'}</td>
                <td className="px-4 py-2">{item.concept_name || '—'}</td>
                <td className="px-4 py-2">{item.contractor_name || '—'}</td>
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(item.vat_amount)}</td>
                <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                <td className="px-4 py-2">{item.bank || '—'}</td>
                <td className="px-4 py-2 text-center">
                  {item.is_approved && <CheckCircle size={16} className="text-success mx-auto" />}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-medium">
              <td colSpan={7} className="px-4 py-2 text-right">Subtotal:</td>
              <td className="px-4 py-2 text-right">{formatCurrency(total)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}
