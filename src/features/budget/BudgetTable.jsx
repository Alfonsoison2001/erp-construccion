import { useState } from 'react'
import { formatCurrency } from '../../lib/formatters'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'

export default function BudgetTable({
  grouped, grandTotal,
  onEditItem, onDeleteItem, onAddItem,
  onAddConcept, onEditCategory, onEditConcept,
}) {
  const [expanded, setExpanded] = useState({})

  const toggleCategory = (catId) => {
    setExpanded(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  const categories = Object.values(grouped)

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría / Concepto</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moneda</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P.U.</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total MXN</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <CategoryRow
              key={cat.id}
              category={cat}
              expanded={expanded[cat.id]}
              onToggle={() => toggleCategory(cat.id)}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onAddItem={onAddItem}
              onAddConcept={onAddConcept}
              onEditCategory={onEditCategory}
              onEditConcept={onEditConcept}
            />
          ))}
          <tr className="bg-gray-50 font-semibold border-t-2">
            <td colSpan={9} className="px-4 py-3 text-right">Total Presupuesto:</td>
            <td className="px-4 py-3 text-right">{formatCurrency(grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function ActionBtn({ onClick, title, children, variant = 'default' }) {
  const colors = variant === 'danger'
    ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={title}
      className={`p-1 rounded transition-colors ${colors}`}
    >
      {children}
    </button>
  )
}

function CategoryRow({ category, expanded, onToggle, onEditItem, onDeleteItem, onAddItem, onAddConcept, onEditCategory, onEditConcept }) {
  const concepts = Object.values(category.concepts)
  const [expandedConcepts, setExpandedConcepts] = useState({})

  return (
    <>
      <tr
        className="border-b border-gray-100 bg-blue-50/50 cursor-pointer hover:bg-blue-50"
        onClick={onToggle}
      >
        <td className="px-4 py-2.5">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
        <td colSpan={7} className="px-4 py-2.5 font-semibold text-sm text-gray-900">
          {category.name}
        </td>
        <td className="px-4 py-2.5 text-right font-semibold text-sm">
          {formatCurrency(category.total)}
        </td>
        <td className="px-4 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1">
            <ActionBtn onClick={() => onAddConcept(category.id, category.name)} title="Agregar concepto">
              <Plus size={14} />
            </ActionBtn>
            <ActionBtn onClick={() => onEditCategory(category.id, category.name)} title="Renombrar categoría">
              <Pencil size={14} />
            </ActionBtn>
          </div>
        </td>
      </tr>
      {expanded && concepts.map(concept => (
        <ConceptRows
          key={concept.id}
          concept={concept}
          categoryId={category.id}
          expanded={expandedConcepts[concept.id]}
          onToggle={() => setExpandedConcepts(prev => ({ ...prev, [concept.id]: !prev[concept.id] }))}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onAddItem={onAddItem}
          onEditConcept={onEditConcept}
        />
      ))}
    </>
  )
}

function ConceptRows({ concept, categoryId, expanded, onToggle, onEditItem, onDeleteItem, onAddItem, onEditConcept }) {
  return (
    <>
      <tr
        className="border-b border-gray-50 bg-gray-50/50 cursor-pointer hover:bg-gray-100"
        onClick={onToggle}
      >
        <td className="px-4 py-2 pl-8">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </td>
        <td colSpan={7} className="px-4 py-2 text-sm font-medium text-gray-700 pl-8">
          {concept.name}
        </td>
        <td className="px-4 py-2 text-right text-sm font-medium">
          {formatCurrency(concept.total)}
        </td>
        <td className="px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <ActionBtn onClick={() => onAddItem(categoryId, concept.id)} title="Agregar item">
              <Plus size={14} />
            </ActionBtn>
            <ActionBtn onClick={() => onEditConcept(concept.id, concept.name)} title="Renombrar concepto">
              <Pencil size={14} />
            </ActionBtn>
          </div>
        </td>
      </tr>
      {expanded && concept.items.map(item => (
        item._placeholder ? null : (
          <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
            <td className="px-4 py-2"></td>
            <td className="px-4 py-2 pl-12 text-sm text-gray-600">
              {item.concepts?.name || '—'}
            </td>
            <td className="px-4 py-2 text-sm text-gray-600">{item.detail || '—'}</td>
            <td className="px-4 py-2 text-sm text-gray-600">{item.supplier || '—'}</td>
            <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
            <td className="px-4 py-2 text-sm">{item.unit || '—'}</td>
            <td className="px-4 py-2 text-sm">{item.currency}</td>
            <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unit_price, item.currency)}</td>
            <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.total_mxn)}</td>
            <td className="px-4 py-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <ActionBtn onClick={() => onEditItem(item)} title="Editar item">
                  <Pencil size={14} />
                </ActionBtn>
                <ActionBtn onClick={() => onDeleteItem(item.id)} title="Eliminar item" variant="danger">
                  <Trash2 size={14} />
                </ActionBtn>
              </div>
            </td>
          </tr>
        )
      ))}
    </>
  )
}
