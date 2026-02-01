import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../auth/AuthContext'
import { DEMO_REMESAS_ALL, DEMO_REMESA_ITEMS_ALL, persistDemoData } from '../../lib/demoData'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export function useRemesas(projectId) {
  const [remesas, setRemesas] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  const fetchRemesas = useCallback(async () => {
    if (!projectId) { setRemesas([]); setLoading(false); return }
    setLoading(true)

    if (DEMO_MODE) {
      const filtered = DEMO_REMESAS_ALL.filter(r => r.project_id === projectId)
      setRemesas(filtered)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('remesas')
      .select('*, profiles:created_by(full_name)')
      .eq('project_id', projectId)
      .order('remesa_number', { ascending: false })
    if (!error) setRemesas(data || [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchRemesas() }, [fetchRemesas])

  const getNextNumber = async () => {
    if (DEMO_MODE) {
      const allForProject = DEMO_REMESAS_ALL.filter(r => r.project_id === projectId)
      const maxNum = allForProject.reduce((max, r) => Math.max(max, r.remesa_number || 0), 0)
      return maxNum + 1
    }
    const { data } = await supabase
      .from('remesas')
      .select('remesa_number')
      .eq('project_id', projectId)
      .order('remesa_number', { ascending: false })
      .limit(1)
    return (data?.[0]?.remesa_number || 0) + 1
  }

  const createRemesa = async (remesaData) => {
    const number = await getNextNumber()
    if (DEMO_MODE) {
      const newRemesa = {
        ...remesaData,
        id: 'rem-demo-' + Date.now(),
        project_id: projectId,
        remesa_number: number,
        created_by: 'demo-user',
        profiles: { full_name: 'Admin Demo' },
        status: remesaData.status || 'borrador',
        total_amount: remesaData.total_amount || 0,
      }
      DEMO_REMESAS_ALL.push(newRemesa)
      persistDemoData()
      setRemesas(prev => [newRemesa, ...prev])
      return newRemesa
    }
    const { data, error } = await supabase
      .from('remesas')
      .insert({
        ...remesaData,
        project_id: projectId,
        remesa_number: number,
        created_by: user.id,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  const updateRemesa = async (id, updates) => {
    if (DEMO_MODE) {
      // Update global array
      const idx = DEMO_REMESAS_ALL.findIndex(r => r.id === id)
      if (idx >= 0) Object.assign(DEMO_REMESAS_ALL[idx], updates)
      persistDemoData()
      setRemesas(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
      return
    }
    const { error } = await supabase.from('remesas').update(updates).eq('id', id)
    if (error) throw error
    await fetchRemesas()
  }

  const deleteRemesa = async (id) => {
    if (DEMO_MODE) {
      const idx = DEMO_REMESAS_ALL.findIndex(r => r.id === id)
      if (idx >= 0) DEMO_REMESAS_ALL.splice(idx, 1)
      for (let i = DEMO_REMESA_ITEMS_ALL.length - 1; i >= 0; i--) {
        if (DEMO_REMESA_ITEMS_ALL[i].remesa_id === id) DEMO_REMESA_ITEMS_ALL.splice(i, 1)
      }
      persistDemoData()
      setRemesas(prev => prev.filter(r => r.id !== id))
      return
    }
    const { error } = await supabase.from('remesas').delete().eq('id', id)
    if (error) throw error
    await fetchRemesas()
  }

  const sendRemesa = async (id) => {
    await updateRemesa(id, { status: 'enviada' })
  }

  return { remesas, loading, createRemesa, updateRemesa, deleteRemesa, sendRemesa, refresh: fetchRemesas }
}

export function useRemesaDetail(remesaId) {
  const [remesa, setRemesa] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDetail = useCallback(async () => {
    if (!remesaId) { setLoading(false); return }
    setLoading(true)

    if (DEMO_MODE) {
      const foundRemesa = DEMO_REMESAS_ALL.find(r => r.id === remesaId)
      const foundItems = DEMO_REMESA_ITEMS_ALL.filter(i => i.remesa_id === remesaId).map(item => ({
        ...item,
        category_name: item.category_name || item.categories?.name,
        concept_name: item.concept_name || item.concepts?.name,
      }))
      setRemesa(foundRemesa ? { ...foundRemesa, projects: { name: 'Bosques de Olmos #13', owner_name: 'Alfredo Isón Zaga' } } : null)
      setItems(foundItems)
      setLoading(false)
      return
    }

    const { data: remesaData } = await supabase
      .from('remesas')
      .select('*, profiles:created_by(full_name), projects:project_id(name, owner_name)')
      .eq('id', remesaId)
      .single()

    const { data: itemsData } = await supabase
      .from('remesa_items')
      .select(`
        *,
        categories:category_id(name),
        concepts:concept_id(name)
      `)
      .eq('remesa_id', remesaId)
      .order('section')
      .order('line_number')

    setRemesa(remesaData)
    setItems((itemsData || []).map(item => ({
      ...item,
      category_name: item.categories?.name,
      concept_name: item.concepts?.name,
    })))
    setLoading(false)
  }, [remesaId])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const addItem = async (item) => {
    if (DEMO_MODE) {
      const sectionItems = items.filter(i => i.section === item.section)
      const lineNumber = sectionItems.length + 1
      const newItem = {
        ...item,
        id: 'ri-demo-' + Date.now(),
        remesa_id: remesaId,
        line_number: lineNumber,
        is_approved: false,
        approved_at: null,
        approved_by: null,
        category_name: item.categories?.name || item.category_name,
        concept_name: item.concepts?.name || item.concept_name,
      }
      DEMO_REMESA_ITEMS_ALL.push(newItem)
      persistDemoData()
      setItems(prev => [...prev, newItem])
      return newItem
    }
    const sectionItems = items.filter(i => i.section === item.section)
    const lineNumber = sectionItems.length + 1
    const { data, error } = await supabase
      .from('remesa_items')
      .insert({ ...item, remesa_id: remesaId, line_number: lineNumber })
      .select()
      .single()
    if (error) throw error
    await fetchDetail()
    return data
  }

  const updateItem = async (id, updates) => {
    if (DEMO_MODE) {
      // Update global array
      const globalIdx = DEMO_REMESA_ITEMS_ALL.findIndex(i => i.id === id)
      if (globalIdx >= 0) Object.assign(DEMO_REMESA_ITEMS_ALL[globalIdx], updates)
      persistDemoData()
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
      return
    }
    const { error } = await supabase.from('remesa_items').update(updates).eq('id', id)
    if (error) throw error
    await fetchDetail()
  }

  const deleteItem = async (id) => {
    if (DEMO_MODE) {
      const globalIdx = DEMO_REMESA_ITEMS_ALL.findIndex(i => i.id === id)
      if (globalIdx >= 0) DEMO_REMESA_ITEMS_ALL.splice(globalIdx, 1)
      persistDemoData()
      setItems(prev => prev.filter(item => item.id !== id))
      return
    }
    const { error } = await supabase.from('remesa_items').delete().eq('id', id)
    if (error) throw error
    await fetchDetail()
  }

  return { remesa, items, loading, addItem, updateItem, deleteItem, refresh: fetchDetail }
}
