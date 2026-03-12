import { useState } from 'react';

export default function ExpensesDonutChart({ data, title = "Ostatnie wydatki (30 dni)" }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.total, 0);
  
  // Format amount
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('pl-PL', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(amount);
  };
  
  // Calculate percentages and create chart segments
  const calculateSegments = () => {
    if (total === 0) return [];
    
    let currentAngle = 0;
    const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];
    
    return data.map((item, index) => {
      const percentage = (item.total / total) * 100;
      const angle = (percentage / 100) * 360;
      const segment = {
        category: item.category,
        total: item.total,
        percentage: percentage.toFixed(1),
        startAngle: currentAngle,
        angle: angle,
        color: colors[index % colors.length]
      };
      currentAngle += angle;
      return segment;
    });
  };
  
  const segments = calculateSegments();
  
  // Create SVG path for donut segment
  const createArc = (startAngle, angle) => {
    const radius = 35;
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (startAngle + angle - 90) * Math.PI / 180;
    
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };
  
  if (data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          Brak danych do wyświetlenia
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-64 h-64">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createArc(segment.startAngle, segment.angle)}
                fill={segment.color}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={() => setSelectedCategory(segment)}
                onMouseLeave={() => setSelectedCategory(null)}
              />
            ))}
            {/* Center circle */}
            <circle cx="50" cy="50" r="20" fill="white" />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {selectedCategory ? (
                <>
                  <p className="text-sm text-gray-600">{selectedCategory.category}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(selectedCategory.total)}</p>
                  <p className="text-xs text-gray-500">{selectedCategory.percentage}%</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Razem</p>
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(total)}</p>
                  <p className="text-xs text-gray-500">PLN</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {segments.map((segment, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              onMouseEnter={() => setSelectedCategory(segment)}
              onMouseLeave={() => setSelectedCategory(null)}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: segment.color }}
              ></div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-900 font-medium">{segment.category}</span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatAmount(segment.total)} PLN</span>
                  <span>•</span>
                  <span>{segment.percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}