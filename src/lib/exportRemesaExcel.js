import * as XLSX from 'xlsx-js-style'
import { numberToWords, formatDate } from './formatters'

export function exportRemesaToExcelStyled(remesa, items, project) {
  const wb = XLSX.utils.book_new()

  const sectionA = items
    .filter(i => i.section === 1 || i.section === 'A' || (i.payment_type && i.payment_type.toLowerCase().includes('transferencia')))
    .sort((a, b) => (a.line_number || 0) - (b.line_number || 0))

  const sectionB = items
    .filter(i => i.section === 2 || i.section === 'B' || (i.payment_type && (i.payment_type.toLowerCase().includes('cheque') || i.payment_type.toLowerCase().includes('efectivo'))))
    .sort((a, b) => (a.line_number || 0) - (b.line_number || 0))

  // Deduplicate
  const sectionAIds = new Set(sectionA.map(i => i.id))
  const dedupedB = sectionB.filter(i => !sectionAIds.has(i.id))

  const rows = []

  // Row 0: empty
  rows.push([])
  // Row 1: Project name + REMESA label
  rows.push(['', project?.name || '', '', '', '', '', '', '', 'REMESA'])
  // Row 2: Propietario + Remesa number
  rows.push(['', 'Propietario:', project?.owner_name || '', '', '', '', '', '', `${String(remesa.remesa_number).padStart(2, '0')}  ${remesa.remesa_suffix}`])
  // Row 3: Fecha
  rows.push(['', 'Fecha:', remesa.date ? formatDate(remesa.date) : ''])
  // Row 4: Semana
  rows.push(['', 'Semana:', remesa.week_description || ''])
  // Row 5: empty
  rows.push([])

  // Row 6: Column headers
  rows.push(['#', 'NOMBRE CONTRATISTA', 'PARTIDA', 'IMPORTE', 'IVA', 'TOTAL', 'BANCO', 'CUENTA', 'CLABE'])
  // Row 7: empty (header row 2 for merge effect)
  rows.push([])

  // Row 8: separator
  rows.push([])

  // Section A header
  rows.push(['A', 'TRANSFERENCIAS BANCARIAS A NOMBRE DE:'])

  let totalAmountA = 0, totalIvaA = 0, totalTotalA = 0
  sectionA.forEach((item, idx) => {
    const amt = Number(item.amount) || 0
    const iva = Number(item.iva_amount || item.vat_amount) || 0
    const tot = Number(item.total) || 0
    totalAmountA += amt
    totalIvaA += iva
    totalTotalA += tot
    rows.push([
      `A.${String(idx + 1).padStart(2, '0')}`,
      item.contractor_name || '',
      item.description || '',
      amt,
      iva,
      tot,
      item.bank || '',
      item.account || item.account_number || '',
      item.clabe || '',
    ])
  })

  // Section A separator + total
  rows.push([])
  rows.push(['', '', 'TOTAL:', totalAmountA, totalIvaA, totalTotalA])

  // Space
  rows.push([])

  // Section B header
  rows.push(['B', 'CHEQUE NOMINAL O EFECTIVO'])

  let totalAmountB = 0, totalIvaB = 0, totalTotalB = 0
  dedupedB.forEach((item, idx) => {
    const amt = Number(item.amount) || 0
    const iva = Number(item.iva_amount || item.vat_amount) || 0
    const tot = Number(item.total) || 0
    totalAmountB += amt
    totalIvaB += iva
    totalTotalB += tot
    rows.push([
      `B.${String(idx + 1).padStart(2, '0')}`,
      item.contractor_name || '',
      item.description || '',
      amt,
      iva,
      tot,
      item.bank || '',
      item.account || item.account_number || '',
      item.clabe || '',
    ])
  })

  // Section B separator + total
  rows.push([])
  rows.push(['', '', 'TOTAL:', totalAmountB, totalIvaB, totalTotalB])

  // Space
  rows.push([])

  // Grand total
  const grandAmount = totalAmountA + totalAmountB
  const grandIva = totalIvaA + totalIvaB
  const grandTotal = totalTotalA + totalTotalB
  rows.push(['', '', 'TOTAL:', grandAmount, grandIva, grandTotal])

  // Amount in words
  rows.push(['', '', `( ${numberToWords(grandTotal).toLowerCase()} )`])

  // Space
  rows.push([])
  rows.push([])

  // Signatures
  rows.push(['', 'AUTORIZA', '', '', '', '', '', 'ELABORA'])
  rows.push([])
  rows.push([])
  rows.push(['', '____________________________', '', '', '', '', '', '____________________________'])
  rows.push(['', project?.owner_name || ''])

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },   // A: #
    { wch: 38 },  // B: NOMBRE CONTRATISTA
    { wch: 52 },  // C: PARTIDA
    { wch: 18 },  // D: IMPORTE
    { wch: 16 },  // E: IVA
    { wch: 18 },  // F: TOTAL
    { wch: 18 },  // G: BANCO
    { wch: 22 },  // H: CUENTA
    { wch: 28 },  // I: CLABE
  ]

  const sheetName = `Remesa ${String(remesa.remesa_number).padStart(2, '0')} ${remesa.remesa_suffix}`
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))

  const fileName = `Remesa No ${String(remesa.remesa_number).padStart(2, '0')} ${(project?.name || 'Obra').replace(/[#]/g, '')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
