import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Card, { CardBody } from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Modal from '../../components/Modal'
import Table from '../../components/Table'
import { Plus, Pencil, Trash2, Users, Download } from 'lucide-react'
import { DEMO_CONTRACTORS_ALL } from '../../lib/demoData'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export default function ContractorsManager({ projectId }) {
  const [contractors, setContractors] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => { fetchContractors() }, [projectId])

  async function fetchContractors() {
    if (DEMO_MODE) {
      const filtered = DEMO_CONTRACTORS_ALL.filter(c => c.project_id === projectId)
      setContractors(filtered)
      return
    }
    const { data } = await supabase
      .from('contractors')
      .select('*')
      .eq('project_id', projectId)
      .order('name')
    setContractors(data || [])
  }

  const columns = [
    { key: 'name', label: 'Nombre', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'bank', label: 'Banco' },
    { key: 'account_number', label: 'No. Cuenta' },
    { key: 'clabe', label: 'CLABE' },
    { key: 'actions', label: '', className: 'w-20', render: (r) => (
      <div className="flex gap-1">
        <button onClick={() => { setEditing(r); setShowForm(true) }} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <Pencil size={14} className="text-gray-500" />
        </button>
        <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <Trash2 size={14} className="text-gray-500" />
        </button>
      </div>
    )},
  ]

  async function handleDelete(id) {
    if (!confirm('¿Eliminar contratista?')) return
    if (DEMO_MODE) {
      setContractors(prev => prev.filter(c => c.id !== id))
      return
    }
    await supabase.from('contractors').delete().eq('id', id)
    fetchContractors()
  }

  function handleSaved(savedContractor) {
    if (DEMO_MODE) {
      if (savedContractor._isNew) {
        const { _isNew, ...rest } = savedContractor
        setContractors(prev => [...prev, rest])
      } else {
        setContractors(prev => prev.map(c => c.id === savedContractor.id ? savedContractor : c))
      }
      return
    }
    fetchContractors()
  }

  async function importFromRemesas() {
    if (DEMO_MODE) {
      alert('Importación no disponible en modo demo')
      return
    }
    setImporting(true)
    try {
      // Get all remesas for this project
      const { data: remesas, error: remErr } = await supabase
        .from('remesas')
        .select('id')
        .eq('project_id', projectId)

      if (remErr || !remesas?.length) {
        alert('No se encontraron remesas para este proyecto')
        setImporting(false)
        return
      }

      const remesaIds = remesas.map(r => r.id)

      // Get unique contractor names and their bank info from remesa_items
      const { data: items, error: itemErr } = await supabase
        .from('remesa_items')
        .select('contractor_name, bank, clabe, account_number')
        .in('remesa_id', remesaIds)
        .not('contractor_name', 'is', null)

      if (itemErr || !items?.length) {
        alert('No se encontraron contratistas en las remesas')
        setImporting(false)
        return
      }

      // Get existing contractor names to avoid duplicates
      const existingNames = new Set(contractors.map(c => c.name?.toLowerCase().trim()))

      // Group by contractor name and get most recent bank info
      const byName = {}
      items.forEach(item => {
        const name = item.contractor_name?.trim()
        if (!name) return
        if (existingNames.has(name.toLowerCase())) return // Skip if already exists

        if (!byName[name]) {
          byName[name] = { name, bank: '', clabe: '', account_number: '' }
        }
        // Take bank info if available (later entries overwrite)
        if (item.bank) byName[name].bank = item.bank
        if (item.clabe) byName[name].clabe = item.clabe
        if (item.account_number) byName[name].account_number = item.account_number
      })

      const toInsert = Object.values(byName).map(c => ({
        ...c,
        project_id: projectId
      }))

      if (toInsert.length === 0) {
        alert('Todos los contratistas ya están en el catálogo')
        setImporting(false)
        return
      }

      const { error: insertErr } = await supabase
        .from('contractors')
        .insert(toInsert)

      if (insertErr) {
        console.error('Error inserting contractors:', insertErr)
        alert('Error al importar: ' + insertErr.message)
        setImporting(false)
        return
      }

      alert(`Se importaron ${toInsert.length} contratista(s)`)
      fetchContractors()
    } catch (err) {
      console.error('Import error:', err)
      alert('Error al importar contratistas')
    }
    setImporting(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{contractors.length} contratista(s)</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={importFromRemesas} disabled={importing}>
            <Download size={16} /> {importing ? 'Importando...' : 'Importar desde Remesas'}
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus size={16} /> Nuevo Contratista
          </Button>
        </div>
      </div>

      <Card>
        {contractors.length === 0 ? (
          <CardBody>
            <div className="text-center py-8 text-sm text-gray-500">
              <Users size={32} className="mx-auto text-gray-300 mb-3" />
              Sin contratistas registrados
            </div>
          </CardBody>
        ) : (
          <Table columns={columns} data={contractors} />
        )}
      </Card>

      {showForm && (
        <ContractorForm
          contractor={editing}
          projectId={projectId}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

function ContractorForm({ contractor, projectId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: contractor?.name || '',
    bank: contractor?.bank || '',
    account_number: contractor?.account_number || '',
    clabe: contractor?.clabe || '',
    notes: contractor?.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (DEMO_MODE) {
      if (contractor) {
        onSaved({ ...contractor, ...form })
      } else {
        onSaved({ ...form, id: 'ctr-demo-' + Date.now(), project_id: projectId, _isNew: true })
      }
      setSaving(false)
      onClose()
      return
    }

    if (contractor) {
      await supabase.from('contractors').update(form).eq('id', contractor.id)
    } else {
      await supabase.from('contractors').insert({ ...form, project_id: projectId })
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  const banks = ['BBVA', 'Santander', 'Banamex', 'Scotiabank', 'Banorte', 'HSBC', 'Banco Azteca', 'Banregio', 'Inbursa', 'Otro']

  return (
    <Modal isOpen onClose={onClose} title={contractor ? 'Editar Contratista' : 'Nuevo Contratista'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Banco</label>
          <select
            value={form.bank}
            onChange={e => setForm({ ...form, bank: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
          >
            <option value="">Seleccionar banco...</option>
            {banks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <Input label="No. Cuenta" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} />
        <Input label="CLABE Interbancaria" value={form.clabe} onChange={e => setForm({ ...form, clabe: e.target.value })} />
        <Input label="Notas" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  )
}
