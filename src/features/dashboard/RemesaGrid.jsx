import { useNavigate } from 'react-router-dom'
import Card, { CardBody } from '../../components/Card'
import Badge from '../../components/Badge'
import { formatCurrency, formatDateShort, formatRemesaNumber } from '../../lib/formatters'
import { Receipt } from 'lucide-react'

export default function RemesaGrid({ remesas }) {
  const navigate = useNavigate()

  if (!remesas || remesas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Receipt size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm">Sin remesas</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {remesas.map(r => {
        const approvedAmount = 0 // This would need a join/subquery; shown for structure
        return (
          <Card
            key={r.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/remesas/${r.id}`)}
          >
            <CardBody>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">
                    {formatRemesaNumber(r.remesa_number, r.remesa_suffix)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDateShort(r.date)}</p>
                </div>
                <Badge status={r.status} />
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold">{formatCurrency(r.total_amount)}</p>
                </div>
                {r.profiles?.full_name && (
                  <p className="text-xs text-gray-400">{r.profiles.full_name}</p>
                )}
              </div>

              {r.week_description && (
                <p className="text-xs text-gray-400 mt-2 truncate">{r.week_description}</p>
              )}
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
