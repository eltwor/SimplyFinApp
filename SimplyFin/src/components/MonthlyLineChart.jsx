import { useState } from 'react';

export default function MonthlyLineChart({ data, type = 'expenses', title }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  // Get the color based on type
  const getColor = () => {
    return type === 'expenses' ? '#ef4444' : '#10b981';
  };
  
  // Calculate max value for scaling
  const values = data.map(d => type === 'expenses' ? d.expenses : d.income);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  
  // Format amount for display
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('pl-PL', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(amount);
  };
  
  // Calculate SVG points for the line
  const calculatePoints = () => {
    const width = 300;
    const height = 150;
    const padding = 20;
    const usableWidth = width - (padding * 2);
    const usableHeight = height - (padding * 2);
    
    return data.map((month, i) => {
      const value = type === 'expenses' ? month.expenses : month.income;
      const x = padding + (i / (data.length - 1)) * usableWidth;
      const y = padding + usableHeight - ((value - minValue) / (maxValue - minValue || 1)) * usableHeight;
      
      return { x, y, value, month };
    });
  };
  
  const points = calculatePoints();
  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-48 flex items-center justify-center text-gray-400">
          Brak danych do wyświetlenia
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative h-48">
        <svg viewBox="0 0 300 150" className="w-full h-full">
          {/* Grid lines */}
          <line x1="20" y1="20" x2="20" y2="130" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="20" y1="130" x2="280" y2="130" stroke="#e5e7eb" strokeWidth="1" />
          
          {/* Horizontal grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="20"
              y1={20 + (i * 27.5)}
              x2="280"
              y2={20 + (i * 27.5)}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Line path */}
          <polyline
            points={linePoints}
            fill="none"
            stroke={getColor()}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === i ? 6 : 4}
                fill="white"
                stroke={getColor()}
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              
              {/* Tooltip */}
              {hoveredIndex === i && (
                <>
                  <rect
                    x={point.x - 40}
                    y={point.y - 50}
                    width="80"
                    height="40"
                    rx="4"
                    fill="#1f2937"
                    opacity="0.95"
                  />
                  <text
                    x={point.x}
                    y={point.y - 35}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {formatAmount(point.value)} PLN
                  </text>
                  <text
                    x={point.x}
                    y={point.y - 22}
                    textAnchor="middle"
                    fill="#d1d5db"
                    fontSize="8"
                  >
                    {point.month.month_name} {point.month.year}
                  </text>
                </>
              )}
            </g>
          ))}
          
          {/* Month labels */}
          {points.map((point, i) => (
            <text
              key={i}
              x={point.x}
              y="145"
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {point.month.month_name}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}