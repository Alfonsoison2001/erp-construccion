import { exportRemesaToExcel } from '../../lib/excelUtils'
import Button from '../../components/Button'
import { Download } from 'lucide-react'

export default function RemesaExport({ remesa, items, getBudgetInfo }) {
  const handleExport = () => {
    const project = remesa.projects || { name: '', owner_name: '' }
    exportRemesaToExcel(remesa, items, project, getBudgetInfo)
  }

  return (
    <Button variant="secondary" onClick={handleExport}>
      <Download size={16} /> Exportar Excel
    </Button>
  )
}
