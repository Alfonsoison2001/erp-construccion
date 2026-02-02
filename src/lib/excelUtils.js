import * as XLSX from 'xlsx-js-style'
import { numberToWords } from './formatters'

export function parseBudgetExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        // Data starts at row 4 (index 3), columns B-R (index 1-17)
        const items = []
        for (let i = 3; i < data.length; i++) {
          const row = data[i]
          if (!row || !row[1]) continue // Skip empty rows (col B = category)

          const category = String(row[1] || '').trim()
          if (!category) continue

          items.push({
            category: category,
            concept: String(row[2] || '').trim(),
            detail: String(row[3] || '').trim(),
            supplier: String(row[4] || '').trim(),
            unit: String(row[5] || '').trim(),
            quantity: parseFloat(row[6]) || 0,
            currency: String(row[7] || 'MXN').trim().toUpperCase(),
            unit_price: parseFloat(row[8]) || 0,
            subtotal: parseFloat(row[9]) || 0,
            surcharge_pct: parseFloat(row[10]) || 0,
            surcharge_amount: parseFloat(row[11]) || 0,
            vat_pct: parseFloat(row[12]) || 0,
            vat_amount: parseFloat(row[13]) || 0,
            total: parseFloat(row[14]) || 0,
            exchange_rate: parseFloat(row[15]) || 1,
            total_mxn: parseFloat(row[16]) || 0,
            notes: String(row[17] || '').trim(),
          })
        }

        resolve(items)
      } catch (err) {
        reject(new Error('Error al leer el archivo Excel: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsArrayBuffer(file)
  })
}

export function parseRemesaExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        // Parse header info
        // Row 1 (index 1): col 8 has "REMESA" label
        // Row 2 (index 2): col 8 has "38  MN" (number + suffix)
        const remesaNumStr = String(data[2]?.[8] || '').trim()
        const numMatch = remesaNumStr.match(/^(\d+)\s*(.*)$/)
        const remesaNumber = numMatch ? parseInt(numMatch[1], 10) : 0
        const remesaSuffix = numMatch ? (numMatch[2] || 'MN').trim() || 'MN' : 'MN'

        // Row 3 (index 3): date at col 2 (Excel serial number)
        let remesaDate = ''
        const rawDate = data[3]?.[2] || data[3]?.[1]
        if (rawDate instanceof Date) {
          remesaDate = rawDate.toISOString().split('T')[0]
        } else if (typeof rawDate === 'number') {
          const d = new Date((rawDate - 25569) * 86400 * 1000)
          remesaDate = d.toISOString().split('T')[0]
        } else if (typeof rawDate === 'string' && rawDate) {
          remesaDate = rawDate
        }

        // Row 4 (index 4): week description at col 2
        const weekDescription = String(data[4]?.[2] || data[4]?.[1] || '').trim()

        // Find sections by scanning for rows where col 0 is "A" or "B"
        let currentSection = null
        const items = []

        for (let i = 0; i < data.length; i++) {
          const row = data[i]
          if (!row) continue

          const col0 = String(row[0] || '').trim().toUpperCase()
          const col1 = String(row[1] || '').toUpperCase()

          // Detect section headers
          if (col0 === 'A' && (col1.includes('TRANSFERENCIA') || col1.includes('TRNSFERENCIA'))) {
            currentSection = 1
            continue
          }
          if (col0 === 'B' && (col1.includes('CHEQUE') || col1.includes('EFECTIVO'))) {
            currentSection = 2
            continue
          }

          // Skip if no section yet, or skip header/empty/total rows
          if (!currentSection) continue
          if (col0 === '#' || col0 === '') continue

          // Skip total rows
          const rowText = [row[1], row[2], row[3], row[4]].map(c => String(c || '').toUpperCase()).join(' ')
          if (rowText.includes('TOTAL')) continue

          // Check if this is an item row (col0 should be like A.01, B.02, etc.)
          if (!col0.match(/^[AB]\.?\d+/)) continue

          const contractorName = String(row[1] || '').trim()
          const description = String(row[2] || '').trim()
          const amount = parseFloat(row[3]) || 0
          const vatAmount = parseFloat(row[4]) || 0
          const total = parseFloat(row[5]) || 0
          const bank = String(row[6] || '').trim()
          const accountNumber = String(row[7] || '').trim()
          const clabe = String(row[8] || '').trim()

          if (!contractorName && !total) continue

          items.push({
            section: currentSection,
            contractor_name: contractorName,
            description: description,
            amount: amount,
            vat_amount: vatAmount,
            total: total || (amount + vatAmount),
            bank: bank,
            account_number: accountNumber,
            clabe: clabe,
            payment_type: currentSection === 1 ? 'transferencia' : 'cheque',
            category_name: 'Extras',
            concept_name: '',
          })
        }

        const totalAmount = items.reduce((sum, it) => sum + (it.total || 0), 0)

        resolve({
          remesa_number: remesaNumber,
          remesa_suffix: remesaSuffix,
          date: remesaDate || new Date().toISOString().split('T')[0],
          week_description: weekDescription,
          total_amount: totalAmount,
          items,
        })
      } catch (err) {
        reject(new Error('Error al leer el archivo Excel de remesa: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsArrayBuffer(file)
  })
}

export function exportRemesaToExcel(remesa, items, project) {
  const wb = XLSX.utils.book_new()

  const sectionA = items.filter(i => i.section === 'A').sort((a, b) => a.line_number - b.line_number)
  const sectionB = items.filter(i => i.section === 'B').sort((a, b) => a.line_number - b.line_number)

  const rows = []

  // Header
  rows.push([])
  rows.push(['', project?.name || ''])
  rows.push(['', project?.owner_name || '', '', '', '', '', '', `Remesa ${String(remesa.remesa_number).padStart(2, '0')} ${remesa.remesa_suffix}`])
  rows.push(['', '', '', '', '', '', '', remesa.date])
  rows.push(['', '', '', '', '', '', '', remesa.week_description || ''])
  rows.push([])

  // Column headers
  rows.push([
    '#', 'CATEGORÍA', 'CONCEPTO', 'NOMBRE CONTRATISTA', 'PARTIDA',
    'IMPORTE', 'IVA', 'TOTAL', 'TIPO DE PAGO', 'BANCO',
    'No. DE CUENTA', 'CLABE INTERBANCARIA', 'NOTAS'
  ])

  rows.push([])

  // Section A header
  rows.push(['', 'A. TRANSFERENCIAS BANCARIAS'])

  let totalA = 0
  sectionA.forEach((item, idx) => {
    totalA += Number(item.total) || 0
    rows.push([
      `A.${String(idx + 1).padStart(2, '0')}`,
      item.category_name || '',
      item.concept_name || '',
      item.contractor_name || '',
      item.description || '',
      Number(item.amount) || 0,
      Number(item.vat_amount) || 0,
      Number(item.total) || 0,
      item.payment_type || 'transferencia',
      item.bank || '',
      item.account_number || '',
      item.clabe || '',
      item.notes || ''
    ])
  })

  rows.push(['', '', '', '', 'TOTAL:', '', '', totalA])
  rows.push([])

  // Section B header
  rows.push(['', 'B. CHEQUES / EFECTIVO'])

  let totalB = 0
  sectionB.forEach((item, idx) => {
    totalB += Number(item.total) || 0
    rows.push([
      `B.${String(idx + 1).padStart(2, '0')}`,
      item.category_name || '',
      item.concept_name || '',
      item.contractor_name || '',
      item.description || '',
      Number(item.amount) || 0,
      Number(item.vat_amount) || 0,
      Number(item.total) || 0,
      item.payment_type || '',
      item.bank || '',
      item.account_number || '',
      item.clabe || '',
      item.notes || ''
    ])
  })

  rows.push(['', '', '', '', 'TOTAL:', '', '', totalB])
  rows.push([])

  // Grand total
  const grandTotal = totalA + totalB
  rows.push(['', '', '', '', 'TOTAL GENERAL:', '', '', grandTotal])
  rows.push([])
  rows.push(['', numberToWords(grandTotal)])

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  ws['!cols'] = [
    { wch: 6 }, { wch: 22 }, { wch: 22 }, { wch: 25 }, { wch: 30 },
    { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 15 },
    { wch: 16 }, { wch: 20 }, { wch: 20 }
  ]

  const sheetName = `Remesa ${String(remesa.remesa_number).padStart(2, '0')} ${remesa.remesa_suffix}`
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))

  XLSX.writeFile(wb, `${sheetName}.xlsx`)
}
