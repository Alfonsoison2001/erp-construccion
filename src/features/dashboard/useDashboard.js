import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { DEMO_REMESAS_ALL, DEMO_REMESA_ITEMS_ALL } from '../../lib/demoData'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

// Budget data per category (from PPTO OLMOS CLAUDE.xlsx)
// paid_total is computed dynamically from remesa items
const DEMO_BUDGET_CATEGORIES = [
  { category_id: 'cat-disenos', category_name: 'Diseños e Ingenierias', budget_total: 838190.80 },
  { category_id: 'cat-tramites', category_name: 'Tramites Locales', budget_total: 243318 },
  { category_id: 'cat-ingenieria', category_name: 'Ingenierias Y Topografia', budget_total: 653800 },
  { category_id: 'cat-indirectos', category_name: 'Indirectos De Obra', budget_total: 5483103.53 },
  { category_id: 'cat-excavacion', category_name: 'Excavacion Acarreos Y Muros De Contension', budget_total: 1557957.28 },
  { category_id: 'cat-cimentacion', category_name: 'Cimentacion Y Estructura Civil', budget_total: 17061395.58 },
  { category_id: 'cat-albanileria', category_name: 'Albañileria Y Bardas', budget_total: 4001891.54 },
  { category_id: 'cat-impermeabilizacion', category_name: 'Impermeabilizacion', budget_total: 1131333.80 },
  { category_id: 'cat-piso-hidronico', category_name: 'Piso Hidronico', budget_total: 325106.43 },
  { category_id: 'cat-acabados', category_name: 'Acabados', budget_total: 2391524 },
  { category_id: 'cat-herreria', category_name: 'Herreria', budget_total: 2469231.48 },
  { category_id: 'cat-electrica', category_name: 'Instalaciones Electricas', budget_total: 2833718.40 },
  { category_id: 'cat-ihs', category_name: 'Instalaciones IHS', budget_total: 4910608.95 },
  { category_id: 'cat-especiales', category_name: 'Instalaciones Especiales', budget_total: 3700000 },
  { category_id: 'cat-gas', category_name: 'Instalaciones De Gas', budget_total: 210298.80 },
  { category_id: 'cat-aa', category_name: 'Aire Acondicionado Y Extraccion', budget_total: 332426.30 },
  { category_id: 'cat-iluminacion', category_name: 'Iluminacion', budget_total: 2322352.48 },
  { category_id: 'cat-marmol', category_name: 'Marmol', budget_total: 5166615.97 },
  { category_id: 'cat-madera', category_name: 'Madera De Ingenieria Y Madera Solida', budget_total: 2165012.04 },
  { category_id: 'cat-vidrios', category_name: 'Vidrios Y Canceles', budget_total: 4541579.83 },
  { category_id: 'cat-cocinas', category_name: 'Cocinas', budget_total: 2938827.74 },
  { category_id: 'cat-bano', category_name: 'M De Baño Griferia Y Accesorios De Baño', budget_total: 1368974.09 },
  { category_id: 'cat-vestidores', category_name: 'Vestidores Importacion', budget_total: 3380000 },
  { category_id: 'cat-carpinteria', category_name: 'Carpinteria Fina', budget_total: 1971825 },
  { category_id: 'cat-jardineria', category_name: 'Jardineria Y Riego', budget_total: 2848000 },
]

function computeDemoBudgetVsPaid(projectId) {
  // Compute paid per category_name from approved remesa items
  const paidByCategory = {}
  DEMO_REMESA_ITEMS_ALL.forEach(item => {
    const remesa = DEMO_REMESAS_ALL.find(r => r.id === item.remesa_id)
    if (!remesa || remesa.project_id !== projectId) return
    if (!item.is_approved) return
    const catName = item.category_name || 'Extras'
    paidByCategory[catName] = (paidByCategory[catName] || 0) + (item.total || 0)
  })

  // Build budget vs paid rows
  const rows = DEMO_BUDGET_CATEGORIES.map(cat => {
    // Try to match paid by category name
    const paid = paidByCategory[cat.category_name] || 0
    return {
      project_id: projectId,
      category_id: cat.category_id,
      category_name: cat.category_name,
      concept_id: null,
      concept_name: null,
      budget_total: cat.budget_total,
      paid_total: paid,
    }
  })

  // Add "Extras" row for items not matching any budget category
  const extrasTotal = paidByCategory['Extras'] || 0
  if (extrasTotal > 0) {
    rows.push({
      project_id: projectId,
      category_id: 'cat-extras',
      category_name: 'Extras',
      concept_id: null,
      concept_name: null,
      budget_total: 0,
      paid_total: Math.round(extrasTotal * 100) / 100,
    })
  }

  return rows
}

export function useDashboard(projectId) {
  const [budgetData, setBudgetData] = useState([])
  const [remesas, setRemesas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!projectId) { setLoading(false); return }
    setLoading(true)

    if (DEMO_MODE) {
      const filteredBudget = computeDemoBudgetVsPaid(projectId)
      const filteredRemesas = DEMO_REMESAS_ALL.filter(r => r.project_id === projectId)
      setBudgetData(filteredBudget)
      setRemesas(filteredRemesas)
      setLoading(false)
      return
    }

    const [budgetRes, remesasRes] = await Promise.all([
      supabase
        .from('budget_vs_paid')
        .select('*')
        .eq('project_id', projectId),
      supabase
        .from('remesas')
        .select('*, profiles:created_by(full_name)')
        .eq('project_id', projectId)
        .order('remesa_number', { ascending: false }),
    ])

    setBudgetData(budgetRes.data || [])
    setRemesas(remesasRes.data || [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchData() }, [fetchData])

  // Aggregate by category
  const byCategory = budgetData.reduce((acc, row) => {
    if (!acc[row.category_id]) {
      acc[row.category_id] = {
        category_id: row.category_id,
        category_name: row.category_name,
        budget_total: 0,
        paid_total: 0,
        concepts: [],
      }
    }
    acc[row.category_id].budget_total += Number(row.budget_total) || 0
    // paid_total from the view is per concept group, take max per unique concept
    if (row.concept_id) {
      acc[row.category_id].concepts.push({
        concept_id: row.concept_id,
        concept_name: row.concept_name,
        budget_total: Number(row.budget_total) || 0,
        paid_total: Number(row.paid_total) || 0,
      })
    }
    // For category-level paid, use subquery result from concept rows
    const conceptPaid = acc[row.category_id].concepts.reduce((s, c) => s + c.paid_total, 0)
    acc[row.category_id].paid_total = conceptPaid || Number(row.paid_total) || 0
    return acc
  }, {})

  const categories = Object.values(byCategory)
  const totalBudget = categories.reduce((s, c) => s + c.budget_total, 0)
  const totalPaid = categories.reduce((s, c) => s + c.paid_total, 0)
  const totalPending = totalBudget - totalPaid

  return {
    categories,
    remesas,
    totalBudget,
    totalPaid,
    totalPending,
    loading,
    refresh: fetchData,
  }
}
