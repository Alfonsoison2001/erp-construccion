import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../auth/AuthContext'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

const DEMO_PROJECTS = [
  { id: 'demo-p1', name: 'Bosques de Olmos #13', owner_name: 'Alfredo Isón Zaga', address: 'Bosques de Olmos #13, Monterrey', start_date: '2025-01-15', project_operators: [{ operator_id: 'op1', profiles: { id: 'op1', full_name: 'Aaron Coronado', role: 'operador' } }] },
  { id: 'demo-p2', name: 'Residencial Las Águilas', owner_name: 'Carlos Mendez', address: 'Las Águilas #200, San Pedro', start_date: '2025-03-01', project_operators: [] },
]

const DEMO_OPERATORS = [
  { id: 'op1', full_name: 'Aaron Coronado', role: 'operador' },
  { id: 'op2', full_name: 'Luis García', role: 'operador' },
]

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAdmin, user } = useAuthContext()

  const fetchProjects = useCallback(async () => {
    setLoading(true)

    if (DEMO_MODE) {
      setProjects([...DEMO_PROJECTS])
      setLoading(false)
      return
    }

    let query = supabase.from('projects').select(`
      *,
      project_operators (
        operator_id,
        profiles:operator_id ( id, full_name, role )
      )
    `).order('created_at', { ascending: false })

    if (!isAdmin) {
      const { data: assignments } = await supabase
        .from('project_operators')
        .select('project_id')
        .eq('operator_id', user.id)
      const ids = assignments?.map(a => a.project_id) || []
      if (ids.length > 0) {
        query = query.in('id', ids)
      } else {
        setProjects([])
        setLoading(false)
        return
      }
    }

    const { data, error } = await query
    if (!error) setProjects(data || [])
    setLoading(false)
  }, [isAdmin, user])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = async (project) => {
    if (DEMO_MODE) {
      const newProject = { ...project, id: 'demo-p' + Date.now(), project_operators: [], created_by: 'demo-user' }
      setProjects(prev => [newProject, ...prev])
      return newProject
    }
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, created_by: user.id })
      .select()
      .single()
    if (error) throw error
    await fetchProjects()
    return data
  }

  const updateProject = async (id, updates) => {
    if (DEMO_MODE) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      return
    }
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
    if (error) throw error
    await fetchProjects()
  }

  const deleteProject = async (id) => {
    if (DEMO_MODE) {
      setProjects(prev => prev.filter(p => p.id !== id))
      return
    }
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetchProjects()
  }

  const assignOperator = async (projectId, operatorId) => {
    if (DEMO_MODE) {
      setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p
        const op = DEMO_OPERATORS.find(o => o.id === operatorId) || { id: operatorId, full_name: 'Operador', role: 'operador' }
        return { ...p, project_operators: [...(p.project_operators || []), { operator_id: operatorId, profiles: op }] }
      }))
      return
    }
    const { error } = await supabase
      .from('project_operators')
      .insert({ project_id: projectId, operator_id: operatorId })
    if (error) throw error
    await fetchProjects()
  }

  const removeOperator = async (projectId, operatorId) => {
    if (DEMO_MODE) {
      setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p
        return { ...p, project_operators: (p.project_operators || []).filter(po => po.operator_id !== operatorId) }
      }))
      return
    }
    const { error } = await supabase
      .from('project_operators')
      .delete()
      .eq('project_id', projectId)
      .eq('operator_id', operatorId)
    if (error) throw error
    await fetchProjects()
  }

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    assignOperator,
    removeOperator,
    refresh: fetchProjects,
  }
}

export function useOperators() {
  const [operators, setOperators] = useState([])

  useEffect(() => {
    if (DEMO_MODE) {
      setOperators(DEMO_OPERATORS)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'operador')
      .order('full_name')
      .then(({ data }) => setOperators(data || []))
  }, [])

  return operators
}
