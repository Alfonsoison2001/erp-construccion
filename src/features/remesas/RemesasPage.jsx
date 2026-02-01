import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRemesas } from './useRemesas'
import { useProject } from '../../hooks/useProjectContext'
import Card, { CardBody } from '../../components/Card'
import Table from '../../components/Table'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import { formatCurrency, formatDateShort, formatRemesaNumber } from '../../lib/formatters'
import { parseRemesaExcel } from '../../lib/excelUtils'
import { Plus, Receipt, Upload, Trash2 } from 'lucide-react'
import { DEMO_REMESAS_ALL, DEMO_REMESA_ITEMS_ALL, persistDemoData } from '../../lib/demoData'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export default function RemesasPage() {
  const { currentProject } = useProject()
  const { remesas, loading, deleteRemesa, refresh } = useRemesas(currentProject?.id)
  const [statusFilter, setStatusFilter] = useState('all')
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState(null)
  const [importError, setImportError] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const processFile = useCallback(async (file) => {
    if (!file) return
    setImportError(null)
    setImporting(true)

    try {
      const parsed = await parseRemesaExcel(file)
      setImportPreview(parsed)
    } catch (err) {
      setImportError(err.message)
    }
    setImporting(false)
  }, [])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    processFile(file)
  }, [processFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file)
    } else {
      setImportError('Solo se aceptan archivos .xlsx o .xls')
    }
  }, [processFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  async function handleConfirmImport() {
    if (!importPreview) return
    setImporting(true)

    try {
      const ts = Date.now()
      const remesaId = 'rem-import-' + ts

      const newRemesa = {
        id: remesaId,
        project_id: currentProject.id,
        remesa_number: importPreview.remesa_number,
        remesa_suffix: importPreview.remesa_suffix,
        date: importPreview.date,
        week_description: importPreview.week_description,
        total_amount: importPreview.total_amount,
        status: 'borrador',
        created_by: 'demo-user',
        profiles: { full_name: 'Admin Demo' },
      }

      const newItems = importPreview.items.map((item, idx) => {
        const sectionItems = importPreview.items.filter(
          (it, j) => j <= idx && it.section === item.section
        )
        return {
          ...item,
          id: `ri-import-${ts}-${idx}`,
          remesa_id: remesaId,
          line_number: sectionItems.length,
          is_approved: false,
          approved_at: null,
          approved_by: null,
        }
      })

      if (DEMO_MODE) {
        DEMO_REMESAS_ALL.push(newRemesa)
        DEMO_REMESA_ITEMS_ALL.push(...newItems)
        persistDemoData()
      }

      setImportPreview(null)
      setImportError(null)
      setShowImportModal(false)
      setImporting(false)
      navigate(`/remesas/${remesaId}/editar`)
    } catch (err) {
      setImportError('Error al importar: ' + err.message)
      setImporting(false)
    }
  }

  async function handleDeleteRemesa() {
    if (!deleteConfirm) return
    try {
      await deleteRemesa(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Error al borrar remesa:', err)
    }
  }

  if (!currentProject) {
    return (
      <EmptyState
        icon={Receipt}
        title="Selecciona un proyecto"
        description="Elige un proyecto para ver sus remesas"
      />
    )
  }

  const filtered = statusFilter === 'all'
    ? remesas
    : remesas.filter(r => r.status === statusFilter)

  const columns = [
    { key: 'number', label: '#', render: (r) => (
      <span className="font-medium">{formatRemesaNumber(r.remesa_number, r.remesa_suffix)}</span>
    )},
    { key: 'date', label: 'Fecha', render: (r) => formatDateShort(r.date) },
    { key: 'week_description', label: 'Semana' },
    { key: 'total_amount', label: 'Total', className: 'text-right', render: (r) => (
      <span className="font-medium">{formatCurrency(r.total_amount)}</span>
    )},
    { key: 'status', label: 'Estado', render: (r) => <Badge status={r.status} /> },
    { key: 'created_by', label: 'Creada por', render: (r) => r.profiles?.full_name },
    { key: 'actions', label: '', className: 'w-12', render: (r) => (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(r) }}
        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-danger transition-colors"
        title="Borrar remesa"
      >
        <Trash2 size={16} />
      </button>
    )},
  ]

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Remesas</h1>
          <p className="text-sm text-gray-500 mt-1">{currentProject.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setShowImportModal(true); setImportPreview(null); setImportError(null) }}>
            <Upload size={16} /> Importar Excel
          </Button>
          <Button onClick={() => navigate('/remesas/nueva')}>
            <Plus size={16} /> Nueva Remesa
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { value: 'all', label: 'Todas' },
          { value: 'borrador', label: 'Borrador' },
          { value: 'enviada', label: 'Enviadas' },
          { value: 'pagada_parcial', label: 'Parciales' },
          { value: 'pagada', label: 'Pagadas' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={Receipt}
              title="Sin remesas"
              description="Crea una nueva remesa para este proyecto"
              action={
                <Button onClick={() => navigate('/remesas/nueva')}>
                  <Plus size={16} /> Nueva Remesa
                </Button>
              }
            />
          </CardBody>
        ) : (
          <Table
            columns={columns}
            data={filtered}
            onRowClick={(r) => navigate(`/remesas/${r.id}`)}
          />
        )}
      </Card>

      {/* Import modal with drag & drop */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportPreview(null); setImportError(null) }}
        title="Importar Remesa desde Excel"
        size="lg"
      >
        {importError && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {importError}
          </div>
        )}

        {!importPreview && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
            >
              <Upload size={40} className={`mx-auto mb-3 ${dragOver ? 'text-primary' : 'text-gray-400'}`} />
              {importing ? (
                <p className="text-sm text-gray-600">Leyendo archivo...</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">
                    Arrastra un archivo Excel aquí
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    o haz clic para seleccionar (.xlsx, .xls)
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {importPreview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Remesa:</span>{' '}
                <span className="font-medium">
                  {formatRemesaNumber(importPreview.remesa_number, importPreview.remesa_suffix)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Fecha:</span>{' '}
                <span className="font-medium">{importPreview.date}</span>
              </div>
              <div>
                <span className="text-gray-500">Semana:</span>{' '}
                <span className="font-medium">{importPreview.week_description || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Total:</span>{' '}
                <span className="font-medium">{formatCurrency(importPreview.total_amount)}</span>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-gray-50 border-b">
                    <th className="px-2 py-1.5 text-left">#</th>
                    <th className="px-2 py-1.5 text-left">Contratista</th>
                    <th className="px-2 py-1.5 text-left">Partida</th>
                    <th className="px-2 py-1.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.items.map((item, idx) => {
                    const sectionLetter = item.section === 1 ? 'A' : 'B'
                    const sectionItems = importPreview.items
                      .slice(0, idx + 1)
                      .filter(it => it.section === item.section)
                    const lineNum = sectionItems.length
                    return (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="px-2 py-1 text-gray-400">
                          {sectionLetter}.{String(lineNum).padStart(2, '0')}
                        </td>
                        <td className="px-2 py-1">{item.contractor_name}</td>
                        <td className="px-2 py-1">{item.description}</td>
                        <td className="px-2 py-1 text-right font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-500">
              {importPreview.items.filter(i => i.section === 1).length} transferencia(s),{' '}
              {importPreview.items.filter(i => i.section === 2).length} cheque(s)/efectivo
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setImportPreview(null); setImportError(null) }}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirmImport} disabled={importing}>
                {importing ? 'Importando...' : 'Importar y Editar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Borrar Remesa"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas borrar la remesa{' '}
            <span className="font-semibold">
              {deleteConfirm && formatRemesaNumber(deleteConfirm.remesa_number, deleteConfirm.remesa_suffix)}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={handleDeleteRemesa}>
              <Trash2 size={16} /> Borrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
