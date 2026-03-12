import { useState, useEffect } from "react";
import { History, Trash2, TrendingUp, TrendingDown, X } from "lucide-react";
import { getSavingsDeposits, deleteSavingsDeposit } from "../services/api";

export default function TransactionHistoryModal({ 
  goal, 
  accountMembers = [],
  currentUser,
  onClose,
  onUpdate 
}) {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeposits();
  }, [goal.id]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const data = await getSavingsDeposits(goal.id);
      setDeposits(data);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (depositId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę transakcję?')) return;

    try {
      await deleteSavingsDeposit(depositId);
      await fetchDeposits();
      onUpdate(); // Refresh the goal to update current amount
    } catch (error) {
      console.error('Error deleting deposit:', error);
      alert('Nie udało się usunąć transakcji');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMemberName = (deposit) => {
    if (!deposit.member_nickname) {
      return currentUser?.nickname || 'Ty';
    }
    return deposit.member_nickname;
  };

  // Calculate summary stats
  const totalDeposits = deposits
    .filter(d => d.transaction_type === 'deposit')
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  const totalWithdrawals = deposits
    .filter(d => d.transaction_type === 'withdrawal')
    .reduce((sum, d) => sum + Math.abs(parseFloat(d.amount)), 0);

  const transactionCount = deposits.length;

  return (
    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
            <History className="text-violet-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Historia transakcji</h2>
            <p className="text-sm text-gray-500">Cel: {goal.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Wpłaty</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {totalDeposits.toFixed(2)} PLN
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={20} className="text-red-600" />
            <span className="text-sm font-medium text-red-900">Wypłaty</span>
          </div>
          <p className="text-2xl font-bold text-red-700">
            {totalWithdrawals.toFixed(2)} PLN
          </p>
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <History size={20} className="text-violet-600" />
            <span className="text-sm font-medium text-violet-900">Transakcje</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">
            {transactionCount}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Ładowanie transakcji...
        </div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-12">
          <History size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Brak transakcji dla tego celu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deposits.map((deposit) => {
            const isDeposit = deposit.transaction_type === 'deposit';
            const amount = Math.abs(parseFloat(deposit.amount));

            return (
              <div
                key={deposit.id}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  isDeposit 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-full ${
                        isDeposit ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {isDeposit ? (
                          <TrendingUp size={20} className="text-green-600" />
                        ) : (
                          <TrendingDown size={20} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-bold ${
                            isDeposit ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {isDeposit ? '+' : '-'}{amount.toFixed(2)} PLN
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            isDeposit 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-red-200 text-red-800'
                          }`}>
                            {isDeposit ? 'WPŁATA' : 'WYPŁATA'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(deposit.transaction_date)}
                        </p>
                      </div>
                    </div>

                    <div className="ml-14 space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Osoba:</span> {getMemberName(deposit)}
                      </p>
                      {deposit.notes && (
                        <p className="text-sm text-gray-600 italic">
                          {deposit.notes}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Dodano: {formatDate(deposit.created_at)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(deposit.id)}
                    className="ml-4 p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Usuń transakcję"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Current Balance */}
      <div className="mt-6 p-4 bg-violet-100 border-2 border-violet-300 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-violet-900">
            Aktualny stan oszczędności:
          </span>
          <span className="text-2xl font-bold text-violet-700">
            {goal.current_amount.toFixed(2)} PLN
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-violet-800">
          <span>Cel: {parseFloat(goal.target_amount).toFixed(2)} PLN</span>
          <span>{goal.progress_percentage.toFixed(1)}% ukończone</span>
        </div>
      </div>
    </div>
  );
}