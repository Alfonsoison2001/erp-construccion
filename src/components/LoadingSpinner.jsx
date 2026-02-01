const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
}

export default function LoadingSpinner({ size = 'md' }) {
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-300 border-t-primary`} />
  )
}
