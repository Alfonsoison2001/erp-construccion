import { useState, useEffect, useCallback } from 'react'
import { supabase, onAuthReady } from '../lib/supabase'
import { DEMO_REMESAS_ALL, DEMO_REMESA_ITEMS_ALL } from '../lib/demoData'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

// Demo budget data keyed by actual DEMO_CATEGORIES IDs (cat-1 through cat-25)
const DEMO_BUDGET_CATEGORIES = [
  { category_id: 'cat-1', budget_total: 838190.80 },
  { category_id: 'cat-2', budget_total: 243318 },
  { category_id: 'cat-3', budget_total: 653800 },
  { category_id: 'cat-4', budget_total: 5483103.53 },
  { category_id: 'cat-5', budget_total: 1557957.28 },
  { category_id: 'cat-6', budget_total: 17061395.58 },
  { category_id: 'cat-7', budget_total: 4001891.54 },
  { category_id: 'cat-8', budget_total: 1131333.80 },
  { category_id: 'cat-9', budget_total: 325106.43 },
  { category_id: 'cat-10', budget_total: 2391524 },
  { category_id: 'cat-11', budget_total: 2469231.48 },
  { category_id: 'cat-12', budget_total: 2833718.40 },
  { category_id: 'cat-13', budget_total: 4910608.95 },
  { category_id: 'cat-14', budget_total: 3700000 },
  { category_id: 'cat-15', budget_total: 210298.80 },
  { category_id: 'cat-16', budget_total: 332426.30 },
  { category_id: 'cat-17', budget_total: 2322352.48 },
  { category_id: 'cat-18', budget_total: 5166615.97 },
  { category_id: 'cat-19', budget_total: 2165012.04 },
  { category_id: 'cat-20', budget_total: 4541579.83 },
  { category_id: 'cat-21', budget_total: 2938827.74 },
  { category_id: 'cat-22', budget_total: 1368974.09 },
  { category_id: 'cat-23', budget_total: 3380000 },
  { category_id: 'cat-24', budget_total: 1971825 },
  { category_id: 'cat-25', budget_total: 2848000 },
]

export function useBudgetVsPaid(projectId) {
  const [byCategory, setByCategory] = useState({})
  const [byConcept, setByConcept] = useState({})

  const fetchData = useCallback(async () => {
    if (!projectId) return

    if (DEMO_MODE) {
      // Compute paid per category_id from demo remesa items
      const paidByCat = {}
      DEMO_REMESA_ITEMS_ALL.forEach(item => {
        const remesa = DEMO_REMESAS_ALL.find(r => r.id === item.remesa_id)
        if (!remesa || remesa.project_id !== projectId) return
        if (!item.is_approved) return
        if (!item.category_id) return
        paidByCat[item.category_id] = (paidByCat[item.category_id] || 0) + (item.total || 0)
      })

      const map = {}
      DEMO_BUDGET_CATEGORIES.forEach(cat => {
        const paid = paidByCat[cat.category_id] || 0
        map[cat.category_id] = {
          budget_total: cat.budget_total,
          paid_total: Math.round(paid * 100) / 100,
          available: Math.round((cat.budget_total - paid) * 100) / 100,
        }
      })
      setByCategory(map)
      setByConcept({})
      return
    }

    try {
      const { data, error } = await supabase
        .from('budget_vs_paid')
        .select('*')
        .eq('project_id', projectId)

      if (error) {
        console.warn('useBudgetVsPaid: query failed', error)
        return
      }

      // Aggregate by category_id
      const catMap = {}
      // Store per-concept rows
      const conMap = {}
      ;(data || []).forEach(row => {
        const catId = row.category_id
        if (!catId) return
        if (!catMap[catId]) {
          catMap[catId] = { budget_total: 0, paid_total: 0, available: 0 }
        }
        catMap[catId].budget_total += Number(row.budget_total) || 0
        catMap[catId].paid_total += Number(row.paid_total) || 0

        // Store concept-level data
        if (row.concept_id) {
          conMap[row.concept_id] = {
            budget_total: Number(row.budget_total) || 0,
            paid_total: Number(row.paid_total) || 0,
            available: 0,
          }
        }
      })

      // Compute available
      Object.values(catMap).forEach(entry => {
        entry.available = Math.round((entry.budget_total - entry.paid_total) * 100) / 100
      })
      Object.values(conMap).forEach(entry => {
        entry.available = Math.round((entry.budget_total - entry.paid_total) * 100) / 100
      })

      setByCategory(catMap)
      setByConcept(conMap)
    } catch (err) {
      console.error('useBudgetVsPaid: unexpected error', err)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
    if (!DEMO_MODE) {
      return onAuthReady(() => fetchData())
    }
  }, [fetchData])

  const getBudgetInfo = useCallback((categoryId, conceptId) => {
    if (!categoryId) return null
    // If a concept is selected and we have data for it, return concept-level info
    if (conceptId && byConcept[conceptId]) {
      return byConcept[conceptId]
    }
    // Otherwise fall back to category-level
    return byCategory[categoryId] || null
  }, [byCategory, byConcept])

  return { getBudgetInfo }
}
