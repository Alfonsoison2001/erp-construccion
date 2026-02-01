import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Card, { CardBody } from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Table from '../../components/Table'
import { formatDateShort } from '../../lib/formatters'
import { RefreshCw } from 'lucide-react'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

const DEMO_EXCHANGE_RATES = [
  { id: 'er1', date: '2025-10-27', currency: 'USD', rate: 17.25 },
  { id: 'er2', date: '2025-10-27', currency: 'EUR', rate: 18.50 },
  { id: 'er3', date: '2025-10-20', currency: 'USD', rate: 17.30 },
  { id: 'er4', date: '2025-10-20', currency: 'EUR', rate: 18.45 },
]

export default function ExchangeRates() {
  const [rates, setRates] = useState([])
  const [usdRate, setUsdRate] = useState('')
  const [eurRate, setEurRate] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchRates() }, [])

  async function fetchRates() {
    if (DEMO_MODE) {
      setRates([...DEMO_EXCHANGE_RATES])
      // Set current rates from demo data
      const latest = {}
      DEMO_EXCHANGE_RATES.forEach(r => {
        if (!latest[r.currency]) latest[r.currency] = r.rate
      })
      if (latest.USD) setUsdRate(String(latest.USD))
      if (latest.EUR) setEurRate(String(latest.EUR))
      return
    }

    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(20)
    setRates(data || [])

    // Set current rates
    if (data?.length) {
      const latest = {}
      data.forEach(r => {
        if (!latest[r.currency]) latest[r.currency] = r.rate
      })
      if (latest.USD) setUsdRate(String(latest.USD))
      if (latest.EUR) setEurRate(String(latest.EUR))
    }
  }

  async function saveRates() {
    setSaving(true)

    if (DEMO_MODE) {
      const newRates = []
      if (usdRate) newRates.push({ id: 'er-demo-' + Date.now() + '-usd', date, currency: 'USD', rate: parseFloat(usdRate) })
      if (eurRate) newRates.push({ id: 'er-demo-' + Date.now() + '-eur', date, currency: 'EUR', rate: parseFloat(eurRate) })
      // Replace existing rates for same date/currency, or add new
      setRates(prev => {
        let updated = [...prev]
        for (const nr of newRates) {
          const idx = updated.findIndex(r => r.date === nr.date && r.currency === nr.currency)
          if (idx >= 0) {
            updated[idx] = nr
          } else {
            updated = [nr, ...updated]
          }
        }
        return updated.sort((a, b) => b.date.localeCompare(a.date))
      })
      setSaving(false)
      return
    }

    const inserts = []
    if (usdRate) inserts.push({ date, currency: 'USD', rate: parseFloat(usdRate) })
    if (eurRate) inserts.push({ date, currency: 'EUR', rate: parseFloat(eurRate) })

    for (const item of inserts) {
      await supabase
        .from('exchange_rates')
        .upsert(item, { onConflict: 'date,currency' })
    }

    setSaving(false)
    fetchRates()
  }

  const columns = [
    { key: 'date', label: 'Fecha', render: (r) => formatDateShort(r.date) },
    { key: 'currency', label: 'Moneda' },
    { key: 'rate', label: 'Tipo de Cambio', className: 'text-right', render: (r) => `$${Number(r.rate).toFixed(4)}` },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h3 className="font-medium text-gray-900 mb-4">Actualizar Tipo de Cambio</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <Input label="USD → MXN" type="number" step="0.0001" value={usdRate} onChange={e => setUsdRate(e.target.value)} placeholder="ej: 17.2500" />
            <Input label="EUR → MXN" type="number" step="0.0001" value={eurRate} onChange={e => setEurRate(e.target.value)} placeholder="ej: 18.5000" />
          </div>
          <div className="mt-4">
            <Button onClick={saveRates} disabled={saving}>
              <RefreshCw size={16} /> {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-medium text-gray-900 mb-4">Histórico</h3>
          <Table columns={columns} data={rates} emptyMessage="Sin registros de tipo de cambio" />
        </CardBody>
      </Card>
    </div>
  )
}
