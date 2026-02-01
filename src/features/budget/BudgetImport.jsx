import { useState, useRef } from 'react'
import { parseBudgetExcel } from '../../lib/excelUtils'
import { useBudget } from './useBudget'
import { useProject } from '../../hooks/useProjectContext'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import Table from '../../components/Table'
import { Upload, FileSpreadsheet } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'

export default function BudgetImport({ onClose, onImported }) {
  const { currentProject } = useProject()
  const { importBatch } = useBudget(currentProject?.id)
  const [parsedItems, setParsedItems] = useState([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef()

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setError('')
    try {
      const items = await parseBudgetExcel(file)
      setParsedItems(items)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleImport = async () => {
    if (!currentProject?.id) return setError('Selecciona un proyecto primero')
    setImporting(true)
    setError('')
    try {
      const count = await importBatch(parsedItems, currentProject.id)
      onImported?.(count)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  const previewCols = [
    { key: 'category', label: 'Categoría' },
    { key: 'concept', label: 'Concepto' },
    { key: 'detail', label: 'Detalle' },
    { key: 'unit', label: 'Unidad' },
    { key: 'quantity', label: 'Cantidad', className: 'text-right' },
    { key: 'total_mxn', label: 'Total MXN', className: 'text-right',
      render: (r) => formatCurrency(r.total_mxn)
    },
  ]

  return (
    <Modal isOpen onClose={onClose} title="Importar Presupuesto" size="xl">
      <div className="space-y-4">
        {error && (
          <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          {fileName ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet size={24} className="text-success" />
              <span className="font-medium">{fileName}</span>
              <span className="text-sm text-gray-500">({parsedItems.length} líneas)</span>
            </div>
          ) : (
            <>
              <Upload size={32} className="mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600">Click para seleccionar archivo Excel (BD PPTO)</p>
              <p className="text-xs text-gray-400 mt-1">Formato: Columnas B-R, datos desde fila 4</p>
            </>
          )}
        </div>

        {parsedItems.length > 0 && (
          <>
            <div className="text-sm text-gray-500">
              Vista previa ({parsedItems.length} líneas):
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <Table columns={previewCols} data={parsedItems.slice(0, 50)} />
            </div>
            {parsedItems.length > 50 && (
              <p className="text-xs text-gray-400">Mostrando primeras 50 de {parsedItems.length} líneas</p>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleImport}
            disabled={parsedItems.length === 0 || importing}
          >
            {importing ? 'Importando...' : `Importar ${parsedItems.length} líneas`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
