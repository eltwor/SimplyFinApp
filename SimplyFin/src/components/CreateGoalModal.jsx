import { useState, useEffect } from "react";
import { Target } from "lucide-react";
import { createSavingsGoal, updateSavingsGoal, getSavingsAccounts } from "../services/api";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export default function CreateGoalModal({ 
  goal = null, // If provided, we're editing
  accountMembers = [], 
  savingsAccounts = [],
  onClose, 
  onSubmit 
}) {
  const isEditing = !!goal;
  const { getRefreshCounter } = useDataRefresh();

  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: '',
    notes: '',
    account_member_id: '',
    savings_account_id: ''
  });

  const [localSavingsAccounts, setLocalSavingsAccounts] = useState(savingsAccounts);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name || '',
        target_amount: parseFloat(goal.target_amount) || '',
        deadline: goal.deadline || '',
        notes: goal.notes || '',
        account_member_id: goal.account_member_id || '',
        savings_account_id: goal.savings_account_id || ''
      });
    }
  }, [goal]);

  // Initialize local savings accounts from props
  useEffect(() => {
    setLocalSavingsAccounts(savingsAccounts);
  }, [savingsAccounts]);

  // Refetch savings accounts when they change
  useEffect(() => {
    const refetchSavingsAccounts = async () => {
      try {
        const accounts = await getSavingsAccounts();
        setLocalSavingsAccounts(accounts);
        console.log("✅ Savings accounts refreshed in CreateGoalModal");
      } catch (err) {
        console.error("Failed to refetch savings accounts:", err);
      }
    };
    
    if (getRefreshCounter('savings_accounts') > 0) {
      refetchSavingsAccounts();
    }
  }, [getRefreshCounter('savings_accounts')]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
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

    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
      newErrors.target_amount = 'Kwota docelowa musi być większa od zera';
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
        target_amount: parseFloat(formData.target_amount),
        deadline: formData.deadline || null,
        notes: formData.notes.trim() || null,
        account_member_id: formData.account_member_id ? parseInt(formData.account_member_id) : null,
        savings_account_id: formData.savings_account_id ? parseInt(formData.savings_account_id) : null
      };

      if (isEditing) {
        await updateSavingsGoal(goal.id, submitData);
      } else {
        await createSavingsGoal(submitData);
      }

      onSubmit();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert(error.message || 'Nie udało się zapisać celu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
          <Target className="text-violet-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edytuj cel' : 'Nowy cel oszczędnościowy'}
          </h2>
          <p className="text-sm text-gray-500">
            {isEditing ? 'Zaktualizuj szczegóły swojego celu' : 'Ustal nowy cel i zacznij oszczędzać'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nazwa celu *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="np. Nowy laptop, Wakacje, Fundusz awaryjny"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Target Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kwota docelowa (PLN) *
          </label>
          <input
            type="number"
            name="target_amount"
            value={formData.target_amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              errors.target_amount ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.target_amount && (
            <p className="mt-1 text-sm text-red-600">{errors.target_amount}</p>
          )}
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Termin (opcjonalnie)
          </label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Account Member */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Osoba (opcjonalnie)
          </label>
          <select
            name="account_member_id"
            value={formData.account_member_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Domyślne (Ty)</option>
            {accountMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nickname}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Przypisz cel do konkretnej osoby w rodzinie
          </p>
        </div>

        {/* Savings Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Konto oszczędnościowe (opcjonalnie)
          </label>
          <select
            name="savings_account_id"
            value={formData.savings_account_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Zwykłe oszczędności (bez konta)</option>
            {localSavingsAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.bank_name})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Połącz cel z szablonem konta oszczędnościowego
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notatki (opcjonalnie)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Dodatkowe informacje o celu..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Zapisywanie...' : (isEditing ? 'Zapisz zmiany' : 'Utwórz cel')}
          </button>
        </div>
      </form>
    </div>
  );
}