import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { DEMO_REMESAS_ALL, DEMO_REMESA_ITEMS_ALL } from '../../lib/demoData'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

function groupByContractor(items) {
  const map = {}
  for (const item of items) {
    const name = item.contractor_name || 'Sin nombre'
    if (!map[name]) {
      map[name] = { contractor_name: name, amount: 0, vat_amount: 0, total: 0, count: 0, items: [] }
    }
    map[name].amount += Number(item.amount) || 0
    map[name].vat_amount += Number(item.vat_amount || item.iva_amount) || 0
    map[name].total += Number(item.total) || 0
    map[name].count += 1
    map[name].items.push(item)
  }
  return Object.values(map).sort((a, b) => b.total - a.total)
}

export function useProveedores(projectId) {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProveedores = useCallback(async () => {
    if (!projectId) { setProveedores([]); setLoading(false); return }
    setLoading(true)

    if (DEMO_MODE) {
      const projectRemesaIds = DEMO_REMESAS_ALL
        .filter(r => r.project_id === projectId)
        .map(r => r.id)

      const approvedItems = DEMO_REMESA_ITEMS_ALL
        .filter(i => projectRemesaIds.includes(i.remesa_id) && i.is_approved)
        .map(item => {
          const remesa = DEMO_REMESAS_ALL.find(r => r.id === item.remesa_id)
          return {
            ...item,
            vat_amount: item.iva_amount,
            remesa_number: remesa?.remesa_number,
            remesa_suffix: remesa?.remesa_suffix,
            remesa_date: remesa?.date,
          }
        })

      setProveedores(groupByContractor(approvedItems))
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('remesa_items')
      .select('contractor_name, description, amount, vat_amount:iva_amount, total, is_approved, approved_at, remesa_id, remesas!inner(project_id, remesa_number, remesa_suffix, date)')
      .eq('remesas.project_id', projectId)
      .eq('is_approved', true)

    if (!error && data) {
      const items = data.map(item => ({
        ...item,
        remesa_number: item.remesas?.remesa_number,
        remesa_suffix: item.remesas?.remesa_suffix,
        remesa_date: item.remesas?.date,
      }))
      setProveedores(groupByContractor(items))
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchProveedores() }, [fetchProveedores])

  return { proveedores, loading, refresh: fetchProveedores }
}
