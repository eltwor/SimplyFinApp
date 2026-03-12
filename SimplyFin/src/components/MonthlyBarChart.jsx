import { useState } from 'react';

export default function MonthlyBarChart({ data, type = 'expenses', title }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  // Get the color based on type
  const getColor = () => {
    return type === 'expenses' ? 'bg-violet-200' : 'bg-violet-600';
  };
  
  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(d => type === 'expenses' ? d.expenses : d.income), 1);
  
  // Format amount for display
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('pl-PL', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(amount);
  };
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative h-48 flex items-end justify-around space-x-2">
        {data.map((month, i) => {
          const value = type === 'expenses' ? month.expenses : month.income;
          const height = (value / maxValue) * 180; // 180px is max height (h-48 - some padding)
          
          return (
            <div 
              key={i} 
              className="flex-1 relative group"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {hoveredIndex === i && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-10">
                  <div className="font-semibold">{formatAmount(value)} PLN</div>
                  <div className="text-xs text-gray-300">{month.month_name} {month.year}</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
              
              {/* Bar */}
              <div 
                className={`${getColor()} rounded-t transition-all duration-200 hover:opacity-80 cursor-pointer`}
                style={{ height: `${height}px` }}
              ></div>
            </div>
          );
        })}
      </div>
      
      {/* Month labels */}
      <div className="flex justify-around mt-2 text-xs text-gray-500">
        {data.map((month, i) => (
          <span key={i} className="flex-1 text-center">{month.month_name}</span>
        ))}
      </div>
    </div>
  );
}