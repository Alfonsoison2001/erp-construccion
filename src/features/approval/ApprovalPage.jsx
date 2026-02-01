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
import { CheckCircle, Check, X, Save } from 'lucide-react'
import { DEMO_REMESAS_ALL, DEMO_REMESA_ITEMS_ALL, persistDemoData } from '../../lib/demoData'

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
      const filtered = DEMO_REMESAS_ALL.filter(r => r.project_id === currentProject.id)
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
    setItems(data || [])
  }

  async function handleApprove(item) {
    if (DEMO_MODE) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_approved: true, approved_at: paymentDate, approved_by: 'demo-user' } : i))
      setDirty(true)
      return
    }
    await approveItem(item.id, paymentDate)
    await updateRemesaStatus(selectedRemesa.id)
    await loadItems(selectedRemesa)
    await fetchRemesas()
  }

  async function handleUnapprove(item) {
    if (DEMO_MODE) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_approved: false, approved_at: null, approved_by: null } : i))
      setDirty(true)
      return
    }
    await unapproveItem(item.id)
    await updateRemesaStatus(selectedRemesa.id)
    await loadItems(selectedRemesa)
    await fetchRemesas()
  }

  async function handleApproveAll() {
    if (DEMO_MODE) {
      setItems(prev => prev.map(i => ({ ...i, is_approved: true, approved_at: paymentDate, approved_by: 'demo-user' })))
      setDirty(true)
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

  async function handleSave() {
    if (!selectedRemesa) return
    setSaving(true)

    if (DEMO_MODE) {
      // Update the global demo data in-memory
      items.forEach(item => {
        const idx = DEMO_REMESA_ITEMS_ALL.findIndex(i => i.id === item.id)
        if (idx >= 0) {
          DEMO_REMESA_ITEMS_ALL[idx].is_approved = item.is_approved
          DEMO_REMESA_ITEMS_ALL[idx].approved_at = item.approved_at
          DEMO_REMESA_ITEMS_ALL[idx].approved_by = item.approved_by
        }
      })
      // Update remesa status based on items
      const allApproved = items.every(i => i.is_approved)
      const someApproved = items.some(i => i.is_approved)
      const newStatus = allApproved ? 'pagada' : someApproved ? 'pagada_parcial' : 'enviada'
      const remIdx = DEMO_REMESAS_ALL.findIndex(r => r.id === selectedRemesa.id)
      if (remIdx >= 0) {
        DEMO_REMESAS_ALL[remIdx].status = newStatus
      }
      persistDemoData()
      setSelectedRemesa(prev => ({ ...prev, status: newStatus }))
      setRemesas(prev => prev.map(r => r.id === selectedRemesa.id ? { ...r, status: newStatus } : r))
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
              <CardHeader className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {formatRemesaNumber(selectedRemesa.remesa_number, selectedRemesa.remesa_suffix)}
                  </h3>
                  <p className="text-xs text-gray-500">{formatDateShort(selectedRemesa.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300"
                  />
                  <Button size="sm" variant="secondary" onClick={handleApproveAll}>
                    <Check size={14} /> Aprobar Todas
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
                    <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
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
