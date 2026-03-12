import { useState, useEffect } from 'react';
import { TrendingDown, Edit2, Save, X, Trash2 } from 'lucide-react';
import { getCategoryLimits, createCategoryLimit, updateCategoryLimit, deleteCategoryLimit } from '../services/api';

export default function CategoryLimitsModal({ isOpen, onClose }) {
  const [limits, setLimits] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [editingLimitId, setEditingLimitId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'mieszkanie', label: 'Mieszkanie' },
    { value: 'jedzenie', label: 'Jedzenie' },
    { value: 'rozrywka', label: 'Rozrywka' },
    { value: 'transport', label: 'Transport' },
    { value: 'zakupy', label: 'Zakupy' },
    { value: 'inne', label: 'Inne' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchLimits();
    }
  }, [isOpen]);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      const data = await getCategoryLimits();
      setLimits(data);
    } catch (error) {
      console.error('Failed to fetch limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLimit = async () => {
    if (!newCategory || !newLimit || parseFloat(newLimit) <= 0) {
      alert('Wybierz kategorię i wprowadź dodatnią kwotę limitu');
      return;
    }

    if (limits.some(l => l.category === newCategory)) {
      alert('Limit dla tej kategorii już istnieje');
      return;
    }

    try {
      setLoading(true);
      const newLimitData = await createCategoryLimit(newCategory, parseFloat(newLimit));
      setLimits([...limits, newLimitData]);
      setNewCategory('');
      setNewLimit('');
    } catch (error) {
      console.error('Failed to add limit:', error);
      alert(error.message || 'Błąd podczas dodawania limitu');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLimit = (limit) => {
    setEditingLimitId(limit.id);
    setEditingAmount(limit.limit_amount.toString());
  };

  const handleSaveLimit = async (limitId) => {
    if (!editingAmount || parseFloat(editingAmount) <= 0) {
      alert('Wprowadź dodatnią kwotę limitu');
      return;
    }

    try {
      setLoading(true);
      const updated = await updateCategoryLimit(limitId, parseFloat(editingAmount));
      setLimits(limits.map(l => l.id === limitId ? updated : l));
      setEditingLimitId(null);
      setEditingAmount('');
    } catch (error) {
      console.error('Failed to update limit:', error);
      alert(error.message || 'Błąd podczas aktualizacji limitu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingLimitId(null);
    setEditingAmount('');
  };

  const handleDeleteLimit = async (limit) => {
    if (!confirm(`Czy na pewno chcesz usunąć limit dla kategorii "${getCategoryLabel(limit.category)}"?`)) return;

    try {
      setLoading(true);
      await deleteCategoryLimit(limit.id);
      setLimits(limits.filter(l => l.id !== limit.id));
    } catch (error) {
      console.error('Failed to delete limit:', error);
      alert(error.message || 'Błąd podczas usuwania limitu');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (categoryValue) => {
    const category = categories.find(c => c.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const getAvailableCategories = () => {
    return categories.filter(cat => !limits.some(l => l.category === cat.value));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white px-8 py-8 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Zarządzaj limitami kategorii</h2>
          <p className="text-sm text-gray-500 mt-1">Ustaw limity wydatków dla poszczególnych kategorii</p>
        </div>

        {/* Add New Limit */}
        <div className="mb-6 p-4 bg-violet-50 rounded-lg border border-violet-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Dodaj nowy limit</h3>
          <div className="flex gap-3">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={getAvailableCategories().length === 0}
            >
              <option value="">Wybierz kategorię</option>
              {getAvailableCategories().map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              placeholder="Limit (PLN)"
              min="0"
              step="0.01"
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={handleAddLimit}
              disabled={loading || !newCategory || !newLimit}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dodaj
            </button>
          </div>
          {getAvailableCategories().length === 0 && (
            <p className="text-xs text-gray-500 mt-2">Wszystkie kategorie mają już ustawione limity</p>
          )}
        </div>

        {/* Limits List */}
        <div className="border border-gray-200 rounded-lg">
          {loading && limits.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Ładowanie...</div>
          ) : limits.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <TrendingDown size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Brak ustawionych limitów</p>
              <p className="text-xs mt-1">Dodaj limit, aby śledzić wydatki</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {limits.map((limit) => (
                <li key={limit.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  {editingLimitId === limit.id ? (
                    <>
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-medium text-gray-900 min-w-[120px]">
                          {getCategoryLabel(limit.category)}
                        </span>
                        <input
                          type="number"
                          value={editingAmount}
                          onChange={(e) => setEditingAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-32 px-3 py-1 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <span className="text-sm text-gray-600">PLN</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSaveLimit(limit.id)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Zapisz"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                          <TrendingDown size={18} className="text-violet-700" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 block">
                            {getCategoryLabel(limit.category)}
                          </span>
                          <span className="text-sm text-gray-600">
                            Limit: <span className="font-semibold">{parseFloat(limit.limit_amount).toFixed(2)} PLN</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditLimit(limit)}
                          disabled={loading}
                          className="text-violet-600 hover:text-violet-700 p-2 hover:bg-violet-50 rounded-lg transition-colors"
                          title="Edytuj"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteLimit(limit)}
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

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full text-gray-600 hover:text-gray-900 font-medium py-2"
        >
          Zamknij
        </button>
      </div>
    </div>
  );
}