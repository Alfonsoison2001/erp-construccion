import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Card, { CardBody } from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { DEMO_CATEGORIES as DEMO_CATEGORIES_RAW } from '../../lib/demoData'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

// Build DEMO_CATEGORIES from centralized data with project_id and sort_order
const DEMO_CATEGORIES = DEMO_CATEGORIES_RAW.map((cat, idx) => ({
  ...cat,
  project_id: 'demo-p1',
  sort_order: idx + 1,
  concepts: cat.concepts.map((con, cIdx) => ({
    ...con,
    category_id: cat.id,
    sort_order: cIdx + 1,
  })),
}))

export default function CategoriesManager({ projectId }) {
  const [categories, setCategories] = useState([])
  const [expanded, setExpanded] = useState({})
  const [newCategory, setNewCategory] = useState('')
  const [newConcepts, setNewConcepts] = useState({})

  useEffect(() => { fetchCategories() }, [projectId])

  async function fetchCategories() {
    if (DEMO_MODE) {
      const filtered = DEMO_CATEGORIES.filter(c => c.project_id === projectId).map(c => ({ ...c, concepts: [...c.concepts] }))
      setCategories(filtered)
      return
    }
    const { data } = await supabase
      .from('categories')
      .select('*, concepts(*)')
      .eq('project_id', projectId)
      .order('sort_order')
      .order('name')
    setCategories(data || [])
  }

  async function addCategory() {
    if (!newCategory.trim()) return
    if (DEMO_MODE) {
      const newCat = {
        id: 'cat-demo-' + Date.now(),
        project_id: projectId,
        name: newCategory.trim(),
        sort_order: categories.length + 1,
        concepts: [],
      }
      setCategories(prev => [...prev, newCat])
      setNewCategory('')
      return
    }
    const { error } = await supabase
      .from('categories')
      .insert({ project_id: projectId, name: newCategory.trim() })
    if (!error) {
      setNewCategory('')
      fetchCategories()
    }
  }

  async function deleteCategory(id) {
    if (!confirm('¿Eliminar categoría y todos sus conceptos?')) return
    if (DEMO_MODE) {
      setCategories(prev => prev.filter(c => c.id !== id))
      return
    }
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories()
  }

  async function addConcept(categoryId) {
    const name = newConcepts[categoryId]?.trim()
    if (!name) return
    if (DEMO_MODE) {
      const newCon = { id: 'con-demo-' + Date.now(), category_id: categoryId, name, sort_order: 1 }
      setCategories(prev => prev.map(c => {
        if (c.id !== categoryId) return c
        return { ...c, concepts: [...(c.concepts || []), newCon] }
      }))
      setNewConcepts(prev => ({ ...prev, [categoryId]: '' }))
      return
    }
    const { error } = await supabase
      .from('concepts')
      .insert({ category_id: categoryId, name })
    if (!error) {
      setNewConcepts(prev => ({ ...prev, [categoryId]: '' }))
      fetchCategories()
    }
  }

  async function deleteConcept(id) {
    if (DEMO_MODE) {
      setCategories(prev => prev.map(c => ({
        ...c,
        concepts: (c.concepts || []).filter(con => con.id !== id)
      })))
      return
    }
    await supabase.from('concepts').delete().eq('id', id)
    fetchCategories()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="Nueva categoría..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          className="flex-1"
        />
        <Button onClick={addCategory} disabled={!newCategory.trim()}>
          <Plus size={16} /> Agregar
        </Button>
      </div>

      {categories.map(cat => (
        <Card key={cat.id}>
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpanded(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
          >
            <div className="flex items-center gap-2">
              {expanded[cat.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="font-medium text-sm">{cat.name}</span>
              <span className="text-xs text-gray-400">({cat.concepts?.length || 0} conceptos)</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id) }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Trash2 size={14} className="text-gray-400" />
            </button>
          </div>

          {expanded[cat.id] && (
            <CardBody className="pt-0 space-y-2">
              {cat.concepts?.map(con => (
                <div key={con.id} className="flex items-center justify-between pl-6 py-1">
                  <span className="text-sm text-gray-700">{con.name}</span>
                  <button onClick={() => deleteConcept(con.id)} className="p-1 hover:bg-gray-100 rounded">
                    <Trash2 size={12} className="text-gray-400" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pl-6 pt-2">
                <input
                  placeholder="Nuevo concepto..."
                  value={newConcepts[cat.id] || ''}
                  onChange={(e) => setNewConcepts(prev => ({ ...prev, [cat.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addConcept(cat.id)}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
                <Button size="sm" variant="secondary" onClick={() => addConcept(cat.id)}>
                  <Plus size={12} />
                </Button>
              </div>
            </CardBody>
          )}
        </Card>
      ))}

      {categories.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-8">
          No hay categorías. Agrega una o importa presupuesto.
        </p>
      )}
    </div>
  )
}
