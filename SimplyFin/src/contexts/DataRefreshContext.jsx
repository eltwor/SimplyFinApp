import { createContext, useContext, useState, useCallback } from 'react';

// Create context
const DataRefreshContext = createContext();

// Custom hook to use the context
export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within DataRefreshProvider');
  }
  return context;
};

// Provider component
export function DataRefreshProvider({ children }) {
  // Track refresh triggers with timestamps to force re-renders
  const [refreshTriggers, setRefreshTriggers] = useState({
    payments: 0,
    expenses: 0,
    income: 0,
    stats: 0,
    suggestions: 0,
    savings: 0,
    savings_accounts: 0,
    account_types: 0,
    all: 0
  });

  // Trigger a refresh for specific data type
  const triggerRefresh = useCallback((type = 'all') => {
    setRefreshTriggers(prev => ({
      ...prev,
      [type]: prev[type] + 1,
      all: prev.all + 1 // Always increment 'all' for components that refresh on any change
    }));
    
    console.log(`🔄 Data refresh triggered: ${type}`);
  }, []);

  // Get current refresh counter for a specific type
  const getRefreshCounter = useCallback((type) => {
    return refreshTriggers[type] || 0;
  }, [refreshTriggers]);

  const value = {
    triggerRefresh,
    getRefreshCounter,
    refreshTriggers
  };

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
}