import { useState } from 'react'
import CategoriesManager from './CategoriesManager'
import ContractorsManager from './ContractorsManager'
import ExchangeRates from './ExchangeRates'
import { useProject } from '../../hooks/useProjectContext'
import EmptyState from '../../components/EmptyState'
import { Settings } from 'lucide-react'

const tabs = [
  { id: 'categories', label: 'Categorías y Conceptos' },
  { id: 'contractors', label: 'Contratistas' },
  { id: 'exchange', label: 'Tipo de Cambio' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('categories')
  const { currentProject } = useProject()

  if (!currentProject) {
    return (
      <EmptyState
        icon={Settings}
        title="Selecciona un proyecto"
        description="Elige un proyecto para administrar sus configuraciones"
      />
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'categories' && <CategoriesManager projectId={currentProject.id} />}
      {activeTab === 'contractors' && <ContractorsManager projectId={currentProject.id} />}
      {activeTab === 'exchange' && <ExchangeRates />}
    </div>
  )
}
