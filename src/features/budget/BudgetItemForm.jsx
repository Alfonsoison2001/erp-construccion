import { useState, useEffect, useMemo } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import { formatCurrency } from '../../lib/formatters'
import { Plus } from 'lucide-react'

const CURRENCIES = ['MXN', 'USD', 'EUR']

function calcFields({ quantity, unit_price, surcharge_pct, vat_pct, exchange_rate }) {
  const qty = Number(quantity) || 0
  const up = Number(unit_price) || 0
  const sPct = Number(surcharge_pct) || 0
  const vPct = Number(vat_pct) || 0
  const er = Number(exchange_rate) || 1

  const subtotal = qty * up
  const surcharge_amount = subtotal * sPct
  const vat_amount = (subtotal + surcharge_amount) * vPct
  const total = subtotal + surcharge_amount + vat_amount
  const total_mxn = total * er

  return { subtotal, surcharge_amount, vat_amount, total, total_mxn }
}

export default function BudgetItemForm({ item, onClose, onSave, grouped, onAddCategory, onAddConcept, preSelectedCategoryId, preSelectedConceptId }) {
  const categories = useMemo(() => Object.values(grouped || {}), [grouped])

  const [form, setForm] = useState({
    category_id: '',
    concept_id: '',
    detail: '',
    supplier: '',
    quantity: 0,
    unit: '',
    currency: 'MXN',
    unit_price: 0,
    surcharge_pct: 0,
    vat_pct: 0,
    exchange_rate: 1,
    notes: '',
  })

  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newConceptName, setNewConceptName] = useState('')
  const [showNewConcept, setShowNewConcept] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setForm({
        category_id: item.category_id || '',
        concept_id: item.concept_id || '',
        detail: item.detail || '',
        supplier: item.supplier || '',
        quantity: item.quantity || 0,
        unit: item.unit || '',
        currency: item.currency || 'MXN',
        unit_price: item.unit_price || 0,
        surcharge_pct: item.surcharge_pct || 0,
        vat_pct: item.vat_pct || 0,
        exchange_rate: item.exchange_rate || 1,
        notes: item.notes || '',
      })
    } else {
      setForm(f => ({
        ...f,
        category_id: preSelectedCategoryId || '',
        concept_id: preSelectedConceptId || '',
      }))
    }
  }, [item, preSelectedCategoryId, preSelectedConceptId])

  const computed = calcFields(form)

  const selectedCategory = categories.find(c => c.id === form.category_id)
  const concepts = selectedCategory ? Object.values(selectedCategory.concepts) : []

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    const cat = await onAddCategory(newCategoryName.trim())
    setForm(prev => ({ ...prev, category_id: cat.id, concept_id: '' }))
    setNewCategoryName('')
    setShowNewCategory(false)
  }

  const handleCreateConcept = async () => {
    if (!newConceptName.trim() || !form.category_id) return
    const catName = selectedCategory?.name || ''
    const con = await onAddConcept(form.category_id, catName, newConceptName.trim())
    setForm(prev => ({ ...prev, concept_id: con.id }))
    setNewConceptName('')
    setShowNewConcept(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category_id) return
    setSaving(true)
    try {
      const catObj = categories.find(c => c.id === form.category_id)
      const conObj = concepts.find(c => c.id === form.concept_id)

      const payload = {
        ...form,
        ...computed,
        category_name: catObj?.name || '',
        concept_name: conObj?.name || '',
      }

      await onSave(payload, item?.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={item ? 'Editar Item' : 'Nuevo Item'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
          <div className="flex gap-2">
            {showNewCategory ? (
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de categoría"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={handleCreateCategory}>Crear</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewCategory(false)}>Cancelar</Button>
              </div>
            ) : (
              <>
                <select
                  value={form.category_id}
                  onChange={e => update('category_id', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <Button type="button" size="sm" variant="secondary" onClick={() => setShowNewCategory(true)}>
                  <Plus size={14} /> Nueva
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Concept */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
          <div className="flex gap-2">
            {showNewConcept ? (
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={newConceptName}
                  onChange={e => setNewConceptName(e.target.value)}
                  placeholder="Nombre de concepto"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={handleCreateConcept}>Crear</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewConcept(false)}>Cancelar</Button>
              </div>
            ) : (
              <>
                <select
                  value={form.concept_id}
                  onChange={e => update('concept_id', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar concepto...</option>
                  {concepts.map(con => (
                    <option key={con.id} value={con.id}>{con.name}</option>
                  ))}
                </select>
                <Button type="button" size="sm" variant="secondary" onClick={() => setShowNewConcept(true)} disabled={!form.category_id}>
                  <Plus size={14} /> Nuevo
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Detail + Supplier */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detalle</label>
            <input
              type="text"
              value={form.detail}
              onChange={e => update('detail', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <input
              type="text"
              value={form.supplier}
              onChange={e => update('supplier', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Quantity + Unit + Currency */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="number"
              step="any"
              value={form.quantity}
              onChange={e => update('quantity', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
            <input
              type="text"
              value={form.unit}
              onChange={e => update('unit', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Lote, M2, PZA..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select
              value={form.currency}
              onChange={e => {
                const cur = e.target.value
                update('currency', cur)
                if (cur === 'MXN') update('exchange_rate', 1)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* P.U. + Surcharge + VAT + Exchange Rate */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">P.U.</label>
            <input
              type="number"
              step="any"
              value={form.unit_price}
              onChange={e => update('unit_price', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">% Recargo</label>
            <input
              type="number"
              step="any"
              value={form.surcharge_pct}
              onChange={e => update('surcharge_pct', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="0.05 = 5%"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">% IVA</label>
            <input
              type="number"
              step="any"
              value={form.vat_pct}
              onChange={e => update('vat_pct', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="0.16 = 16%"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cambio</label>
            <input
              type="number"
              step="any"
              value={form.exchange_rate}
              onChange={e => update('exchange_rate', parseFloat(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              disabled={form.currency === 'MXN'}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Calculated fields */}
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">Subtotal</span>
            <span className="font-medium">{formatCurrency(computed.subtotal, form.currency)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Recargo</span>
            <span className="font-medium">{formatCurrency(computed.surcharge_amount, form.currency)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">IVA</span>
            <span className="font-medium">{formatCurrency(computed.vat_amount, form.currency)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Total</span>
            <span className="font-medium">{formatCurrency(computed.total, form.currency)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Total MXN</span>
            <span className="font-semibold text-gray-900">{formatCurrency(computed.total_mxn)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving || !form.category_id}>
            {saving ? 'Guardando...' : item ? 'Guardar Cambios' : 'Crear Item'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
