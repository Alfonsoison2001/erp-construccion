const variants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-yellow-800',
  danger: 'bg-danger-light text-danger',
}

const statusMap = {
  borrador: 'default',
  enviada: 'warning',
  pagada_parcial: 'primary',
  pagada: 'success',
  pendiente: 'warning',
  aprobada: 'success',
}

const statusLabels = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  pagada_parcial: 'Parcial',
  pagada: 'Pagada',
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
}

export default function Badge({ children, variant = 'default', status }) {
  const resolvedVariant = status ? statusMap[status] || 'default' : variant
  const label = status ? statusLabels[status] || status : children

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[resolvedVariant]}`}>
      {label}
    </span>
  )
}
