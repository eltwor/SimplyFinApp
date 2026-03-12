import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserPlus, Trash2, Users, Edit2, Save, X, CreditCard } from 'lucide-react';
import { 
  getAccountMembers, 
  createAccountMember, 
  deleteAccountMember,
  updateAccountMember,
  getAccountTypes,
  createAccountType,
  updateAccountType,
  deleteAccountType,
  logoutUser
} from '../services/api';

export default function SettingsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [newName, setNewName] = useState('');
  const [accountMembers, setAccountMembers] = useState([]);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  
  const [newAccountType, setNewAccountType] = useState('');
  const [accountTypes, setAccountTypes] = useState([]);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [members, types] = await Promise.all([
        getAccountMembers(),
        getAccountTypes()
      ]);
      setAccountMembers(members.filter(m => m.is_active));
      setAccountTypes(types.filter(t => t.is_active));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onClose();
    logoutUser();
  };

  // Account Members Functions
  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      alert('Wprowadź imię i nazwisko');
      return;
    }

    if (accountMembers.some(m => m.nickname === newName.trim())) {
      alert('Ta osoba już istnieje na liście');
      return;
    }

    if (accountMembers.length >= 10) {
      alert('Maksymalna liczba osób to 10');
      return;
    }

    try {
      setLoading(true);
      const newMember = await createAccountMember(newName.trim());
      setAccountMembers([...accountMembers, newMember]);
      setNewName('');
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Błąd podczas dodawania osoby');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = (member) => {
    setEditingMemberId(member.id);
    setEditingMemberName(member.nickname);
  };

  const handleSaveMember = async (memberId) => {
    if (!editingMemberName.trim()) {
      alert('Nazwa nie może być pusta');
      return;
    }

    if (accountMembers.some(m => m.nickname === editingMemberName.trim() && m.id !== memberId)) {
      alert('Ta nazwa już istnieje');
      return;
    }

    try {
      setLoading(true);
      const updated = await updateAccountMember(memberId, editingMemberName.trim());
      setAccountMembers(accountMembers.map(m => m.id === memberId ? updated : m));
      setEditingMemberId(null);
      setEditingMemberName('');
    } catch (error) {
      console.error('Failed to update member:', error);
      alert('Błąd podczas aktualizacji');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditMember = () => {
    setEditingMemberId(null);
    setEditingMemberName('');
  };

  const handleRemoveMember = async (member) => {
    if (!confirm(`Czy na pewno chcesz usunąć "${member.nickname}"?`)) return;

    try {
      setLoading(true);
      await deleteAccountMember(member.id);
      setAccountMembers(accountMembers.filter(m => m.id !== member.id));
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Błąd podczas usuwania osoby');
    } finally {
      setLoading(false);
    }
  };

  // Account Types Functions
  const handleAddAccountType = async (e) => {
    e.preventDefault();
    
    if (!newAccountType.trim()) {
      alert('Wprowadź nazwę typu konta');
      return;
    }

    if (accountTypes.some(t => t.name === newAccountType.trim())) {
      alert('Ten typ konta już istnieje');
      return;
    }

    if (accountTypes.length >= 20) {
      alert('Maksymalna liczba typów kont to 20');
      return;
    }

    try {
      setLoading(true);
      const newType = await createAccountType(newAccountType.trim());
      setAccountTypes([...accountTypes, newType]);
      setNewAccountType('');
    } catch (error) {
      console.error('Failed to add account type:', error);
      alert('Błąd podczas dodawania typu konta');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccountType = (type) => {
    // Don't allow editing system types
    if (type.name === 'default' || type.name === 'cash') {
      return;
    }
    setEditingTypeId(type.id);
    setEditingTypeName(type.name);
  };

  const handleSaveAccountType = async (typeId) => {
    if (!editingTypeName.trim()) {
      alert('Nazwa nie może być pusta');
      return;
    }

    if (accountTypes.some(t => t.name === editingTypeName.trim() && t.id !== typeId)) {
      alert('Ta nazwa już istnieje');
      return;
    }

    try {
      setLoading(true);
      const updated = await updateAccountType(typeId, editingTypeName.trim());
      setAccountTypes(accountTypes.map(t => t.id === typeId ? updated : t));
      setEditingTypeId(null);
      setEditingTypeName('');
    } catch (error) {
      console.error('Failed to update account type:', error);
      alert(error.message || 'Błąd podczas aktualizacji');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditAccountType = () => {
    setEditingTypeId(null);
    setEditingTypeName('');
  };

  const getAccountTypeDisplayName = (name) => {
    const translations = {
      'default': 'Domyślne',
      'cash': 'Gotówka'
    };
    return translations[name] || name;
  };

  const handleRemoveAccountType = async (type) => {
    if (type.name === 'default' || type.name === 'cash') {
      alert('Nie można usunąć systemowych typów kont');
      return;
    }

    if (!confirm(`Czy na pewno chcesz usunąć "${type.name}"? Wszystkie płatności z tym typem zostaną zmienione na "default".`)) return;

    try {
      setLoading(true);
      await deleteAccountType(type.id);
      setAccountTypes(accountTypes.filter(t => t.id !== type.id));
    } catch (error) {
      console.error('Failed to remove account type:', error);
      alert(error.message || 'Błąd podczas usuwania typu konta');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 overflow-y-auto py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white px-8 py-8 shadow-xl my-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Ustawienia</h2>
          <p className="text-sm text-gray-500 mt-1">Zarządzaj swoim kontem</p>
        </div>

        {/* Account Members Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Users size={20} className="text-violet-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Osoby na koncie
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Dodaj osoby, które będą mogły dodawać płatności do konta (maks. 10)
          </p>

          <div onSubmit={handleAddMember} className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Wprowadź imię i nazwisko"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              maxLength={50}
            />
            <button
              type="button"
              onClick={handleAddMember}
              disabled={accountMembers.length >= 10 || loading}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={18} />
              <span>Dodaj</span>
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {loading && accountMembers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Ładowanie...</div>
            ) : accountMembers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Brak osób na koncie</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {accountMembers.map((member) => (
                  <li key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    {editingMemberId === member.id ? (
                      <>
                        <input
                          type="text"
                          value={editingMemberName}
                          onChange={(e) => setEditingMemberName(e.target.value)}
                          className="flex-1 px-3 py-1 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          maxLength={50}
                        />
                        <div className="flex items-center space-x-2 ml-2">
                          <button
                            onClick={() => handleSaveMember(member.id)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Zapisz"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={handleCancelEditMember}
                            disabled={loading}
                            className="text-gray-600 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Anuluj"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-violet-700">
                              {member.nickname.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{member.nickname}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditMember(member)}
                            disabled={loading}
                            className="text-violet-600 hover:text-violet-700 p-2 hover:bg-violet-50 rounded-lg transition-colors"
                            title="Edytuj"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Usuń"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">{accountMembers.length}/10 osób</p>
        </div>

        {/* Account Types Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <CreditCard size={20} className="text-violet-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Typy kont
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Zarządzaj typami kont płatności (maks. 20)
          </p>

          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newAccountType}
              onChange={(e) => setNewAccountType(e.target.value)}
              placeholder="Wprowadź nazwę typu konta"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              maxLength={50}
            />
            <button
              type="button"
              onClick={handleAddAccountType}
              disabled={accountTypes.length >= 20 || loading}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={18} />
              <span>Dodaj</span>
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {loading && accountTypes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Ładowanie...</div>
            ) : accountTypes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Brak typów kont</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {accountTypes.map((type) => (
                  <li key={type.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    {editingTypeId === type.id ? (
                      <>
                        <input
                          type="text"
                          value={editingTypeName}
                          onChange={(e) => setEditingTypeName(e.target.value)}
                          className="flex-1 px-3 py-1 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                          maxLength={50}
                        />
                        <div className="flex items-center space-x-2 ml-2">
                          <button
                            onClick={() => handleSaveAccountType(type.id)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Zapisz"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={handleCancelEditAccountType}
                            disabled={loading}
                            className="text-gray-600 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Anuluj"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                            <CreditCard size={18} className="text-violet-700" />
                          </div>
                          <span className="font-medium text-gray-900">{getAccountTypeDisplayName(type.name)}</span>
                          {(type.name === 'default' || type.name === 'cash') && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                              Systemowy
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {type.name !== 'default' && type.name !== 'cash' && (
                            <button
                              onClick={() => handleEditAccountType(type)}
                              disabled={loading}
                              className="text-violet-600 hover:text-violet-700 p-2 hover:bg-violet-50 rounded-lg transition-colors"
                              title="Edytuj"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {type.name !== 'default' && type.name !== 'cash' && (
                            <button
                              onClick={() => handleRemoveAccountType(type)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Usuń"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">{accountTypes.length}/20 typów kont</p>
        </div>

        {/* Logout Section */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <LogOut size={20} />
            <span>Wyloguj się</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-4 w-full text-gray-600 hover:text-gray-900 font-medium py-2"
        >
          Zamknij
        </button>
      </div>
    </div>
  );
}