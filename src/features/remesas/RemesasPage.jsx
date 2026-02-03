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
import { parseRemesaExcel, parseRemesaHistoricoExcel } from '../../lib/excelUtils'
import { Plus, Receipt, Upload, Trash2, Database } from 'lucide-react'
import { DEMO_REMESAS_ALL, DEMO_REMESA_ITEMS_ALL, persistDemoData } from '../../lib/demoData'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export default function RemesasPage() {
  const { currentProject } = useProject()
  const { remesas, loading, deleteRemesa, bulkCreateRemesas, refresh } = useRemesas(currentProject?.id)
  const [statusFilter, setStatusFilter] = useState('all')
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState(null)
  const [importError, setImportError] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [bulkPreview, setBulkPreview] = useState(null)
  const [bulkError, setBulkError] = useState(null)
  const [bulkImporting, setBulkImporting] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 })
  const [bulkDragOver, setBulkDragOver] = useState(false)
  const [expandedRemesa, setExpandedRemesa] = useState(null)
  const fileInputRef = useRef(null)
  const bulkFileInputRef = useRef(null)
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

  const processBulkFile = useCallback(async (file) => {
    if (!file) return
    setBulkError(null)
    setBulkImporting(true)
    try {
      const parsed = await parseRemesaHistoricoExcel(file)
      setBulkPreview(parsed)
    } catch (err) {
      setBulkError(err.message)
    }
    setBulkImporting(false)
  }, [])

  const handleBulkFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = ''
    processBulkFile(file)
  }, [processBulkFile])

  const handleBulkDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setBulkDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processBulkFile(file)
    } else {
      setBulkError('Solo se aceptan archivos .xlsx o .xls')
    }
  }, [processBulkFile])

  const handleBulkDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setBulkDragOver(true)
  }, [])

  const handleBulkDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setBulkDragOver(false)
  }, [])

  async function handleConfirmBulkImport() {
    if (!bulkPreview || bulkPreview.length === 0) return
    setBulkImporting(true)
    setBulkProgress({ current: 0, total: bulkPreview.length })
    setBulkError(null)

    try {
      // Process in batches of 10 for progress feedback
      const batchSize = 10
      for (let i = 0; i < bulkPreview.length; i += batchSize) {
        const batch = bulkPreview.slice(i, i + batchSize)
        await bulkCreateRemesas(batch)
        setBulkProgress({ current: Math.min(i + batchSize, bulkPreview.length), total: bulkPreview.length })
      }

      setBulkPreview(null)
      setBulkError(null)
      setShowBulkImportModal(false)
      setBulkImporting(false)
      setBulkProgress({ current: 0, total: 0 })
      refresh()
    } catch (err) {
      setBulkError('Error al importar: ' + err.message)
      setBulkImporting(false)
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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Remesas</h1>
          <p className="text-sm text-gray-500 mt-1">{currentProject.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { setShowBulkImportModal(true); setBulkPreview(null); setBulkError(null) }}>
            <Database size={16} /> Importar Histórico
          </Button>
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

      {/* Bulk historic import modal */}
      <Modal
        isOpen={showBulkImportModal}
        onClose={() => { setShowBulkImportModal(false); setBulkPreview(null); setBulkError(null); setBulkImporting(false) }}
        title="Importar Histórico de Remesas"
        size="lg"
      >
        {bulkError && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {bulkError}
          </div>
        )}

        {!bulkPreview && !bulkImporting && (
          <div>
            <input
              ref={bulkFileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleBulkFileChange}
            />
            <div
              onClick={() => bulkFileInputRef.current?.click()}
              onDrop={handleBulkDrop}
              onDragOver={handleBulkDragOver}
              onDragLeave={handleBulkDragLeave}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                bulkDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
            >
              <Database size={40} className={`mx-auto mb-3 ${bulkDragOver ? 'text-primary' : 'text-gray-400'}`} />
              <p className="text-sm font-medium text-gray-700">
                Arrastra un archivo Excel con historial de remesas
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Formato tabla plana: una fila por item (.xlsx, .xls)
              </p>
            </div>
          </div>
        )}

        {!bulkPreview && bulkImporting && (
          <div className="flex flex-col items-center py-8">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 mt-3">Leyendo archivo...</p>
          </div>
        )}

        {bulkPreview && (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{bulkPreview.length}</p>
                <p className="text-xs text-blue-600">Remesas</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {bulkPreview.reduce((sum, r) => sum + r.items.length, 0)}
                </p>
                <p className="text-xs text-green-600">Items totales</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(bulkPreview.reduce((sum, r) => sum + (r.total_amount || 0), 0))}
                </p>
                <p className="text-xs text-purple-600">Monto total</p>
              </div>
            </div>

            {/* Remesa list */}
            <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              {bulkPreview.map((r, rIdx) => (
                <div key={rIdx} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setExpandedRemesa(expandedRemesa === rIdx ? null : rIdx)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {formatRemesaNumber(r.remesa_number, r.remesa_suffix)}
                      </span>
                      <span className="text-gray-500">{r.date}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {r.items.length} items
                      </span>
                    </div>
                    <span className="font-medium">{formatCurrency(r.total_amount)}</span>
                  </button>
                  {expandedRemesa === rIdx && (
                    <div className="bg-gray-50 px-3 pb-2">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="text-left py-1 px-1">Contratista</th>
                            <th className="text-left py-1 px-1">Partida</th>
                            <th className="text-left py-1 px-1">Categoría</th>
                            <th className="text-right py-1 px-1">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.items.map((item, iIdx) => (
                            <tr key={iIdx} className="border-t border-gray-200">
                              <td className="py-1 px-1">{item.contractor_name}</td>
                              <td className="py-1 px-1">{item.description}</td>
                              <td className="py-1 px-1 text-gray-500">{item.category_name}</td>
                              <td className="py-1 px-1 text-right font-medium">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {bulkImporting && bulkProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Importando remesas...</span>
                  <span>{bulkProgress.current} de {bulkProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500">
              Todas las remesas se importarán como "Pagada" con items aprobados.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setBulkPreview(null); setBulkError(null) }}
                disabled={bulkImporting}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirmBulkImport} disabled={bulkImporting}>
                {bulkImporting ? `Importando ${bulkProgress.current}/${bulkProgress.total}...` : `Importar ${bulkPreview.length} Remesas`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
