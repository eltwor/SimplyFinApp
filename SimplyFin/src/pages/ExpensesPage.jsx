import { useState, useEffect } from "react";
import { ChevronDown, Calendar, Settings, Search, Plus, AlertTriangle } from "lucide-react";
import TopBar from "../components/TopBar";
import WrapperNav from "../components/WrapperNav";
import Modal from "../components/UI/Modal";
import PaymentModal from "../components/PaymentModal";
import ExpensesTable from "../components/ExpensesTable";
import MonthlyLineChart from "../components/MonthlyLineChart";
import CategoryLimitsModal from "../components/CategoryLimitsModal";
import { getExpenses, getPaymentStats, deletePayment, getAccountMembers, getCurrentUser, getMonthlyStats, getAccountTypes, getCategoryLimits } from "../services/api";

export default function ExpensesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMember, setSelectedMember] = useState("all");
  const [selectedAccountType, setSelectedAccountType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limitsModalOpen, setLimitsModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  // Data state
  const [allExpenses, setAllExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [accountMembers, setAccountMembers] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [categoryLimits, setCategoryLimits] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [expensesData, statsData, membersData, userData, monthlyStatsData, accountTypesData, limitsData] = await Promise.all([
        getExpenses(null, null, null),
        getPaymentStats(30),
        getAccountMembers(),
        getCurrentUser(),
        getMonthlyStats(6),
        getAccountTypes(),
        getCategoryLimits()
      ]);
      
      // Format expenses with proper date formatting
      const formattedExpenses = expensesData.map(expense => ({
        id: expense.id,
        title: expense.title,
        category: expense.category,
        amount: Math.abs(parseFloat(expense.amount)),
        date: formatDate(expense.payment_date),
        member_nickname: expense.member_nickname,
        account_member_id: expense.account_member_id,
        account_type: expense.account_type || 'default',
        is_recurring: expense.is_recurring || false,
        recurring_frequency: expense.recurring_frequency
      }));
      
      setAllExpenses(formattedExpenses);
      setStats(statsData);
      setMonthlyData(monthlyStatsData.months || []);
      setAccountMembers(membersData.filter(m => m.is_active));
      setAccountTypes(accountTypesData.filter(t => t.is_active));
      setCategoryLimits(limitsData);
      setCurrentUser(userData);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
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

  const handleExpenseUpdated = () => {
    fetchData();
  };

  const handleExpenseDeleted = async (expenseId) => {
    try {
      await deletePayment(expenseId);
      fetchData();
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const handleExpenseAdded = () => {
    fetchData();
    setAddModalOpen(false);
  };

  const categories = [
    { value: 'all', label: 'Wszystkie kategorie' },
    { value: 'mieszkanie', label: 'Mieszkanie' },
    { value: 'jedzenie', label: 'Jedzenie' },
    { value: 'rozrywka', label: 'Rozrywka' },
    { value: 'transport', label: 'Transport' },
    { value: 'zakupy', label: 'Zakupy' },
    { value: 'inne', label: 'Inne' },
  ];

  // Extract unique nicknames from actual expense data
  const uniqueMemberNicknames = [...new Set(
    allExpenses
      .map(expense => expense.member_nickname)
      .filter(Boolean)
  )].sort();

  // Create filter options from nicknames
  const memberFilterOptions = [
    { value: 'all', label: 'Wszystkie osoby' },
    { value: 'default', label: currentUser?.nickname || 'Ty (domyślne)' },
    ...uniqueMemberNicknames
      .filter(nickname => nickname !== currentUser?.nickname)
      .map(nickname => ({
        value: nickname,
        label: nickname
      }))
  ];

  // Filter expenses based on all criteria
  const filteredExpenses = allExpenses.filter((expense) => {
    // Search filter
    const matchesSearch = expense.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    
    // Member filter
    let matchesMember = true;
    if (selectedMember !== 'all') {
      if (selectedMember === 'default') {
        matchesMember = !expense.member_nickname || expense.member_nickname === currentUser?.nickname;
      } else {
        matchesMember = expense.member_nickname === selectedMember;
      }
    }
    
    // Account type filter
    const matchesAccountType = selectedAccountType === 'all' || expense.account_type === selectedAccountType;
    
    // Date range filter
    const expenseDate = new Date(expense.date.split('-').reverse().join('-'));
    const matchesStartDate = !startDate || expenseDate >= new Date(startDate);
    const matchesEndDate = !endDate || expenseDate <= new Date(endDate);
    
    return matchesSearch && matchesCategory && matchesMember && matchesAccountType && matchesStartDate && matchesEndDate;
  });

  // Create summary from stats with limit checking
  const summary = stats ? {
    categories: stats.expenses_by_category.map(cat => {
      const limit = categoryLimits.find(l => l.category === cat.category);
      const exceeded = limit && cat.total > parseFloat(limit.limit_amount);
      return {
        name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
        amount: cat.total,
        limit: limit ? parseFloat(limit.limit_amount) : null,
        exceeded: exceeded
      };
    }),
    totalSpent: stats.total_expenses
  } : { categories: [], totalSpent: 0 };

  return (
    <WrapperNav isSettingOpen={sidebarOpen}>
      <TopBar title="Wydatki" openSidebar={() => setSidebarOpen(true)}>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setAddModalOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Dodaj wydatek</span>
          </button>
          <button 
            onClick={() => setLimitsModalOpen(true)}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Limity</span>
          </button>
        </div>
      </TopBar>

      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Ładowanie wydatków...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Section - Chart and Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Chart Card */}
              <MonthlyLineChart 
                data={monthlyData}
                type="expenses"
                title="Wydatki w ostatnim okresie (6 miesięcy)"
              />

              {/* Summary Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Podsumowanie (30 dni)
                  </h3>
                </div>

                <div className="space-y-4">
                  {summary.categories.length > 0 ? (
                    summary.categories.map((cat, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                            {cat.exceeded && (
                              <AlertTriangle size={16} className="text-red-500" title="Przekroczono limit!" />
                            )}
                          </div>
                          <span className={`text-sm font-semibold ${cat.exceeded ? 'text-red-600' : 'text-gray-900'}`}>
                            {cat.amount.toFixed(2)} PLN
                          </span>
                        </div>
                        {cat.limit && (
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>Limit: {cat.limit.toFixed(2)} PLN</span>
                            <span className={cat.exceeded ? 'text-red-500 font-medium' : ''}>
                              {cat.exceeded ? `+${(cat.amount - cat.limit).toFixed(2)} PLN` : `${(cat.limit - cat.amount).toFixed(2)} PLN zostało`}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Brak wydatków w ostatnim miesiącu</p>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">Suma:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {summary.totalSpent.toFixed(2)} PLN
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Expenses Table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                {/* Filters Section */}
                <div className="p-6 border-b border-gray-200">
                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Szukaj po tytule..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>

                    {/* Filter Row */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Category Filter */}
                      <div className="relative flex-1">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Member Filter */}
                      <div className="relative flex-1">
                        <select
                          value={selectedMember}
                          onChange={(e) => setSelectedMember(e.target.value)}
                          className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                        >
                          {memberFilterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Account Type Filter */}
                      <div className="relative flex-1">
                        <select
                          value={selectedAccountType}
                          onChange={(e) => setSelectedAccountType(e.target.value)}
                          className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                        >
                          <option value="all">Wszystkie konta</option>
                          {accountTypes.map((type) => (
                            <option key={type.id} value={type.name}>
                              {type.name === 'default' ? 'Domyślne' : type.name === 'cash' ? 'Gotówka' : type.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Date Range Filters */}
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <Calendar size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <span className="text-gray-500">-</span>
                        <div className="relative">
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <Calendar size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Active Filters Summary */}
                    {(searchQuery || selectedCategory !== 'all' || selectedMember !== 'all' || selectedAccountType !== 'all' || startDate || endDate) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Pokazuję: {filteredExpenses.length} z {allExpenses.length} wydatków</span>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                            setSelectedMember('all');
                            setSelectedAccountType('all');
                            setStartDate('');
                            setEndDate('');
                          }}
                          className="text-violet-600 hover:text-violet-700 font-medium"
                        >
                          Wyczyść filtry
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table */}
                <ExpensesTable 
                  expenses={filteredExpenses}
                  onUpdate={handleExpenseUpdated}
                  onDelete={handleExpenseDeleted}
                  accountMembers={accountMembers}
                  currentUser={currentUser}
                />

                {/* Footer with count */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Wyświetlono {filteredExpenses.length} wydatków
                    </p>
                    {filteredExpenses.length > 0 && (
                      <p className="text-sm font-semibold text-gray-900">
                        Suma: {filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)} PLN
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Expense Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <PaymentModal 
          initialType="expense"
          onClose={() => setAddModalOpen(false)} 
          onSubmit={handleExpenseAdded}
        />
      </Modal>

      {/* Limits Management Modal */}
      <CategoryLimitsModal 
        isOpen={limitsModalOpen} 
        onClose={() => {
          setLimitsModalOpen(false);
          fetchData(); // Refresh data when modal closes
        }} 
      />
    </WrapperNav>
  );
}