import { useState, useEffect } from "react";
import { Plus, Settings, Filter, PiggyBank } from "lucide-react";
import TopBar from "../components/TopBar";
import WrapperNav from "../components/WrapperNav";
import Modal from "../components/UI/Modal";
import SavingsGoalCard from "../components/SavingsGoalCard";
import CreateGoalModal from "../components/CreateGoalModal";
import SavingsAccountModal from "../components/SavingsAccountModal";
import { 
  getSavingsGoals, 
  getSavingsStats, 
  getAccountMembers, 
  getCurrentUser,
  getSavingsAccounts 
} from "../services/api";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export default function SavingsPage() {
  const { triggerRefresh } = useDataRefresh();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [stats, setStats] = useState(null);
  const [accountMembers, setAccountMembers] = useState([]);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);
  
  // Filter states
  const [selectedMember, setSelectedMember] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [goals, selectedMember, showCompleted]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [goalsData, statsData, membersData, userData, accountsData] = await Promise.all([
        getSavingsGoals(),
        getSavingsStats(),
        getAccountMembers(),
        getCurrentUser(),
        getSavingsAccounts()
      ]);
      
      setGoals(goalsData);
      setStats(statsData);
      setAccountMembers(membersData.filter(m => m.is_active));
      setSavingsAccounts(accountsData);
      setCurrentUser(userData);
      setError(null);
    } catch (err) {
      console.error('Error fetching savings data:', err);
      setError('Failed to load savings data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...goals];
    
    // Filter by member
    if (selectedMember !== 'all') {
      if (selectedMember === 'default') {
        filtered = filtered.filter(g => !g.account_member_id);
      } else {
        filtered = filtered.filter(g => g.account_member_id === parseInt(selectedMember));
      }
    }
    
    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(g => !g.is_completed);
    }
    
    setFilteredGoals(filtered);
  };

  const handleGoalCreated = () => {
    fetchData();
    triggerRefresh('savings');
    setCreateGoalOpen(false);
  };

  const handleGoalUpdated = () => {
    fetchData();
    triggerRefresh('savings');
  };

  const handleGoalDeleted = () => {
    fetchData();
    triggerRefresh('savings');
  };

  // Create member filter options
  const memberFilterOptions = [
    { value: 'all', label: 'Wszystkie osoby' },
    { value: 'default', label: currentUser?.nickname || 'Ty (domyślne)' },
    ...accountMembers.map(member => ({
      value: member.id.toString(),
      label: member.nickname
    }))
  ];

  return (
    <WrapperNav isSettingOpen={sidebarOpen}>
      <TopBar title="Oszczędności" openSidebar={() => setSidebarOpen(true)}>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setCreateGoalOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nowy cel</span>
          </button>
          <button 
            onClick={() => setAccountsModalOpen(true)}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Konta</span>
          </button>
        </div>
      </TopBar>

      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Ładowanie oszczędności...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Aktywne cele</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.active_goals}</p>
                    </div>
                    <PiggyBank className="text-violet-600" size={32} />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Ukończone cele</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completed_goals}</p>
                    </div>
                    <div className="text-green-600 text-2xl">✓</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div>
                    <p className="text-sm text-gray-500">Zaoszczędzono</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_saved.toFixed(2)} PLN</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div>
                    <p className="text-sm text-gray-500">Cel łączny</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_target.toFixed(2)} PLN</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-violet-600 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, stats.overall_progress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filtry:</span>
                </div>

                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {memberFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700">Pokaż ukończone</span>
                </label>

                {(selectedMember !== 'all' || showCompleted) && (
                  <button
                    onClick={() => {
                      setSelectedMember('all');
                      setShowCompleted(false);
                    }}
                    className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                  >
                    Wyczyść filtry
                  </button>
                )}
              </div>
            </div>

            {/* Goals Grid */}
            {filteredGoals.length === 0 ? (
              <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
                <PiggyBank size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {goals.length === 0 ? 'Brak celów oszczędnościowych' : 'Brak celów spełniających kryteria'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {goals.length === 0 
                    ? 'Zacznij oszczędzać, tworząc swój pierwszy cel!' 
                    : 'Spróbuj zmienić filtry lub dodaj nowy cel.'}
                </p>
                {goals.length === 0 && (
                  <button 
                    onClick={() => setCreateGoalOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center space-x-2"
                  >
                    <Plus size={18} />
                    <span>Stwórz cel</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredGoals.map((goal) => (
                  <SavingsGoalCard
                    key={goal.id}
                    goal={goal}
                    accountMembers={accountMembers}
                    savingsAccounts={savingsAccounts}
                    currentUser={currentUser}
                    onUpdate={handleGoalUpdated}
                    onDelete={handleGoalDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Goal Modal */}
      <Modal isOpen={createGoalOpen} onClose={() => setCreateGoalOpen(false)}>
        <CreateGoalModal 
          onClose={() => setCreateGoalOpen(false)} 
          onSubmit={handleGoalCreated}
          accountMembers={accountMembers}
          savingsAccounts={savingsAccounts}
        />
      </Modal>

      {/* Savings Accounts Management Modal */}
      <Modal isOpen={accountsModalOpen} onClose={() => setAccountsModalOpen(false)}>
        <SavingsAccountModal 
          onClose={() => {
            setAccountsModalOpen(false);
            fetchData(); // Refresh to get updated accounts
          }}
        />
      </Modal>
    </WrapperNav>
  );
}