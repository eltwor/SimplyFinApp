import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, DollarSign, PiggyBank, CreditCard, Menu, X, User, Settings, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentUser, getPaymentSuggestions } from '../services/api';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import SettingsModal from './SettingsModal';
import NotificationModal from './NotificationModal';

// Sidebar Navigation Component
export default function Sidebar({ isOpen, setIsOpen }) {
  const menuItems = [
    { icon: Home, label: 'Główna', path: '/dashboard' },
    { icon: ShoppingCart, label: 'Wydatki', path: '/expenses' },
    { icon: DollarSign, label: 'Zarobki', path: '/income' },
    { icon: PiggyBank, label: 'Oszczędności', path: '/savings' },
  ];
  
  const [userInfo, setUserInfo] = useState({nickname: '', email: ''});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Get refresh system
  const { refreshTriggers } = useDataRefresh();

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Fetch notification count on mount AND when suggestions change
  useEffect(() => {
    fetchNotificationCount();
  }, [refreshTriggers.suggestions, refreshTriggers.payments]);

  const fetchUser = async () => {
    try {
      const dataUser = await getCurrentUser();
      setUserInfo(dataUser);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const suggestions = await getPaymentSuggestions();
      setNotificationCount(suggestions.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleNotificationsClose = () => {
    setNotificationsOpen(false);
    // Refresh notification count after closing
    fetchNotificationCount();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SF</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-violet-600">SimplyFin</h2>
                <p className="text-xs text-gray-500">Prostsze finansowanie!</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{userInfo.nickname}</p>
              <p className="text-xs text-gray-500">{userInfo.email}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `
                      flex items-center space-x-3 px-4 py-3 rounded-lg
                      transition-colors duration-200
                      ${isActive 
                        ? 'bg-violet-50 text-violet-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Icons */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-around">
              <button 
                onClick={() => setSettingsOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ustawienia"
              >
                <Settings size={20} />
              </button>
              <button 
                onClick={() => setNotificationsOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative transition-colors"
                title="Powiadomienia"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />

      {/* Notifications Modal */}
      <NotificationModal 
        isOpen={notificationsOpen} 
        onClose={handleNotificationsClose}
        onUpdate={fetchNotificationCount}
      />
    </>
  );
}