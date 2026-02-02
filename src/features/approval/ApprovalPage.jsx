import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useProject } from '../../hooks/useProjectContext'
import { useApproval } from './useApproval'
import Card, { CardHeader, CardBody } from '../../components/Card'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatCurrency, formatDateShort, formatRemesaNumber } from '../../lib/formatters'
import { CheckCircle, Check, X, Save, Download } from 'lucide-react'
import { DEMO_REMESAS_ALL, DEMO_REMESA_ITEMS_ALL, persistDemoData } from '../../lib/demoData'
import { numberToWords, formatDate } from '../../lib/formatters'
import * as XLSX from 'xlsx-js-style'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export default function ApprovalPage() {
  const { currentProject } = useProject()
  const [remesas, setRemesas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRemesa, setSelectedRemesa] = useState(null)
  const [items, setItems] = useState([])
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const { approveItem, unapproveItem, updateRemesaStatus } = useApproval()
  const navigate = useNavigate()
  // Keep a ref to the modified items for saving in demo mode
  const modifiedItemsRef = useRef({})

  useEffect(() => {
    if (currentProject?.id) fetchRemesas()
  }, [currentProject?.id])

  async function fetchRemesas() {
    setLoading(true)

    if (DEMO_MODE) {
      const filtered = DEMO_REMESAS_ALL.filter(r => r.project_id === currentProject.id && ['enviada', 'pagada_parcial'].includes(r.status))
      setRemesas(filtered)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('remesas')
      .select('*, profiles:created_by(full_name)')
      .eq('project_id', currentProject.id)
      .in('status', ['enviada', 'pagada_parcial'])
      .order('remesa_number', { ascending: false })
    setRemesas(data || [])
    setLoading(false)
  }

  async function loadItems(remesa) {
    setSelectedRemesa(remesa)

    if (DEMO_MODE) {
      setItems(DEMO_REMESA_ITEMS_ALL.filter(i => i.remesa_id === remesa.id))
      return
    }

    const { data } = await supabase
      .from('remesa_items')
      .select('*, categories:category_id(name), concepts:concept_id(name)')
      .eq('remesa_id', remesa.id)
      .order('section')
      .order('line_number')
    setItems((data || []).map(item => ({
      ...item,
      category_name: item.category_name || item.categories?.name || '',
      concept_name: item.concept_name || item.concepts?.name || '',
    })))
  }

  function persistDemoApproval(updatedItems) {
    // Persist items to global array
    updatedItems.forEach(item => {
      const idx = DEMO_REMESA_ITEMS_ALL.findIndex(i => i.id === item.id)
      if (idx >= 0) {
        DEMO_REMESA_ITEMS_ALL[idx].is_approved = item.is_approved
        DEMO_REMESA_ITEMS_ALL[idx].approved_at = item.approved_at
        DEMO_REMESA_ITEMS_ALL[idx].approved_by = item.approved_by
      }
    })
    // Update remesa status
    const allApproved = updatedItems.every(i => i.is_approved)
    const someApproved = updatedItems.some(i => i.is_approved)
    const newStatus = allApproved ? 'pagada' : someApproved ? 'pagada_parcial' : 'enviada'
    const remIdx = DEMO_REMESAS_ALL.findIndex(r => r.id === selectedRemesa.id)
    if (remIdx >= 0) {
      DEMO_REMESAS_ALL[remIdx].status = newStatus
    }
    persistDemoData()
    setSelectedRemesa(prev => prev ? { ...prev, status: newStatus } : prev)
    setRemesas(DEMO_REMESAS_ALL.filter(r => r.project_id === currentProject.id && ['enviada', 'pagada_parcial'].includes(r.status)))
  }

  async function handleApprove(item) {
    if (DEMO_MODE) {
      const updatedItems = items.map(i => i.id === item.id ? { ...i, is_approved: true, approved_at: paymentDate, approved_by: 'demo-user' } : i)
      setItems(updatedItems)
      persistDemoApproval(updatedItems)
      return
    }
    await approveItem(item.id, paymentDate)
    await updateRemesaStatus(selectedRemesa.id)
    await loadItems(selectedRemesa)
    await fetchRemesas()
  }

  async function handleUnapprove(item) {
    if (DEMO_MODE) {
      const updatedItems = items.map(i => i.id === item.id ? { ...i, is_approved: false, approved_at: null, approved_by: null } : i)
      setItems(updatedItems)
      persistDemoApproval(updatedItems)
      return
    }
    await unapproveItem(item.id)
    await updateRemesaStatus(selectedRemesa.id)
    await loadItems(selectedRemesa)
    await fetchRemesas()
  }

  async function handleApproveAll() {
    if (DEMO_MODE) {
      const updatedItems = items.map(i => ({ ...i, is_approved: true, approved_at: paymentDate, approved_by: 'demo-user' }))
      setItems(updatedItems)
      persistDemoApproval(updatedItems)
      return
    }
    const pending = items.filter(i => !i.is_approved)
    for (const item of pending) {
      await approveItem(item.id, paymentDate)
    }
    await updateRemesaStatus(selectedRemesa.id)
    await loadItems(selectedRemesa)
    await fetchRemesas()
  }

  function handleDownloadExcel(e) {
    e.stopPropagation()
    e.preventDefault()
    if (!selectedRemesa) return
    try {
      let project = { name: currentProject?.name }
      if (DEMO_MODE) {
        const demoProjects = [
          { id: 'demo-p1', owner_name: 'Alfredo Isón Zaga' },
          { id: 'demo-p2', owner_name: 'Carlos Mendez' },
        ]
        const found = demoProjects.find(p => p.id === currentProject?.id)
        if (found) project.owner_name = found.owner_name
      }

      const sectionA = items
        .filter(i => i.section === 1 || i.section === 'A' || (i.payment_type && i.payment_type.toLowerCase().includes('transferencia')))
        .sort((a, b) => (a.line_number || 0) - (b.line_number || 0))
      const sectionB = items
        .filter(i => i.section === 2 || i.section === 'B' || (i.payment_type && (i.payment_type.toLowerCase().includes('cheque') || i.payment_type.toLowerCase().includes('efectivo'))))
        .sort((a, b) => (a.line_number || 0) - (b.line_number || 0))
      const sectionAIds = new Set(sectionA.map(i => i.id))
      const dedupedB = sectionB.filter(i => !sectionAIds.has(i.id))

      // Style definitions
      const font10 = { name: 'Calibri', sz: 10 }
      const fontBold10 = { name: 'Calibri', sz: 10, bold: true }
      const fontBold14 = { name: 'Calibri', sz: 14, bold: true }
      const fontBold18 = { name: 'Calibri', sz: 18, bold: true }
      const fontWhiteBold = { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } }
      const borderThin = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      const alignLeft = { vertical: 'center', horizontal: 'left' }
      const alignRight = { vertical: 'center', horizontal: 'right' }
      const alignCenter = { vertical: 'center', horizontal: 'center' }
      const moneyFmt = '$#,##0.00'
      const fillGreenDark = { fgColor: { rgb: '1B4332' } }
      const fillGreenLight = { fgColor: { rgb: 'D4EDDA' } }
      const fillYellow = { fgColor: { rgb: 'FFF3CD' } }
      const fillGray = { fgColor: { rgb: 'E8E8E8' } }

      const rows = []
      let r = 0

      // Helper to build a cell with style
      const cell = (v, s) => ({ v, t: typeof v === 'number' ? 'n' : 's', s })
      const emptyCell = (s) => ({ v: '', t: 's', s })

      // Row 0: empty
      rows.push([]); r++

      // Row 1: Project name + REMESA
      const row1 = new Array(11).fill(null).map(() => emptyCell({}))
      row1[1] = cell(project?.name || '', { font: fontBold14, alignment: alignLeft })
      row1[10] = cell('REMESA', { font: fontBold18, alignment: { vertical: 'center', horizontal: 'right' } })
      rows.push(row1); r++

      // Row 2: Propietario + number
      const row2 = new Array(11).fill(null).map(() => emptyCell({}))
      row2[1] = cell('Propietario:', { font: fontBold10, alignment: alignLeft })
      row2[2] = cell(project?.owner_name || '', { font: font10, alignment: alignLeft })
      row2[10] = cell(`${String(selectedRemesa.remesa_number).padStart(2, '0')}  ${selectedRemesa.remesa_suffix}`, { font: fontBold14, alignment: { vertical: 'center', horizontal: 'right' } })
      rows.push(row2); r++

      // Row 3: Fecha
      const row3 = new Array(11).fill(null).map(() => emptyCell({}))
      row3[1] = cell('Fecha:', { font: fontBold10, alignment: alignLeft })
      row3[2] = cell(selectedRemesa.date ? formatDate(selectedRemesa.date) : '', { font: font10, alignment: alignLeft })
      rows.push(row3); r++

      // Row 4: Semana
      const row4 = new Array(11).fill(null).map(() => emptyCell({}))
      row4[1] = cell('Semana:', { font: fontBold10, alignment: alignLeft })
      row4[2] = cell(selectedRemesa.week_description || '', { font: font10, alignment: alignLeft })
      rows.push(row4); r++

      // Row 5: empty
      rows.push([]); r++

      // Row 6: Column headers
      const headerStyle = { font: fontWhiteBold, fill: fillGreenDark, alignment: alignCenter, border: borderThin }
      const headerRightStyle = { ...headerStyle, alignment: { ...alignCenter, horizontal: 'center' } }
      rows.push([
        cell('#', headerStyle),
        cell('CATEGORÍA', headerStyle),
        cell('CONCEPTO', headerStyle),
        cell('NOMBRE CONTRATISTA', headerStyle),
        cell('PARTIDA', headerStyle),
        cell('IMPORTE', headerRightStyle),
        cell('IVA', headerRightStyle),
        cell('TOTAL', headerRightStyle),
        cell('BANCO', headerStyle),
        cell('No. DE CUENTA', headerStyle),
        cell('CLABE', headerStyle),
      ]); r++

      // Row 7: empty
      rows.push([]); r++

      // Section A header
      const sectionAStyle = { font: fontBold10, fill: fillGreenLight, alignment: alignLeft, border: borderThin }
      const sectionARow = new Array(11).fill(null).map(() => emptyCell({ fill: fillGreenLight, border: borderThin }))
      sectionARow[0] = cell('A', sectionAStyle)
      sectionARow[1] = cell('TRANSFERENCIAS BANCARIAS A NOMBRE DE:', sectionAStyle)
      rows.push(sectionARow); r++

      // Section A items
      const dataStyle = { font: font10, alignment: alignLeft, border: borderThin }
      const moneyStyle = { font: font10, alignment: alignRight, border: borderThin, numFmt: moneyFmt }

      let totalAmountA = 0, totalIvaA = 0, totalTotalA = 0
      sectionA.forEach((item, idx) => {
        const amt = Number(item.amount) || 0
        const iva = Number(item.iva_amount || item.vat_amount) || 0
        const tot = Number(item.total) || 0
        totalAmountA += amt; totalIvaA += iva; totalTotalA += tot
        rows.push([
          cell(`A.${String(idx + 1).padStart(2, '0')}`, { font: font10, alignment: alignCenter, border: borderThin }),
          cell(item.category_name || '', dataStyle),
          cell(item.concept_name || '', dataStyle),
          cell(item.contractor_name || '', dataStyle),
          cell(item.description || '', dataStyle),
          cell(amt, moneyStyle),
          cell(iva, moneyStyle),
          cell(tot, moneyStyle),
          cell(item.bank || '', dataStyle),
          cell(item.account || item.account_number || '', dataStyle),
          cell(item.clabe || '', dataStyle),
        ]); r++
      })

      // Section A total
      const totalRowStyle = { font: fontBold10, fill: fillGray, alignment: alignRight, border: borderThin, numFmt: moneyFmt }
      const totalLabelStyle = { font: fontBold10, fill: fillGray, alignment: alignRight, border: borderThin }
      const totalEmptyStyle = { fill: fillGray, border: borderThin }
      const totalARow = new Array(11).fill(null).map(() => emptyCell(totalEmptyStyle))
      totalARow[4] = cell('TOTAL:', totalLabelStyle)
      totalARow[5] = cell(totalAmountA, totalRowStyle)
      totalARow[6] = cell(totalIvaA, totalRowStyle)
      totalARow[7] = cell(totalTotalA, totalRowStyle)
      rows.push(totalARow); r++

      // Empty row
      rows.push([]); r++

      // Section B header
      const sectionBStyle = { font: fontBold10, fill: fillYellow, alignment: alignLeft, border: borderThin }
      const sectionBRow = new Array(11).fill(null).map(() => emptyCell({ fill: fillYellow, border: borderThin }))
      sectionBRow[0] = cell('B', sectionBStyle)
      sectionBRow[1] = cell('CHEQUE NOMINAL O EFECTIVO', sectionBStyle)
      rows.push(sectionBRow); r++

      // Section B items
      let totalAmountB = 0, totalIvaB = 0, totalTotalB = 0
      dedupedB.forEach((item, idx) => {
        const amt = Number(item.amount) || 0
        const iva = Number(item.iva_amount || item.vat_amount) || 0
        const tot = Number(item.total) || 0
        totalAmountB += amt; totalIvaB += iva; totalTotalB += tot
        rows.push([
          cell(`B.${String(idx + 1).padStart(2, '0')}`, { font: font10, alignment: alignCenter, border: borderThin }),
          cell(item.category_name || '', dataStyle),
          cell(item.concept_name || '', dataStyle),
          cell(item.contractor_name || '', dataStyle),
          cell(item.description || '', dataStyle),
          cell(amt, moneyStyle),
          cell(iva, moneyStyle),
          cell(tot, moneyStyle),
          cell(item.bank || '', dataStyle),
          cell(item.account || item.account_number || '', dataStyle),
          cell(item.clabe || '', dataStyle),
        ]); r++
      })

      // Section B total
      const totalBRow = new Array(11).fill(null).map(() => emptyCell(totalEmptyStyle))
      totalBRow[4] = cell('TOTAL:', totalLabelStyle)
      totalBRow[5] = cell(totalAmountB, totalRowStyle)
      totalBRow[6] = cell(totalIvaB, totalRowStyle)
      totalBRow[7] = cell(totalTotalB, totalRowStyle)
      rows.push(totalBRow); r++

      // Empty row
      rows.push([]); r++

      // Grand total
      const grandTotalStyle = { font: fontWhiteBold, fill: fillGreenDark, alignment: alignRight, border: borderThin, numFmt: moneyFmt }
      const grandLabelStyle = { font: fontWhiteBold, fill: fillGreenDark, alignment: alignRight, border: borderThin }
      const grandEmptyStyle = { font: fontWhiteBold, fill: fillGreenDark, border: borderThin }
      const grandRow = new Array(11).fill(null).map(() => emptyCell(grandEmptyStyle))
      grandRow[4] = cell('TOTAL:', grandLabelStyle)
      grandRow[5] = cell(totalAmountA + totalAmountB, grandTotalStyle)
      grandRow[6] = cell(totalIvaA + totalIvaB, grandTotalStyle)
      grandRow[7] = cell(totalTotalA + totalTotalB, grandTotalStyle)
      rows.push(grandRow); r++

      // Amount in words
      const grandTotal = totalTotalA + totalTotalB
      const wordsRow = new Array(11).fill(null).map(() => emptyCell({}))
      wordsRow[4] = cell(`( ${numberToWords(grandTotal).toLowerCase()} )`, { font: { name: 'Calibri', sz: 9, italic: true }, alignment: alignLeft })
      rows.push(wordsRow); r++

      // Empty rows
      rows.push([]); r++
      rows.push([]); r++

      // Signatures
      const sigRow = new Array(11).fill(null).map(() => emptyCell({}))
      sigRow[1] = cell('AUTORIZA', { font: fontBold10, alignment: alignCenter })
      sigRow[9] = cell('ELABORA', { font: fontBold10, alignment: alignCenter })
      rows.push(sigRow); r++
      rows.push([]); r++
      rows.push([]); r++

      const lineRow = new Array(11).fill(null).map(() => emptyCell({}))
      lineRow[1] = cell('____________________________', { font: font10, alignment: alignCenter })
      lineRow[9] = cell('____________________________', { font: font10, alignment: alignCenter })
      rows.push(lineRow); r++

      const nameRow = new Array(11).fill(null).map(() => emptyCell({}))
      nameRow[1] = cell(project?.owner_name || '', { font: font10, alignment: alignCenter })
      rows.push(nameRow); r++

      // Build worksheet from array of arrays of cell objects
      const ws = XLSX.utils.aoa_to_sheet(rows)

      // Column widths
      ws['!cols'] = [
        { wch: 6 },   // #
        { wch: 22 },  // CATEGORÍA
        { wch: 22 },  // CONCEPTO
        { wch: 35 },  // NOMBRE CONTRATISTA
        { wch: 45 },  // PARTIDA
        { wch: 15 },  // IMPORTE
        { wch: 10 },  // IVA
        { wch: 15 },  // TOTAL
        { wch: 18 },  // BANCO
        { wch: 20 },  // No. DE CUENTA
        { wch: 28 },  // CLABE
      ]

      const sheetName = `Remesa ${String(selectedRemesa.remesa_number).padStart(2, '0')} ${selectedRemesa.remesa_suffix}`
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))

      const num = String(selectedRemesa.remesa_number).padStart(2, '0')
      const suffix = selectedRemesa.remesa_suffix || 'MN'
      XLSX.writeFile(wb, `Remesa_${num}_${suffix}.xlsx`)
    } catch (err) {
      alert('Error al generar Excel: ' + err.message)
    }
  }

  async function handleSave() {
    if (!selectedRemesa) return
    setSaving(true)

    if (DEMO_MODE) {
      // Already persisted on each action, just refresh the list
      persistDemoApproval(items)
      setDirty(false)
      setSaving(false)
      return
    }

    // Non-demo: already saved per-action, just update status
    await updateRemesaStatus(selectedRemesa.id)
    await fetchRemesas()
    setDirty(false)
    setSaving(false)
  }

  if (!currentProject) {
    return <EmptyState icon={CheckCircle} title="Selecciona un proyecto" description="Elige un proyecto para aprobar remesas" />
  }

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Aprobación de Remesas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: List of remesas */}
        <div className="space-y-3">
          <p className="text-sm text-gray-500 font-medium">Remesas pendientes ({remesas.length})</p>
          {remesas.length === 0 && (
            <p className="text-sm text-gray-400 py-8 text-center">Sin remesas pendientes</p>
          )}
          {remesas.map(r => (
            <Card
              key={r.id}
              className={`cursor-pointer transition-colors ${selectedRemesa?.id === r.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => loadItems(r)}
            >
              <CardBody className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{formatRemesaNumber(r.remesa_number, r.remesa_suffix)}</p>
                    <p className="text-xs text-gray-500">{formatDateShort(r.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(r.total_amount)}</p>
                    <Badge status={r.status} />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Right: Items detail */}
        <div className="lg:col-span-2">
          {!selectedRemesa ? (
            <Card>
              <CardBody>
                <div className="text-center py-12 text-gray-500">
                  Selecciona una remesa para aprobar sus líneas
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    {formatRemesaNumber(selectedRemesa.remesa_number, selectedRemesa.remesa_suffix)}
                  </h3>
                  <p className="text-xs text-gray-500">{formatDateShort(selectedRemesa.date)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300"
                  />
                  <Button size="sm" variant="secondary" onClick={handleDownloadExcel}>
                    <Download size={14} /> Excel
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleApproveAll}>
                    <Check size={14} /> Aprobar Todas
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
                    <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2 text-left w-16">#</th>
                      <th className="px-3 py-2 text-left">Contratista</th>
                      <th className="px-3 py-2 text-left">Partida</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-center w-24">Estado</th>
                      <th className="px-3 py-2 text-center w-24">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id} className={`border-b border-gray-50 ${item.is_approved ? 'bg-success-light/30' : ''}`}>
                        <td className="px-3 py-2 text-gray-400">
                          {item.section}.{String(item.line_number).padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2">{item.contractor_name || '—'}</td>
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                        <td className="px-3 py-2 text-center">
                          {item.is_approved ? (
                            <Badge variant="success">Pagada</Badge>
                          ) : (
                            <Badge variant="warning">Pendiente</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.is_approved ? (
                            <button
                              onClick={() => handleUnapprove(item)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-danger"
                              title="Desaprobar"
                            >
                              <X size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(item)}
                              className="p-1.5 hover:bg-green-50 rounded-lg text-success"
                              title="Aprobar"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
