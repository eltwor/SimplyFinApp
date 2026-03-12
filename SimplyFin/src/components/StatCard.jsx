// Stat Card Component
export default function StatCard({ title, amount, change, isPositive, badge }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{title}</p>
        {badge && (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            badge.type === 'negative' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
          }`}>
            {badge.value}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900">{amount} PLN</p>
      {change && (
        <p className={`text-sm mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </p>
      )}
    </div>
  );
}