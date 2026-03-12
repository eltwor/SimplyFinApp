import { useState, useEffect } from "react";
import { Building2, Plus, Edit2, Trash2, X } from "lucide-react";
import { 
  getSavingsAccounts, 
  createSavingsAccount, 
  updateSavingsAccount, 
  deleteSavingsAccount 
} from "../services/api";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export default function SavingsAccountModal({ onClose }) {
  const { triggerRefresh } = useDataRefresh();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    account_type: 'savings',
    interest_rate: '',
    start_date: new Date().toISOString().split('T')[0],
    maturity_date: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (editingAccount) {
      setFormData({
        name: editingAccount.name || '',
        bank_name: editingAccount.bank_name || '',
        account_type: editingAccount.account_type || 'savings',
        interest_rate: parseFloat(editingAccount.interest_rate) || '',
        start_date: editingAccount.start_date || new Date().toISOString().split('T')[0],
        maturity_date: editingAccount.maturity_date || '',
        notes: editingAccount.notes || ''
      });
      setShowForm(true);
    }
  }, [editingAccount]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getSavingsAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      bank_name: '',
      account_type: 'savings',
      interest_rate: '',
      start_date: new Date().toISOString().split('T')[0],
      maturity_date: '',
      notes: ''
    });
    setErrors({});
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa jest wymagana';
    }
    if (!formData.bank_name.trim()) {
      newErrors.bank_name = 'Nazwa banku jest wymagana';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Data rozpoczęcia jest wymagana';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      const submitData = {
        name: formData.name.trim(),
        bank_name: formData.bank_name.trim(),
        account_type: formData.account_type,
        interest_rate: parseFloat(formData.interest_rate) || 0,
        start_date: formData.start_date,
        maturity_date: formData.maturity_date || null,
        notes: formData.notes.trim() || null
      };

      if (editingAccount) {
        await updateSavingsAccount(editingAccount.id, submitData);
      } else {
        await createSavingsAccount(submitData);
      }

      await fetchAccounts();
      triggerRefresh('savings_accounts'); // Trigger refresh for savings accounts
      resetForm();
    } catch (error) {
      console.error('Error saving account:', error);
      alert(error.message || 'Nie udało się zapisać konta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (accountId) => {
    if (!confirm('Czy na pewno chcesz usunąć to konto oszczędnościowe?')) return;

    try {
      await deleteSavingsAccount(accountId);
      await fetchAccounts();
      triggerRefresh('savings_accounts'); // Trigger refresh for savings accounts
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Nie udało się usunąć konta');
    }
  };

  const accountTypes = [
    { value: 'savings', label: 'Standardowe oszczędności' },
    { value: 'fixed', label: 'Lokata terminowa' },
    { value: 'flexible', label: 'Lokata elastyczna' },
    { value: 'accumulation', label: 'Konto oszczędnościowe' },
    { value: 'other', label: 'Inne' }
  ];

  return (
    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
            <Building2 className="text-violet-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Konta oszczędnościowe</h2>
            <p className="text-sm text-gray-500">Zarządzaj szablonami kont bankowych</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Add New Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-4 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Dodaj nowe konto
        </button>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingAccount ? 'Edytuj konto' : 'Nowe konto'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa konta *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="np. ING Oszczędnościowe"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa banku *
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="np. ING Bank Śląski"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  errors.bank_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.bank_name && <p className="mt-1 text-sm text-red-600">{errors.bank_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ konta
              </label>
              <select
                name="account_type"
                value={formData.account_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {accountTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Oprocentowanie (%)
              </label>
              <input
                type="number"
                name="interest_rate"
                value={formData.interest_rate}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data rozpoczęcia *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  errors.start_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data zakończenia (opcjonalnie)
              </label>
              <input
                type="date"
                name="maturity_date"
                value={formData.maturity_date}
                onChange={handleChange}
                min={formData.start_date}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notatki (opcjonalnie)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Dodatkowe informacje..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:bg-gray-400 transition"
            >
              {submitting ? 'Zapisywanie...' : (editingAccount ? 'Zapisz zmiany' : 'Dodaj konto')}
            </button>
          </div>
        </form>
      )}

      {/* Accounts List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Ładowanie...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Building2 size={48} className="mx-auto mb-2 text-gray-400" />
          <p>Brak kont oszczędnościowych</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{account.name}</h4>
                  <p className="text-sm text-gray-600">{account.bank_name}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {accountTypes.find(t => t.value === account.account_type)?.label || account.account_type}
                    </span>
                    {account.interest_rate > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        {parseFloat(account.interest_rate).toFixed(2)}% rocznie
                      </span>
                    )}
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      Od {new Date(account.start_date).toLocaleDateString('pl-PL')}
                    </span>
                    {account.maturity_date && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                        Do {new Date(account.maturity_date).toLocaleDateString('pl-PL')}
                      </span>
                    )}
                  </div>
                  {account.notes && (
                    <p className="mt-2 text-sm text-gray-500 italic">{account.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingAccount(account)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edytuj"
                  >
                    <Edit2 size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Usuń"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}