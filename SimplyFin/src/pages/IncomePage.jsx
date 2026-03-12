import { useState, useEffect } from "react";
import { ChevronDown, Calendar, Plus, Search } from "lucide-react";
import TopBar from "../components/TopBar";
import WrapperNav from "../components/WrapperNav";
import Modal from "../components/UI/Modal";
import PaymentModal from "../components/PaymentModal";
import IncomeTable from "../components/IncomeTable";
import MonthlyLineChart from "../components/MonthlyLineChart";
import { getIncome, deletePayment, getAccountMembers, getCurrentUser, getMonthlyStats, getAccountTypes } from "../services/api";

export default function IncomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMember, setSelectedMember] = useState("all");
  const [selectedAccountType, setSelectedAccountType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  // Data state
  const [allIncome, setAllIncome] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [accountMembers, setAccountMembers] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [incomeData, membersData, userData, monthlyStatsData, accountTypesData] = await Promise.all([
        getIncome(null, null, null),
        getAccountMembers(),
        getCurrentUser(),
        getMonthlyStats(6),
        getAccountTypes()
      ]);
      
      // Format income with proper date formatting
      const formattedIncome = incomeData.map(income => ({
        id: income.id,
        title: income.title,
        category: income.category,
        amount: Math.abs(parseFloat(income.amount)),
        date: formatDate(income.payment_date),
        member_nickname: income.member_nickname,
        account_member_id: income.account_member_id,
        account_type: income.account_type || 'default',
        is_recurring: income.is_recurring || false,
        recurring_frequency: income.recurring_frequency
      }));
      
      setAllIncome(formattedIncome);
      setMonthlyData(monthlyStatsData.months || []);
      setAccountMembers(membersData.filter(m => m.is_active));
      setAccountTypes(accountTypesData.filter(t => t.is_active));
      setCurrentUser(userData);
      setError(null);
    } catch (err) {
      console.error('Error fetching income:', err);
      setError('Failed to load income');
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

  const handleIncomeUpdated = () => {
    fetchData();
  };

  const handleIncomeDeleted = async (incomeId) => {
    try {
      await deletePayment(incomeId);
      fetchData();
    } catch (err) {
      console.error('Error deleting income:', err);
    }
  };

  const handleIncomeAdded = () => {
    fetchData();
    setAddModalOpen(false);
  };

  const categories = [
    { value: 'all', label: 'Wszystkie kategorie' },
    { value: 'praca', label: 'Praca' },
    { value: 'zlecenie', label: 'Zlecenie' },
    { value: 'dodatkowe', label: 'Dodatkowe' },
  ];

  // Extract unique nicknames from actual income data
  const uniqueMemberNicknames = [...new Set(
    allIncome
      .map(income => income.member_nickname)
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

  // Filter income based on all criteria
  const filteredIncome = allIncome.filter((income) => {
    // Search filter
    const matchesSearch = income.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || income.category === selectedCategory;
    
    // Member filter
    let matchesMember = true;
    if (selectedMember !== 'all') {
      if (selectedMember === 'default') {
        matchesMember = !income.member_nickname || income.member_nickname === currentUser?.nickname;
      } else {
        matchesMember = income.member_nickname === selectedMember;
      }
    }
    
    // Account type filter
    const matchesAccountType = selectedAccountType === 'all' || income.account_type === selectedAccountType;
    
    // Date range filter
    const incomeDate = new Date(income.date.split('-').reverse().join('-'));
    const matchesStartDate = !startDate || incomeDate >= new Date(startDate);
    const matchesEndDate = !endDate || incomeDate <= new Date(endDate);
    
    return matchesSearch && matchesCategory && matchesMember && matchesAccountType && matchesStartDate && matchesEndDate;
  });

  // Calculate summary for last 30 days only
  const getLast30DaysIncome = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return allIncome.filter(income => {
      const incomeDate = new Date(income.date.split('-').reverse().join('-'));
      return incomeDate >= thirtyDaysAgo;
    });
  };

  const last30DaysIncome = getLast30DaysIncome();
  const totalIncome = last30DaysIncome.reduce((sum, income) => sum + income.amount, 0);
  
  const categoryBreakdown = categories
    .filter(cat => cat.value !== 'all')
    .map(cat => {
      const categoryTotal = last30DaysIncome
        .filter(income => income.category === cat.value)
        .reduce((sum, income) => sum + income.amount, 0);
      return {
        name: cat.label,
        amount: categoryTotal
      };
    })
    .filter(cat => cat.amount > 0);

  return (
    <WrapperNav isSettingOpen={sidebarOpen}>
      <TopBar title="Dochody" openSidebar={() => setSidebarOpen(true)}>
        <button 
          onClick={() => setAddModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Dodaj dochód</span>
        </button>
      </TopBar>

      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Ładowanie dochodów...
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
                type="income"
                title="Dochody w ostatnim okresie (6 miesięcy)"
              />

              {/* Summary Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Podsumowanie (30 dni)
                  </h3>
                </div>

                <div className="space-y-4">
                  {categoryBreakdown.length > 0 ? (
                    categoryBreakdown.map((cat, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {cat.amount.toFixed(2)} PLN
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Brak dochodów</p>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">Suma:</span>
                      <span className="text-lg font-bold text-green-600">
                        {totalIncome.toFixed(2)} PLN
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Income Table */}
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
                        <span>Pokazuję: {filteredIncome.length} z {allIncome.length} dochodów</span>
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
                <IncomeTable 
                  income={filteredIncome}
                  onUpdate={handleIncomeUpdated}
                  onDelete={handleIncomeDeleted}
                  accountMembers={accountMembers}
                  currentUser={currentUser}
                />

                {/* Footer with count */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Wyświetlono {filteredIncome.length} dochodów
                    </p>
                    {filteredIncome.length > 0 && (
                      <p className="text-sm font-semibold text-green-600">
                        Suma: {totalIncome.toFixed(2)} PLN
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Income Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <PaymentModal 
          initialType="income"
          onClose={() => setAddModalOpen(false)} 
          onSubmit={handleIncomeAdded}
        />
      </Modal>
    </WrapperNav>
  );
}