export default function Select({ label, options = [], error, className = '', placeholder, ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 rounded-lg border ${
          error ? 'border-danger' : 'border-gray-300'
        } focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors text-sm bg-white`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
