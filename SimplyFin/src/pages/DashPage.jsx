import { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import Modal from "../components/UI/Modal";
import PaymentModal from "../components/PaymentModal";
import RecentTransactions from "../components/RecentTransactions";
import MonthlyBarChart from "../components/MonthlyBarChart";
import ExpensesDonutChart from "../components/ExpensesDonutChart";
import TopBar from "../components/TopBar";
import WrapperNav from "../components/WrapperNav";
import { 
  getRecentPayments, 
  deletePayment, 
  getMonthlyStats, 
  getStatsWithComparison,
  getSavingsGoals,
  getSavingsAccounts
} from "../services/api";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export default function DashPage() {  
  const { triggerRefresh, getRefreshCounter } = useDataRefresh();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalToggle, setModalToggle] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    current_month: { expenses: 0, income: 0, balance: 0 },
    previous_month: { expenses: 0, income: 0, balance: 0 },
    changes: { expense_change: 0, income_change: 0, balance_change: 0 },
    expenses_by_category: []
  });
  const [savingsData, setSavingsData] = useState({
    mostRecentGoal: null,
    accountsCount: 0
  });

  useEffect(() => {
    fetchData();
  }, [getRefreshCounter('payments'), getRefreshCounter('stats'), getRefreshCounter('savings'), getRefreshCounter('account_types')]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [payments, statsData, monthlyStatsData, savingsGoals, savingsAccounts] = await Promise.all([
        getRecentPayments(),
        getStatsWithComparison(),
        getMonthlyStats(6),
        getSavingsGoals(),
        getSavingsAccounts()
      ]);
      
      const formattedPayments = payments.map(payment => ({
        id: payment.id,
        title: payment.title,
        category: payment.category,
        amount: parseFloat(payment.amount),
        date: formatDate(payment.payment_date),
        type: payment.payment_type,
        account_member_id: payment.account_member_id,
        member_nickname: payment.member_nickname || "Użytkownik",
        is_recurring: payment.is_recurring || false,
        recurring_frequency: payment.recurring_frequency
      }));
      
      // Find most recently updated active goal
      const activeGoals = savingsGoals.filter(goal => !goal.is_completed);
      const mostRecentGoal = activeGoals.length > 0 
        ? activeGoals.reduce((latest, goal) => {
            const latestDate = new Date(latest.updated_at);
            const goalDate = new Date(goal.updated_at);
            return goalDate > latestDate ? goal : latest;
          })
        : null;

      setRecentTransactions(formattedPayments);
      setStats(statsData);
      setMonthlyData(monthlyStatsData.months || []);
      setSavingsData({
        mostRecentGoal,
        accountsCount: savingsAccounts.length
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const modalHandler = () => {
    setModalToggle(!modalToggle);
  };

  const handlePaymentAdded = () => {
    setModalToggle(false);
  };

  const handlePaymentUpdated = () => {
    triggerRefresh('payments');
  };

  const handlePaymentDeleted = async (paymentId) => {
    try {
      await deletePayment(paymentId);
      triggerRefresh('payments');
    } catch (err) {
      console.error('Error deleting payment:', err);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('pl-PL', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(amount);
  };

  const formatChange = (change) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <WrapperNav isSettingOpen={sidebarOpen}>
        <TopBar title="Przegląd" openSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Ładowanie...</div>
          </div>
        </main>
      </WrapperNav>
    );
  }

  return (
    <WrapperNav isSettingOpen={sidebarOpen}>
      <TopBar title="Przegląd" openSidebar={() => setSidebarOpen(true)}> 
        <button 
          onClick={() => setModalToggle(true)} 
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span className="hidden sm:inline">Dodaj płatność</span>
        </button>
      </TopBar>

      <Modal isOpen={modalToggle} onClose={modalHandler}>
        <PaymentModal onClose={() => setModalToggle(false)} onSubmit={handlePaymentAdded} />
      </Modal>

      {/* Dashboard Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            title="Wydatki (bieżący miesiąc)" 
            amount={formatAmount(stats.current_month.expenses)}
            badge={{ 
              type: stats.changes.expense_change >= 0 ? 'negative' : 'positive', 
              value: formatChange(stats.changes.expense_change) 
            }}
          />
          <StatCard 
            title="Dochody (bieżący miesiąc)" 
            amount={formatAmount(stats.current_month.income)}
            badge={{ 
              type: stats.changes.income_change >= 0 ? 'positive' : 'negative', 
              value: formatChange(stats.changes.income_change) 
            }}
          />
          <StatCard 
            title="Bilans" 
            amount={formatAmount(stats.current_month.balance)}
            change={formatChange(stats.changes.balance_change)}
            isPositive={stats.current_month.balance >= 0}
          />
          
          {/* Savings Accounts Count */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Liczba aktywnych kont</p>
            <p className="text-5xl font-bold text-gray-900">{savingsData.accountsCount}</p>
            <p className="text-xs text-gray-500 mt-2">kont oszczędnościowych</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Savings Goal Progress */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktywny cel oszczędności</h3>
            {savingsData.mostRecentGoal ? (
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="12"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * Math.min(savingsData.mostRecentGoal.progress_percentage, 100) / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {Math.round(savingsData.mostRecentGoal.progress_percentage)}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-violet-600 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">
                      {savingsData.mostRecentGoal.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {savingsData.mostRecentGoal.current_amount.toFixed(2)} PLN / {parseFloat(savingsData.mostRecentGoal.target_amount).toFixed(2)} PLN
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Brak aktywnych celów</p>
                <p className="text-xs mt-1">Stwórz cel w zakładce Oszczędności</p>
              </div>
            )}
          </div>

          {/* Monthly Expenses Chart */}
          <MonthlyBarChart 
            data={monthlyData} 
            type="expenses"
            title="Wydatki w ostatnim okresie (6 miesięcy)"
          />

          {/* Monthly Income Chart */}
          <MonthlyBarChart 
            data={monthlyData} 
            type="income"
            title="Zarobki w ostatnim okresie (6 miesięcy)"
          />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <RecentTransactions 
            transactions={recentTransactions}
            onUpdate={handlePaymentUpdated}
            onDelete={handlePaymentDeleted}
          />

          {/* Spending Donut Chart */}
          <ExpensesDonutChart 
            data={stats.expenses_by_category}
            title="Ostatnie wydatki (bieżący miesiąc)"
          />
        </div>
      </main>
    </WrapperNav>
  );
}