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

export function parseRemesaHistoricoExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        if (data.length < 2) {
          reject(new Error('El archivo está vacío o no tiene datos'))
          return
        }

        // Auto-detect header row: find the row containing "# REMESA" or "REMESA"
        let headerRowIdx = -1
        for (let i = 0; i < Math.min(20, data.length); i++) {
          const rowStr = data[i].map(c => String(c || '').trim().toUpperCase()).join('|')
          if (rowStr.includes('# REMESA') || rowStr.includes('#REMESA')) {
            headerRowIdx = i
            break
          }
        }
        if (headerRowIdx < 0) {
          reject(new Error('No se encontró la fila de encabezados con "# REMESA"'))
          return
        }

        const headers = data[headerRowIdx].map(h => String(h || '').trim().toUpperCase())

        // Find column indices by header name
        const colIdx = (name) => {
          const variants = Array.isArray(name) ? name : [name]
          for (const v of variants) {
            const upper = v.toUpperCase()
            const idx = headers.findIndex(h => h === upper)
            if (idx >= 0) return idx
          }
          // Fallback: partial match
          for (const v of variants) {
            const upper = v.toUpperCase()
            const idx = headers.findIndex(h => h.includes(upper))
            if (idx >= 0) return idx
          }
          return -1
        }

        const iDate = colIdx(['FECHA'])
        const iRemNum = colIdx(['# REMESA', '#REMESA', 'NO. REMESA', 'REMESA'])
        const iCatNum = colIdx(['# CATEGORIA', '#CATEGORIA', '# CATEGORÍA', 'NO. CATEGORIA'])
        const iCat = colIdx(['CATEGORIA', 'CATEGORÍA'])
        const iSubCat = colIdx(['SUB-CATEGORIA', 'SUB-CATEGORÍA', 'SUBCATEGORIA', 'SUBCATEGORÍA'])
        const iContractor = colIdx(['NOMBRE CONTRATISTA', 'CONTRATISTA'])
        const iPartida = colIdx(['PARTIDA', 'DESCRIPCION', 'DESCRIPCIÓN'])
        const iImporte = colIdx(['IMPORTE', 'MONTO', 'AMOUNT'])
        const iIvaPct = colIdx(['IVA %', 'IVA%', '% IVA'])
        const iIvaAmt = colIdx(['IVA $', 'IVA$', 'IVA MONTO'])
        const iTotal = colIdx(['TOTAL'])
        const iPayType = colIdx(['TIPO DE PAGO', 'TIPO PAGO'])
        const iBank = colIdx(['BANCO'])
        const iAccount = colIdx(['NO. DE CUENTA', 'No. DE CUENTA', 'CUENTA', 'NUM CUENTA', 'NÚMERO DE CUENTA'])
        const iClabe = colIdx(['CLABE INTERBANCARIA', 'CLABE'])

        if (iRemNum < 0) {
          reject(new Error('No se encontró la columna "# REMESA" en los encabezados'))
          return
        }

        const dataStartRow = headerRowIdx + 1

        // Parse all data rows and group by remesa
        const remesaMap = new Map()

        for (let i = dataStartRow; i < data.length; i++) {
          const row = data[i]
          if (!row) continue

          const remNumRaw = row[iRemNum]
          if (remNumRaw === '' || remNumRaw === null || remNumRaw === undefined) continue
          const remNum = typeof remNumRaw === 'number' ? remNumRaw : parseInt(String(remNumRaw).trim())
          if (isNaN(remNum)) continue

          // Parse date
          let dateStr = ''
          if (iDate >= 0) {
            const rawDate = row[iDate]
            if (rawDate instanceof Date) {
              dateStr = rawDate.toISOString().split('T')[0]
            } else if (typeof rawDate === 'number') {
              const d = new Date((rawDate - 25569) * 86400 * 1000)
              dateStr = d.toISOString().split('T')[0]
            } else if (typeof rawDate === 'string' && rawDate.trim()) {
              dateStr = rawDate.trim()
            }
          }

          const key = `${remNum}|${dateStr}`

          if (!remesaMap.has(key)) {
            remesaMap.set(key, {
              remesa_number: remNum,
              remesa_suffix: 'MN',
              date: dateStr || new Date().toISOString().split('T')[0],
              status: 'pagada',
              items: [],
            })
          }

          const paymentTypeRaw = iPayType >= 0 ? String(row[iPayType] || '').trim().toLowerCase() : ''
          const isTransfer = paymentTypeRaw.includes('transfer')
          const section = isTransfer ? 'A' : 'B'
          const paymentType = isTransfer ? 'transferencia' : (paymentTypeRaw.includes('cheque') ? 'cheque' : (paymentTypeRaw.includes('efectivo') ? 'efectivo' : paymentTypeRaw || 'transferencia'))

          const amount = iImporte >= 0 ? (parseFloat(row[iImporte]) || 0) : 0
          const vatPct = iIvaPct >= 0 ? (parseFloat(row[iIvaPct]) || 0) : 0
          const vatAmount = iIvaAmt >= 0 ? (parseFloat(row[iIvaAmt]) || 0) : 0
          const total = iTotal >= 0 ? (parseFloat(row[iTotal]) || 0) : (amount + vatAmount)

          remesaMap.get(key).items.push({
            category_name: iCat >= 0 ? String(row[iCat] || '').trim() : '',
            concept_name: iSubCat >= 0 ? String(row[iSubCat] || '').trim() : '',
            contractor_name: iContractor >= 0 ? String(row[iContractor] || '').trim() : '',
            description: iPartida >= 0 ? String(row[iPartida] || '').trim() : '',
            amount,
            vat_pct: vatPct,
            vat_amount: vatAmount,
            total,
            payment_type: paymentType,
            section,
            bank: iBank >= 0 ? String(row[iBank] || '').trim() : '',
            account_number: iAccount >= 0 ? String(row[iAccount] || '').trim() : '',
            clabe: iClabe >= 0 ? String(row[iClabe] || '').trim() : '',
          })
        }

        const remesas = Array.from(remesaMap.values())
        remesas.sort((a, b) => a.remesa_number - b.remesa_number)

        // Handle duplicate remesa_number by appending suffix variant
        const numCount = new Map()
        remesas.forEach(r => {
          const count = (numCount.get(r.remesa_number) || 0) + 1
          numCount.set(r.remesa_number, count)
          if (count > 1) {
            r.remesa_suffix = 'MN-' + count
          }
        })

        // Compute totals
        remesas.forEach(r => {
          r.total_amount = r.items.reduce((sum, it) => sum + (it.total || 0), 0)
        })

        resolve(remesas)
      } catch (err) {
        reject(new Error('Error al leer el archivo Excel histórico: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsArrayBuffer(file)
  })
}

export function exportRemesaToExcel(remesa, items, project, getBudgetInfo) {
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
    'IMPORTE', 'IVA', 'TOTAL', 'PRESUPUESTO', 'PAGADO', 'DISPONIBLE',
    'TIPO DE PAGO', 'BANCO',
    'No. DE CUENTA', 'CLABE INTERBANCARIA', 'NOTAS'
  ])

  rows.push([])

  // Section A header
  rows.push(['', 'A. TRANSFERENCIAS BANCARIAS'])

  let totalA = 0
  sectionA.forEach((item, idx) => {
    totalA += Number(item.total) || 0
    const info = getBudgetInfo ? getBudgetInfo(item.category_id, item.concept_id) : null
    rows.push([
      `A.${String(idx + 1).padStart(2, '0')}`,
      item.category_name || '',
      item.concept_name || '',
      item.contractor_name || '',
      item.description || '',
      Number(item.amount) || 0,
      Number(item.vat_amount) || 0,
      Number(item.total) || 0,
      info ? info.budget_total : '',
      info ? info.paid_total : '',
      info ? info.available : '',
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
    const info = getBudgetInfo ? getBudgetInfo(item.category_id, item.concept_id) : null
    rows.push([
      `B.${String(idx + 1).padStart(2, '0')}`,
      item.category_name || '',
      item.concept_name || '',
      item.contractor_name || '',
      item.description || '',
      Number(item.amount) || 0,
      Number(item.vat_amount) || 0,
      Number(item.total) || 0,
      info ? info.budget_total : '',
      info ? info.paid_total : '',
      info ? info.available : '',
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
    { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 15 },
    { wch: 16 }, { wch: 20 }, { wch: 20 }
  ]

  const sheetName = `Remesa ${String(remesa.remesa_number).padStart(2, '0')} ${remesa.remesa_suffix}`
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))

  XLSX.writeFile(wb, `${sheetName}.xlsx`)
}
