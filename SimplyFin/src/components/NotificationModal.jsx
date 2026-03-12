import { useState, useEffect } from 'react';
import { Bell, Check, X, Repeat, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import { getPaymentSuggestions, acceptPaymentSuggestion, dismissPaymentSuggestion } from '../services/api';
import { useDataRefresh } from '../contexts/DataRefreshContext';

export default function NotificationModal({ isOpen, onClose }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Get refresh system
  const { triggerRefresh } = useDataRefresh();

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const data = await getPaymentSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (suggestion) => {
    try {
      setProcessingId(suggestion.id);
      await acceptPaymentSuggestion(suggestion.id);
      
      // Remove from list
      setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
      
      // Trigger global refresh - this will update ALL components!
      triggerRefresh('payments');
      triggerRefresh('suggestions');
      
      console.log('✅ Payment added successfully!');
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
      alert('Błąd podczas dodawania płatności');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (suggestion) => {
    try {
      setProcessingId(suggestion.id);
      await dismissPaymentSuggestion(suggestion.id);
      
      // Remove from list
      setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
      
      // Trigger suggestion refresh
      triggerRefresh('suggestions');
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
      alert('Błąd podczas odrzucania powiadomienia');
    } finally {
      setProcessingId(null);
    }
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: 'Codziennie',
      weekly: 'Co tydzień',
      monthly: 'Co miesiąc',
      yearly: 'Co rok'
    };
    return labels[frequency] || frequency;
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('pl-PL', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(Math.abs(parseFloat(amount)));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                <Bell size={20} className="text-violet-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Powiadomienia</h2>
                <p className="text-sm text-gray-500">
                  {suggestions.length > 0 
                    ? `Masz ${suggestions.length} oczekujących płatności` 
                    : 'Brak nowych powiadomień'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Ładowanie...</div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell size={64} className="text-gray-300 mb-4" />
              <p className="text-lg font-medium">Brak powiadomień</p>
              <p className="text-sm mt-1">Wszystkie płatności są aktualne</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-violet-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      suggestion.payment_type === 'expense' 
                        ? 'bg-red-100' 
                        : 'bg-green-100'
                    }`}>
                      {suggestion.payment_type === 'expense' ? (
                        <TrendingDown size={24} className="text-red-600" />
                      ) : (
                        <TrendingUp size={24} className="text-green-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {suggestion.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Repeat size={14} className="text-violet-600" />
                            <span className="text-sm text-gray-600">
                              {getFrequencyLabel(suggestion.recurring_frequency)}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600 capitalize">
                              {suggestion.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            suggestion.payment_type === 'expense' 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {suggestion.payment_type === 'expense' ? '-' : '+'}
                            {formatAmount(suggestion.amount)} PLN
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        <span>Sugerowana data: {formatDate(suggestion.suggested_date)}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleAccept(suggestion)}
                          disabled={processingId === suggestion.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Check size={18} />
                          {processingId === suggestion.id ? 'Dodawanie...' : 'Dodaj płatność'}
                        </button>
                        <button
                          onClick={() => handleDismiss(suggestion)}
                          disabled={processingId === suggestion.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X size={18} />
                          {processingId === suggestion.id ? 'Odrzucanie...' : 'Pomiń'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestions.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 text-center">
              Powiadomienia są generowane na podstawie płatności cyklicznych
            </p>
          </div>
        )}
      </div>
    </div>
  );
}