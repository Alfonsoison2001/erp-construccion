import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../auth/AuthContext'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export function useApproval() {
  const { user } = useAuthContext()

  const approveItem = async (itemId, paymentDate) => {
    if (DEMO_MODE) {
      // In demo mode, approval is handled via local state in ApprovalPage
      return
    }
    const { error } = await supabase
      .from('remesa_items')
      .update({
        is_approved: true,
        approved_at: paymentDate || new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', itemId)
    if (error) throw error
  }

  const unapproveItem = async (itemId) => {
    if (DEMO_MODE) {
      return
    }
    const { error } = await supabase
      .from('remesa_items')
      .update({
        is_approved: false,
        approved_at: null,
        approved_by: null,
      })
      .eq('id', itemId)
    if (error) throw error
  }

  const approveAll = async (items, paymentDate) => {
    for (const item of items) {
      await approveItem(item.id, paymentDate)
    }
  }

  const updateRemesaStatus = async (remesaId) => {
    if (DEMO_MODE) {
      return
    }
    // Check all items to determine status
    const { data: items } = await supabase
      .from('remesa_items')
      .select('is_approved')
      .eq('remesa_id', remesaId)

    if (!items || items.length === 0) return

    const approvedCount = items.filter(i => i.is_approved).length
    let newStatus = 'enviada'
    if (approvedCount === items.length) {
      newStatus = 'pagada'
    } else if (approvedCount > 0) {
      newStatus = 'pagada_parcial'
    }

    await supabase
      .from('remesas')
      .update({ status: newStatus })
      .eq('id', remesaId)
  }

  return { approveItem, unapproveItem, approveAll, updateRemesaStatus }
}
