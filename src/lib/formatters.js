import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatCurrency(amount, currency = 'MXN') {
  if (amount == null) return '$0.00'
  const num = Number(amount)
  if (isNaN(num)) return '$0.00'

  const symbols = { MXN: '$', USD: 'USD $', EUR: '€' }
  const symbol = symbols[currency] || '$'

  return `${symbol}${num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: es })
}

export function formatDateShort(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy')
}

export function formatPercent(value) {
  if (value == null) return '0%'
  return `${Number(value).toFixed(1)}%`
}

export function formatRemesaNumber(number, suffix = 'MN') {
  return `Remesa ${String(number).padStart(2, '0')} ${suffix}`
}

export function numberToWords(num) {
  if (num === 0) return 'CERO PESOS'

  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

  function convertGroup(n) {
    if (n === 0) return ''
    if (n === 100) return 'CIEN'

    let result = ''
    if (n >= 100) {
      result += hundreds[Math.floor(n / 100)] + ' '
      n %= 100
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)]
      if (n % 10 > 0) result += ' Y ' + units[n % 10]
    } else if (n >= 10) {
      result += teens[n - 10]
    } else if (n > 0) {
      result += units[n]
    }
    return result.trim()
  }

  const integer = Math.floor(Math.abs(num))
  const cents = Math.round((Math.abs(num) - integer) * 100)

  let words = ''
  if (integer >= 1000000) {
    const millions = Math.floor(integer / 1000000)
    words += (millions === 1 ? 'UN MILLÓN' : convertGroup(millions) + ' MILLONES') + ' '
  }

  const remainder = integer % 1000000
  if (remainder >= 1000) {
    const thousands = Math.floor(remainder / 1000)
    words += (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') + ' '
  }

  const lastThree = remainder % 1000
  if (lastThree > 0) {
    words += convertGroup(lastThree)
  }

  words = words.trim()
  if (!words) words = 'CERO'

  return `${words} PESOS ${String(cents).padStart(2, '0')}/100 M.N.`
}
