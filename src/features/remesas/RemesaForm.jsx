import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useProject } from '../../hooks/useProjectContext'
import { useRemesas, useRemesaDetail } from './useRemesas'
import Card, { CardHeader, CardBody } from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'
import { formatCurrency } from '../../lib/formatters'
import { Plus, Trash2, Save, Send } from 'lucide-react'
import { DEMO_CATEGORIES, DEMO_CONTRACTORS_ALL, DEMO_REMESAS_ALL, DEMO_REMESA_ITEMS_ALL, persistDemoData } from '../../lib/demoData'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export default function RemesaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentProject } = useProject()
  const { createRemesa, sendRemesa } = useRemesas(currentProject?.id)
  const { remesa, items: existingItems, addItem, updateItem, deleteItem } = useRemesaDetail(id)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    week_description: '',
    remesa_suffix: 'MN',
    remesa_number: '',
  })
  const [itemsA, setItemsA] = useState([])
  const [itemsB, setItemsB] = useState([])
  const [categories, setCategories] = useState([])
  const [concepts, setConcepts] = useState([])
  const [contractors, setContractors] = useState([])
  const [saving, setSaving] = useState(false)
  const [remesaId, setRemesaId] = useState(id || null)

  useEffect(() => {
    if (currentProject?.id) {
      loadCatalogs()
    }
  }, [currentProject?.id])

  useEffect(() => {
    if (remesa) {
      setForm({
        date: remesa.date || '',
        week_description: remesa.week_description || '',
        remesa_suffix: remesa.remesa_suffix || 'MN',
        remesa_number: remesa.remesa_number ?? '',
      })
    }
    if (existingItems?.length) {
      setItemsA(existingItems.filter(i => i.section === 'A' || i.section === 1).map(toFormItem))
      setItemsB(existingItems.filter(i => i.section === 'B' || i.section === 2).map(toFormItem))
    }
  }, [remesa, existingItems])

  async function loadCatalogs() {
    if (DEMO_MODE) {
      const demoCats = DEMO_CATEGORIES.map((cat, idx) => ({
        ...cat,
        project_id: 'demo-p1',
        sort_order: idx + 1,
        concepts: cat.concepts.map((con, cIdx) => ({
          ...con,
          category_id: cat.id,
          sort_order: cIdx + 1,
        })),
      }))
      setCategories(demoCats)
      setContractors(DEMO_CONTRACTORS_ALL)
      return
    }
    const [catRes, conRes] = await Promise.all([
      supabase.from('categories').select('*, concepts(*)').eq('project_id', currentProject.id).order('name'),
      supabase.from('contractors').select('*').eq('project_id', currentProject.id).order('name'),
    ])
    setCategories(catRes.data || [])
    setContractors(conRes.data || [])
  }

  function toFormItem(item) {
    return {
      id: item.id,
      category_id: item.category_id || '',
      concept_id: item.concept_id || '',
      contractor_id: item.contractor_id || '',
      contractor_name: item.contractor_name || '',
      description: item.description || '',
      amount: item.amount || '',
      vat_pct: item.vat_pct || 0,
      vat_amount: item.vat_amount || 0,
      total: item.total || 0,
      payment_type: item.payment_type || '',
      bank: item.bank || '',
      account_number: item.account_number || '',
      clabe: item.clabe || '',
      notes: item.notes || '',
    }
  }

  function emptyItem(section) {
    return {
      category_id: '', concept_id: '', contractor_id: '', contractor_name: '',
      description: '', amount: '', vat_pct: 0, vat_amount: 0, total: 0,
      payment_type: section === 'A' ? 'transferencia' : 'cheque',
      bank: '', account_number: '', clabe: '', notes: '',
    }
  }

  function getConceptsForCategory(categoryId) {
    const cat = categories.find(c => c.id === categoryId)
    return cat?.concepts || []
  }

  function updateLineItem(section, index, field, value) {
    const setter = section === 'A' ? setItemsA : setItemsB
    setter(prev => {
      const updated = [...prev]
      const item = { ...updated[index], [field]: value }

      // Auto-fill contractor info
      if (field === 'contractor_id' && value) {
        const contractor = contractors.find(c => c.id === value)
        if (contractor) {
          item.contractor_name = contractor.name
          item.bank = contractor.bank || ''
          item.account_number = contractor.account_number || ''
          item.clabe = contractor.clabe || ''
        }
      }

      // Auto-calculate IVA
      if (field === 'amount' || field === 'vat_pct') {
        const amount = parseFloat(field === 'amount' ? value : item.amount) || 0
        const vatPct = parseFloat(field === 'vat_pct' ? value : item.vat_pct) || 0
        item.vat_amount = Math.round(amount * (vatPct / 100) * 100) / 100
        item.total = Math.round((amount + item.vat_amount) * 100) / 100
      }

      // Reset concept when category changes
      if (field === 'category_id') {
        item.concept_id = ''
      }

      updated[index] = item
      return updated
    })
  }

  function removeLineItem(section, index) {
    const setter = section === 'A' ? setItemsA : setItemsB
    setter(prev => prev.filter((_, i) => i !== index))
  }

  const totalA = itemsA.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0)
  const totalB = itemsB.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0)
  const grandTotal = totalA + totalB

  async function handleSave(sendAfter = false) {
    if (!currentProject?.id) return
    setSaving(true)

    try {
      let currentRemesaId = remesaId

      if (DEMO_MODE) {
        const userNumber = form.remesa_number !== '' ? parseInt(form.remesa_number, 10) : null
        if (!currentRemesaId) {
          const newRemesa = await createRemesa({
            date: form.date,
            week_description: form.week_description,
            remesa_suffix: form.remesa_suffix,
            total_amount: grandTotal,
            status: sendAfter ? 'enviada' : 'borrador',
          })
          currentRemesaId = newRemesa.id
          // Override auto-number if user specified one
          if (userNumber !== null) {
            const remIdx = DEMO_REMESAS_ALL.findIndex(r => r.id === currentRemesaId)
            if (remIdx >= 0) DEMO_REMESAS_ALL[remIdx].remesa_number = userNumber
          }
        } else {
          // Update existing remesa in global array
          const remIdx = DEMO_REMESAS_ALL.findIndex(r => r.id === currentRemesaId)
          if (remIdx >= 0) {
            DEMO_REMESAS_ALL[remIdx].date = form.date
            DEMO_REMESAS_ALL[remIdx].week_description = form.week_description
            DEMO_REMESAS_ALL[remIdx].remesa_suffix = form.remesa_suffix
            DEMO_REMESAS_ALL[remIdx].total_amount = grandTotal
            if (userNumber !== null) DEMO_REMESAS_ALL[remIdx].remesa_number = userNumber
            if (sendAfter) DEMO_REMESAS_ALL[remIdx].status = 'enviada'
          }
        }

        // Remove old items for this remesa from global array
        for (let i = DEMO_REMESA_ITEMS_ALL.length - 1; i >= 0; i--) {
          if (DEMO_REMESA_ITEMS_ALL[i].remesa_id === currentRemesaId) {
            DEMO_REMESA_ITEMS_ALL.splice(i, 1)
          }
        }

        // Re-insert all items from the form
        const allFormItems = [
          ...itemsA.map((item, idx) => ({ ...item, section: 1, line_number: idx + 1 })),
          ...itemsB.map((item, idx) => ({ ...item, section: 2, line_number: idx + 1 })),
        ].filter(item => item.contractor_name || item.description || item.total)

        allFormItems.forEach((item, idx) => {
          DEMO_REMESA_ITEMS_ALL.push({
            id: item.id || `ri-form-${Date.now()}-${idx}`,
            remesa_id: currentRemesaId,
            section: item.section,
            line_number: item.line_number,
            category_id: item.category_id || null,
            category_name: item.category_name || '',
            concept_id: item.concept_id || null,
            concept_name: item.concept_name || '',
            contractor_id: item.contractor_id || null,
            contractor_name: item.contractor_name || '',
            description: item.description || '',
            amount: parseFloat(item.amount) || 0,
            vat_pct: parseFloat(item.vat_pct) || 0,
            vat_amount: parseFloat(item.vat_amount) || 0,
            total: parseFloat(item.total) || 0,
            payment_type: item.payment_type || (item.section === 1 ? 'transferencia' : 'cheque'),
            bank: item.bank || '',
            account_number: item.account_number || '',
            clabe: item.clabe || '',
            notes: item.notes || '',
            is_approved: item.is_approved || false,
            approved_at: item.approved_at || null,
            approved_by: item.approved_by || null,
          })
        })

        persistDemoData()
        navigate(`/remesas/${currentRemesaId}`)
        return
      }

      if (!currentRemesaId) {
        const newRemesa = await createRemesa({
          date: form.date,
          week_description: form.week_description,
          remesa_suffix: form.remesa_suffix,
          total_amount: grandTotal,
        })
        currentRemesaId = newRemesa.id
        setRemesaId(currentRemesaId)
      } else {
        await supabase.from('remesas').update({
          date: form.date,
          week_description: form.week_description,
          remesa_suffix: form.remesa_suffix,
          total_amount: grandTotal,
        }).eq('id', currentRemesaId)
      }

      // Delete existing items and re-insert
      await supabase.from('remesa_items').delete().eq('remesa_id', currentRemesaId)

      const allItems = [
        ...itemsA.map((item, idx) => ({ ...item, section: 'A', line_number: idx + 1, remesa_id: currentRemesaId })),
        ...itemsB.map((item, idx) => ({ ...item, section: 'B', line_number: idx + 1, remesa_id: currentRemesaId })),
      ].filter(item => item.description || item.contractor_name || parseFloat(item.total) > 0)
        .map(({ id: _id, ...item }) => ({
          remesa_id: item.remesa_id,
          section: item.section,
          line_number: item.line_number,
          category_id: item.category_id || null,
          concept_id: item.concept_id || null,
          contractor_id: item.contractor_id || null,
          contractor_name: item.contractor_name || null,
          description: item.description,
          amount: parseFloat(item.amount) || 0,
          vat_pct: parseFloat(item.vat_pct) || 0,
          vat_amount: parseFloat(item.vat_amount) || 0,
          total: parseFloat(item.total) || 0,
          payment_type: item.payment_type || null,
          bank: item.bank || null,
          account_number: item.account_number || null,
          clabe: item.clabe || null,
          notes: item.notes || null,
        }))

      if (allItems.length > 0) {
        const { error } = await supabase.from('remesa_items').insert(allItems)
        if (error) throw error
      }

      if (sendAfter) {
        await supabase.from('remesas').update({ status: 'enviada' }).eq('id', currentRemesaId)
      }

      navigate(`/remesas/${currentRemesaId}`)
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
  const contractorOptions = contractors.map(c => ({ value: c.id, label: c.name }))
  const vatOptions = [
    { value: '0', label: '0%' },
    { value: '16', label: '16%' },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Editar Remesa' : 'Nueva Remesa'}
        </h1>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate('/remesas')}>Cancelar</Button>
          <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Borrador'}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Send size={16} /> Enviar
          </Button>
        </div>
      </div>

      {/* Header form */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="No. Remesa" type="number" value={form.remesa_number} onChange={e => setForm({ ...form, remesa_number: e.target.value })} placeholder="Auto" />
            <Input label="Fecha" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Descripción de semana" value={form.week_description} onChange={e => setForm({ ...form, week_description: e.target.value })} placeholder="Del 27 al 31 de Octubre del 2025" />
            <Select label="Sufijo" value={form.remesa_suffix} onChange={e => setForm({ ...form, remesa_suffix: e.target.value })} options={[{ value: 'MN', label: 'MN' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
          </div>
        </CardBody>
      </Card>

      {/* Section A */}
      <SectionTable
        title="A. Transferencias Bancarias"
        section="A"
        items={itemsA}
        total={totalA}
        categories={categoryOptions}
        contractors={contractorOptions}
        vatOptions={vatOptions}
        getConceptsForCategory={getConceptsForCategory}
        onAdd={() => setItemsA(prev => [...prev, emptyItem('A')])}
        onUpdate={(idx, field, val) => updateLineItem('A', idx, field, val)}
        onRemove={(idx) => removeLineItem('A', idx)}
      />

      {/* Section B */}
      <SectionTable
        title="B. Cheques / Efectivo"
        section="B"
        items={itemsB}
        total={totalB}
        categories={categoryOptions}
        contractors={contractorOptions}
        vatOptions={vatOptions}
        getConceptsForCategory={getConceptsForCategory}
        onAdd={() => setItemsB(prev => [...prev, emptyItem('B')])}
        onUpdate={(idx, field, val) => updateLineItem('B', idx, field, val)}
        onRemove={(idx) => removeLineItem('B', idx)}
      />

      {/* Grand total */}
      <Card className="mt-6">
        <CardBody>
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total General</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(grandTotal)}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function SectionTable({ title, section, items, total, categories, contractors, vatOptions, getConceptsForCategory, onAdd, onUpdate, onRemove }) {
  return (
    <Card className="mb-6">
      <CardHeader className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Button size="sm" variant="secondary" onClick={onAdd}>
          <Plus size={14} /> Agregar línea
        </Button>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-2 py-2 text-left font-medium text-gray-500 w-12">#</th>
              <th className="px-2 py-2 text-left font-medium text-gray-500">Categoría</th>
              <th className="px-2 py-2 text-left font-medium text-gray-500">Concepto</th>
              <th className="px-2 py-2 text-left font-medium text-gray-500">Contratista</th>
              <th className="px-2 py-2 text-left font-medium text-gray-500">Partida</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500 w-28">Importe</th>
              <th className="px-2 py-2 text-center font-medium text-gray-500 w-20">IVA</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500 w-24">IVA $</th>
              <th className="px-2 py-2 text-right font-medium text-gray-500 w-28">Total</th>
              <th className="px-2 py-2 text-left font-medium text-gray-500">Banco</th>
              <th className="px-2 py-2 text-left font-medium text-gray-500">CLABE</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const conceptOpts = item.category_id
                ? [...getConceptsForCategory(item.category_id).map(c => ({ value: c.id, label: c.name })), { value: 'otros', label: 'Otros' }]
                : [{ value: 'otros', label: 'Otros' }]

              return (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-2 py-1.5 text-gray-400">
                    {section}.{String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={item.category_id}
                      onChange={e => onUpdate(idx, 'category_id', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white"
                    >
                      <option value="">—</option>
                      {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={item.concept_id}
                      onChange={e => onUpdate(idx, 'concept_id', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white"
                    >
                      <option value="">—</option>
                      {conceptOpts.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={item.contractor_id}
                      onChange={e => onUpdate(idx, 'contractor_id', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white"
                    >
                      <option value="">Escribir nombre...</option>
                      {contractors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {!item.contractor_id && (
                      <input
                        value={item.contractor_name}
                        onChange={e => onUpdate(idx, 'contractor_name', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 mt-1"
                        placeholder="Nombre..."
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={item.description}
                      onChange={e => onUpdate(idx, 'description', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-200"
                      placeholder="Descripción..."
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={e => onUpdate(idx, 'amount', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-200 text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={item.vat_pct}
                      onChange={e => onUpdate(idx, 'vat_pct', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white text-center"
                    >
                      {vatOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-right text-xs text-gray-600">
                    {formatCurrency(item.vat_amount)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-xs font-medium">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={item.bank}
                      onChange={e => onUpdate(idx, 'bank', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-200"
                      placeholder="Banco"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={item.clabe}
                      onChange={e => onUpdate(idx, 'clabe', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-200"
                      placeholder="CLABE"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => onRemove(idx)} className="p-1 hover:bg-gray-200 rounded">
                      <Trash2 size={12} className="text-gray-400" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-medium">
              <td colSpan={8} className="px-2 py-2 text-right">Subtotal {title.split('.')[0]}:</td>
              <td className="px-2 py-2 text-right">{formatCurrency(total)}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}
